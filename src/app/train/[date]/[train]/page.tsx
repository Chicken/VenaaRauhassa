import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache } from "react";
import { ZodError } from "zod";
import { ErrorComponent } from "~/components/ErrorComponent";
import { RateLimitedComponent } from "~/components/RateLimitedComponent";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getStations } from "~/lib/digitraffic";
import { error as logError } from "~/lib/logger";
import { checkRateLimit, getIp } from "~/lib/rateLimit";
import {
  getDescription,
  processStations,
  processTrainDisplayInfo,
  processWagons,
} from "~/lib/trainUtils";
import { getTrainOnDate } from "~/lib/vr";
import type { Station, Train, TrainDisplayInfo, Wagon } from "~/types";
import { TrainNotFound, TrainPageClient } from "./_components/TrainPageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { date: string; train: string };
type SearchParams = Record<string, string | string[] | undefined>;
type PageProperties = {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
};

type LoadResult =
  | { state: "invalid-params"; date?: string }
  | { state: "rate-limited"; retryAfter: number; date: string }
  | { state: "train-not-found"; date: string }
  | { state: "train-too-old"; date: string }
  | { state: "error"; date?: string; maintenance?: boolean }
  | {
      state: "success";
      date: string;
      initialRange: number[];
      initialSelectedSeat: number[] | null;
      fetchedAt: number;
      train: Omit<Train, "timeTableRows">;
      stations: Station[];
      wagons: Wagon[];
      trainDisplayInfo: TrainDisplayInfo;
    };

const singleValue = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const loadTrain = cache(
  async (
    rawDate: string,
    rawTrain: string,
    from: string | undefined,
    to: string | undefined,
    selectedSeat: string | undefined,
    ip: string
  ): Promise<LoadResult> => {
    if (isInMaintenance()) {
      return { state: "error", maintenance: true };
    }

    if (!/^\d+$/.test(rawTrain)) {
      return { state: "invalid-params", date: rawDate };
    }

    const date = new Date(rawDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || Number.isNaN(date.getTime())) {
      return { state: "invalid-params", date: rawDate };
    }

    if (date.getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000) {
      return { state: "train-too-old", date: rawDate };
    }

    const cachedAt = getTrainOnDate.cacheTimestamp(rawDate, rawTrain);
    const isCacheMiss = cachedAt === null || Date.now() - cachedAt >= getTrainOnDate.freshTimeMs;
    if (isCacheMiss) {
      const retryAfter = checkRateLimit(ip);
      if (retryAfter !== null) {
        return { state: "rate-limited", retryAfter, date: rawDate };
      }
    }

    try {
      const [train, allStations] = await Promise.all([
        getTrainOnDate(rawDate, rawTrain),
        getStations(),
      ]);

      if (!train) {
        return { state: "train-not-found", date: rawDate };
      }

      const stations = processStations(train, allStations);
      const wagons = processWagons(train);
      const trainDisplayInfo = processTrainDisplayInfo(train, allStations);
      const fetchedAt = getTrainOnDate.cacheTimestamp(rawDate, rawTrain) ?? Date.now();

      let initialRange = [0, stations.length - 1];
      let initialSelectedSeat: number[] | null = null;

      if (from && to) {
        const rangeStart = stations.findIndex((station) => station.stationShortCode === from);
        const rangeEnd = stations.findIndex((station) => station.stationShortCode === to);
        if (rangeStart >= 0 && rangeEnd > 0 && rangeStart < rangeEnd) {
          initialRange = [rangeStart, rangeEnd];
        }
      }

      if (selectedSeat) {
        const seat = selectedSeat.split("-").map((value) => Number.parseInt(value, 10));
        if (
          seat.length === 2 &&
          !Number.isNaN(seat[0]) &&
          !Number.isNaN(seat[1]) &&
          wagons.some(
            (wagon) =>
              wagon.number === seat[0] &&
              wagon.floors.some((floor) =>
                floor.seats.some((candidate) => candidate.number === seat[1])
              )
          )
        ) {
          initialSelectedSeat = seat;
        }
      }

      return {
        state: "success",
        date: rawDate,
        initialRange,
        initialSelectedSeat,
        fetchedAt,
        train: {
          trainNumber: train.trainNumber,
          trainType: train.trainType,
          departureDate: train.departureDate,
        },
        stations,
        wagons,
        trainDisplayInfo,
      };
    } catch (error: unknown) {
      console.error("train server page", error);
      if (error instanceof ZodError) {
        console.error(error.issues, error.issues[0]);
      }
      void logError(
        {
          date: rawDate,
          train: rawTrain,
          error: error instanceof Error ? error.message : undefined,
          url: `<${getBaseURL()}/train/${rawDate}/${rawTrain}>`,
        },
        error
      ).catch(console.error);
      throw error;
    }
  }
);

