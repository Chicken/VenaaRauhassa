import { LeftCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";
import { type GetServerSideProps, type InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ZodError } from "zod";
import { MiniMap } from "~/components/MiniMap";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getStations } from "~/lib/digitraffic";
import { getTrainOnDate } from "~/lib/vr";
import { useStickyState } from "~/lib/hooks/useStickyState";
import { error } from "~/lib/logger";
import { LegendModal } from "~/components/LegendModal";
import type { Train, Station, Wagon } from "~/types";
import { SeatSlider } from "~/components/SeatSlider";
import { WagonMap } from "~/components/WagonMap";
import { SeatFinder } from "~/components/SeatFinder";
import { useSyncUrlState } from "~/lib/hooks/useSyncUrlState";
import { useSliderStyling } from "~/lib/hooks/useSliderStyling";
import { useDraggableMap } from "~/lib/hooks/useDraggableMap";
import { useSeatScroll } from "~/lib/hooks/useSeatScroll";
import { useSeatSelection } from "~/lib/hooks/useSeatSelection";
import { getDescription, processStations, processWagons } from "~/lib/trainUtils";
import { ErrorComponent } from "~/components/ErrorComponent";

// TODO: site is slow, have some sort of loading skeleton, also for index

export default function TrainPage({
  state,
  date,
  initialRange,
  initialSelectedSeat,
  train,
  stations,
  wagons,
  maintenance,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  // if (process.env.NODE_ENV === "development") console.debug(state, train, stations, wagons);

  const router = useRouter();
  const [messageApi, messageContextHolder] = message.useMessage();

  const [mainMapRef, setMainMapRef] = useState<HTMLDivElement | null>(null);

  const [timeRange, setTimeRange] = useState<number[]>(initialRange ?? [0, 0]);
  const [LModalOpen, setLModalOpen] = useState<boolean>(false);
  const [missingModalOpen, setMissingModalOpen] = useState<boolean>(false);
  // some weird antd modal hydration issues
  useEffect(() => setMissingModalOpen(true), []);

  const [selectedSeat, setSelectedSeat] = useState<number[] | null>(initialSelectedSeat ?? null);

  const [heatmapEnabled, setHeatmapEnabled] = useStickyState("heatmapEnabled", true);

  useEffect(() => {
    // @ts-expect-error no types for globally available plausible function
    if (window.plausible) {
      // @ts-expect-error no types for globally available plausible function
      // eslint-disable-next-line
      window.plausible("pageview", {
        u: (window.location.origin + window.location.pathname)
          .split("/")
          .filter((_, i) => i != 4)
          .join("/"),
      });
    }
  }, []);

  useSyncUrlState(router, train, stations, timeRange, selectedSeat);

  const isInComplete = useMemo(
    () =>
      wagons
        ? wagons.some((w) =>
            w.floors.some((f) => f.seats.some((s) => s.status.some((ss) => ss === "missing")))
          )
        : false,
    [wagons]
  );
  const missingRanges = useMemo(
    () =>
      wagons && stations
        ? stations.map((_, i) =>
            wagons.some((w) => w.floors.some((f) => f.seats.some((s) => s.status[i] === "missing")))
          )
        : [],
    [wagons, stations]
  );

  useSeatScroll(selectedSeat, mainMapRef);

  const { changeSeatSelection } = useSeatSelection(mainMapRef, setSelectedSeat);

  useSliderStyling(timeRange, selectedSeat, wagons, isInComplete, missingRanges);

  useEffect(() => {
    router.prefetch(date ? `/?date=${date}` : "/").catch(console.error);
  }, [router, date]);

  useDraggableMap(mainMapRef, setSelectedSeat, changeSeatSelection);

  if (state === "error") {
    return <ErrorComponent maintenance={maintenance} date={date} />;
  }

  if (state !== "success") {
    return (
      <div style={{ textAlign: "center" }}>
        <Head>
          <title>VenaaRauhassa - 404</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        {state === "train-not-found" ? (
          <h1>Junaa ei löytynyt...</h1>
        ) : (
          <h1>Juna on lähtenyt jo aikoja sitten...</h1>
        )}
        <Button
          onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}
        >
          <LeftCircleOutlined /> Takaisin
        </Button>
      </div>
    );
  }

  const fiDate = train.departureDate.split("-").reverse().map(Number).join(".");

  // TODO: when range is set, show cooler metadata information for embeds
  // TODO: when seat is set, show cooler metadata information for embeds

  const siteTitle = `VenaaRauhassa - ${train.trainType}${train.trainNumber} - ${fiDate}`;

  const description = getDescription(wagons, train, stations);

  const url = `${getBaseURL()}/train/${train.departureDate}/${train.trainNumber}`;
  const tags = [
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
    train.trainNumber,
    fiDate,
    ...stations.map((station) => station.station.replace(" asema", "")),
  ];

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta property="og:title" content={siteTitle} />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <meta name="keywords" content={tags.join(",")} />
        <meta property="og:url" content={url} />
        <link rel="canonical" href={url} />
      </Head>

      {messageContextHolder}

      {isInComplete ? (
        <Modal
          title="Osasta matkaa ei voitu hakea tietoja"
          open={missingModalOpen}
          onOk={() => setMissingModalOpen(false)}
          onCancel={() => setMissingModalOpen(false)}
          footer={null}
        >
          <p>
            Osa ominaisuuksista on poistettu käytöstä ja tiedot eivät välttämättä pidä paikkaansa.
            Näet aikajanalla tumman harmaalla kohdat, joista tietoja ei ole saatavilla.
          </p>
        </Modal>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}
            >
              <LeftCircleOutlined /> Takaisin
            </Button>
            <h1 className="train-title">
              {fiDate}
              <span style={{ marginLeft: "5px" }}>{train.trainType + train.trainNumber}</span>
            </h1>
            <div style={{ marginLeft: "auto" }}>
              <Button
                onClick={() => {
                  // @ts-expect-error no types for globally available plausible function
                  // eslint-disable-next-line
                  if (window.plausible) window.plausible("Press Help");
                  setLModalOpen(true);
                }}
              >
                <QuestionCircleOutlined />
              </Button>
            </div>
          </div>

          <div
            style={{
              paddingTop: "0.5em",
              paddingLeft: "2em",
              paddingBottom: "calc(8px + 1vw)",
              overflowX: "scroll",
              overflowY: "hidden",
            }}
          >
            <SeatSlider
              stations={stations}
              timeRange={timeRange}
              selectedSeat={selectedSeat}
              wagons={wagons}
              setTimeRange={setTimeRange}
            />
          </div>

          <WagonMap
            wagons={wagons}
            timeRange={timeRange}
            selectedSeat={selectedSeat}
            heatmapEnabled={heatmapEnabled}
            setMainMapRef={setMainMapRef}
          />

          <MiniMap
            wagons={wagons.filter(
              (wagon) => wagon.placeType !== "VEHICLE" && !["EIL", "EILF"].includes(wagon.type)
            )}
            mainMapRef={mainMapRef}
          />

          {isInComplete ? null : (
            <SeatFinder
              wagons={wagons}
              timeRange={timeRange}
              messageApi={messageApi}
              selectedSeat={selectedSeat}
              changeSeatSelection={changeSeatSelection}
            />
          )}
        </div>

        <div
          style={{
            marginTop: "2em",
            textAlign: "center",
            width: "100%",
            /*    backgroundColor:'red' */
          }}
        >
          <a
            style={{
              color: "#B1B0B0",
              fontSize: "10px",
              marginLeft: "10px",
              marginRight: "10px",
              textDecoration: "underline",
            }}
            href="https://www.vr.fi/"
          >
            Paikkakarttojen lähde <span style={{ fontStyle: "italic" }}>VR-Yhtymä Oyj</span>
          </a>

          <br />

          <a
            style={{
              color: "#B1B0B0",
              fontSize: "10px",
              marginLeft: "10px",
              marginRight: "10px",
              textDecoration: "underline",
            }}
            href="https://www.digitraffic.fi/kayttoehdot/"
          >
            Liikennetietojen lähde Fintraffic / digitraffic.fi, lisenssi CC 4.0 BY
          </a>

          <p
            style={{
              color: "#B1B0B0",
              fontSize: "10px",
              marginLeft: "10px",
              marginRight: "10px",
              marginTop: "5px",
            }}
          >
            Emme ole <span style={{ fontStyle: "italic" }}>VR-Yhtymä Oyj:n</span>, sen
            tytäryhtiöiden tai sen yhteistyökumppanien kanssa sidoksissa tai millään tavalla
            virallisesti yhteydessä niihin. Virallinen verkkosivusto on osoitteessa{" "}
            <a style={{ color: "#B1B0B0", textDecoration: "underline" }} href="https://www.vr.fi/">
              www.vr.fi
            </a>
            .
          </p>
        </div>
      </div>

      <LegendModal
        IsOpen={LModalOpen}
        setIsOpen={setLModalOpen}
        heatmapEnabled={heatmapEnabled}
        setHeatmapEnabled={setHeatmapEnabled}
      />
    </>
  );
}

