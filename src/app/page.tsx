import dayjs from "dayjs";
import type { Metadata } from "next";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getInitialTrains } from "~/lib/digitraffic";
import { env } from "~/lib/env";
import { HomePage } from "./_components/HomePage";

const description =
  "VenaaRauhassa on palvelu, jolla näet junien istuimien tilanteen asemakohtaisesti. Näin mahdollisuutesi kasvavat, että saat istua rauhassa.";

export const metadata: Metadata = {
  title: "VenaaRauhassa",
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
  ],
  alternates: { canonical: getBaseURL() + "/" },
  openGraph: {
    type: "website",
    title: "VenaaRauhassa",
    description,
    url: getBaseURL() + "/",
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const queryDate = typeof query.date === "string" ? query.date : undefined;
  const initialDate = dayjs(
    queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate) ? queryDate : undefined
  ).format("YYYY-MM-DD");
  const maintenance = isInMaintenance();
  const initialTrains = maintenance ? [] : await getInitialTrains(initialDate);

  return (
    <HomePage
      maintenance={maintenance}
      frontMessage={env.FRONT_MESSAGE}
      initialDate={initialDate}
      initialTrains={initialTrains}
    />
  );
}