async function resolveTrainRequest({ params, searchParams }: PageProperties) {
  const [routeParams, query, requestHeaders] = await Promise.all([params, searchParams, headers()]);

  return loadTrain(
    routeParams.date,
    routeParams.train,
    singleValue(query.from),
    singleValue(query.to),
    singleValue(query.seat),
    getIp(requestHeaders)
  );
}

export async function generateMetadata(properties: PageProperties): Promise<Metadata> {
  let result: LoadResult;
  try {
    result = await resolveTrainRequest(properties);
  } catch {
    return {
      title: "VenaaRauhassa - Virhe",
      robots: { index: false, follow: false },
    };
  }

  if (result.state !== "success") {
    const title =
      result.state === "rate-limited"
        ? "VenaaRauhassa - Liian monta pyyntöä"
        : result.state === "error"
          ? "VenaaRauhassa - Virhe"
          : "VenaaRauhassa - 404";
    return { title, robots: { index: false, follow: false } };
  }

  const { train, stations, wagons } = result;
  const fiDate = train.departureDate.split("-").reverse().map(Number).join(".");
  const title = `VenaaRauhassa - ${train.trainType}${train.trainNumber} - ${fiDate}`;
  const description = getDescription(wagons, train, stations);
  const url = `${getBaseURL()}/train/${train.departureDate}/${train.trainNumber}`;

  return {
    title,
    description,
    keywords: [
      "venaarauhassa",
      "venaarauhas",
      "venaa",
      "rauhassa",
      "rauhas",
      "vr",
      "juna",
      "paikka",
      "kartta",
      "asema",
      train.trainType + train.trainNumber,
      train.trainType === "IC" ? "intercity" : "pendolino",
      String(train.trainNumber),
      fiDate,
      ...stations.map((station) => station.station.replace(" asema", "")),
    ],
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url },
  };
}

export default async function TrainPage(properties: PageProperties) {
  const result = await resolveTrainRequest(properties);

  if (result.state === "error") {
    return (
      <ErrorComponent
        message={
          result.maintenance
            ? "Palvelu huoltokatkolla..."
            : "Virhe tapahtui junaa haettaessa, yritä uudelleen"
        }
        showReload={!result.maintenance}
        showFeedback={!result.maintenance}
        date={result.date}
      />
    );
  }

  if (result.state === "rate-limited") {
    return <RateLimitedComponent retryAfter={result.retryAfter} date={result.date} />;
  }

  if (result.state === "invalid-params") {
    return (
      <ErrorComponent
        message="Virheellinen URL-osoite, tarkista linkki!"
        showFeedback={false}
        date={result.date}
      />
    );
  }

  if (result.state === "train-not-found" || result.state === "train-too-old") {
    return <TrainNotFound date={result.date} tooOld={result.state === "train-too-old"} />;
  }

  return (
    <TrainPageClient
      date={result.date}
      initialRange={result.initialRange}
      initialSelectedSeat={result.initialSelectedSeat}
      fetchedAt={result.fetchedAt}
      train={result.train}
      stations={result.stations}
      wagons={result.wagons}
      trainDisplayInfo={result.trainDisplayInfo}
    />
  );
}