export const getServerSideProps = (async (context) => {
  if (isInMaintenance()) {
    return {
      props: {
        state: "error",
        maintenance: true,
      },
    };
  }

  context.res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  if (
    !context.params ||
    typeof context.params.date !== "string" ||
    typeof context.params.train !== "string"
  ) {
    return { props: { state: "error" } };
  }

  const date = new Date(context.params.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(context.params.date) || Number.isNaN(date.getTime())) {
    return { props: { state: "error" } };
  }

  if (date.getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000) {
    return {
      props: {
        state: "train-too-old",
      },
    };
  }

  try {
    const [train, allStations] = await Promise.all([
      getTrainOnDate(context.params.date, context.params.train),
      getStations(),
    ]);

    if (!train) {
      return {
        props: {
          state: "train-not-found",
          date: context.params.date,
        },
      };
    }

    const stations = processStations(train, allStations);

    const wagons = processWagons(train);

    let initialRange: number[] | null = [0, train.timeTableRows.length];
    let initialSelectedSeat: number[] | null = null;

    if (typeof context.query.from === "string" && typeof context.query.to === "string") {
      const rangeStart = stations.findIndex((s) => s.stationShortCode === context.query.from);
      const rangeEnd = stations.findIndex((s) => s.stationShortCode === context.query.to);
      if (rangeStart >= 0 && rangeEnd > 0 && rangeStart < rangeEnd) {
        initialRange = [rangeStart, rangeEnd];
      }
    }

    if (typeof context.query.seat === "string") {
      const seat = context.query.seat.split("-").map((s) => parseInt(s));
      if (
        seat.length === 2 &&
        !isNaN(seat[0]!) &&
        !isNaN(seat[1]!) &&
        wagons.some(
          (w) =>
            w.number === seat[0] && w.floors.some((f) => f.seats.some((s) => s.number === seat[1]))
        )
      ) {
        initialSelectedSeat = seat;
      }
    }

    return {
      props: {
        state: "success",
        date: context.params.date,
        initialRange,
        initialSelectedSeat,
        train,
        stations,
        wagons,
      },
    };
  } catch (e: unknown) {
    console.error("train server props", e);
    if (e instanceof ZodError) {
      console.error(e.issues, e.issues[0]);
    }
    await error(
      {
        date: context.params.date,
        train: context.params.train,
        ...(e instanceof Error
          ? {
              message: e.message,
            }
          : {}),
        url: "<" + getBaseURL() + context.resolvedUrl + ">",
      },
      e
    );
    context.res.statusCode = 500;
    return { props: { state: "error", date: context.params.date } };
  }
}) satisfies GetServerSideProps<
  (
    | {
        state: "success";
        initialRange: number[];
        initialSelectedSeat: number[] | null;
        train: Train;
        stations: Station[];
        wagons: Wagon[];
      }
    | {
        state: "train-not-found";
      }
    | {
        state: "train-too-old";
      }
    | {
        state: "error";
        maintenance?: boolean;
      }
  ) & { date?: string }
>;
