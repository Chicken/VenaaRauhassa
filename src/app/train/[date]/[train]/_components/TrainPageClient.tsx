"use client";

import { LeftCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { LegendModal } from "~/components/LegendModal";
import { MiniMap } from "~/components/MiniMap";
import { SeatFinder } from "~/components/SeatFinder";
import { SeatSlider } from "~/components/SeatSlider";
import { WagonMap } from "~/components/WagonMap";
import { formatShortFinnishTime } from "~/lib/dateUtilities";
import { useDraggableMap } from "~/lib/hooks/useDraggableMap";
import { useSeatScroll } from "~/lib/hooks/useSeatScroll";
import { useSeatSelection } from "~/lib/hooks/useSeatSelection";
import { useSliderStyling } from "~/lib/hooks/useSliderStyling";
import { useStickyState } from "~/lib/hooks/useStickyState";
import { useSyncUrlState } from "~/lib/hooks/useSyncUrlState";
import type { Station, Train, TrainDisplayInfo, Wagon } from "~/types";

type Props = {
  date: string;
  initialRange: number[];
  initialSelectedSeat: number[] | null;
  fetchedAt: number;
  train: Omit<Train, "timeTableRows">;
  stations: Station[];
  wagons: Wagon[];
  trainDisplayInfo: TrainDisplayInfo;
};

export function TrainPageClient({
  date,
  initialRange,
  initialSelectedSeat,
  fetchedAt,
  train,
  stations,
  wagons,
  trainDisplayInfo,
}: Props) {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [mainMapRef, setMainMapRef] = useState<HTMLDivElement | null>(null);
  const [fetchedMinutesAgo, setFetchedMinutesAgo] = useState<number | null>(null);

  useEffect(() => {
    setFetchedMinutesAgo(Math.floor((Date.now() - fetchedAt) / 60_000));
    const interval = setInterval(() => {
      setFetchedMinutesAgo(Math.floor((Date.now() - fetchedAt) / 60_000));
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchedAt]);

  const [timeRange, setTimeRange] = useState(initialRange);
  const [legendModalOpen, setLegendModalOpen] = useState(false);
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number[] | null>(initialSelectedSeat);
  const [heatmapEnabled, setHeatmapEnabled] = useStickyState("heatmapEnabled", true);
  const [colorblindMode, setColorblindMode] = useStickyState("colorblindMode", false);

  useEffect(() => setMissingModalOpen(true), []);
  useSyncUrlState(train, stations, timeRange, selectedSeat);

  const isIncomplete = useMemo(
    () =>
      wagons.some((wagon) =>
        wagon.floors.some((floor) =>
          floor.seats.some((seat) => seat.status.some((status) => status === "missing"))
        )
      ),
    [wagons]
  );
  const missingRanges = useMemo(
    () =>
      stations.map((_, index) =>
        wagons.some((wagon) =>
          wagon.floors.some((floor) => floor.seats.some((seat) => seat.status[index] === "missing"))
        )
      ),
    [wagons, stations]
  );

  useSeatScroll(selectedSeat, mainMapRef);
  const { changeSeatSelection } = useSeatSelection(mainMapRef, setSelectedSeat);
  useSliderStyling(timeRange, selectedSeat, wagons, isIncomplete, missingRanges, colorblindMode);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.onLine) return;

    void navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: "CACHE_TRAIN",
        url: `/train/${date}/${train.trainNumber}`,
      });
      registration.active?.postMessage({ type: "CACHE_HOME", url: `/?date=${date}` });
    });
  }, [date, train.trainNumber]);

  useDraggableMap(mainMapRef, setSelectedSeat, changeSeatSelection);

  const fiDate = train.departureDate.split("-").reverse().map(Number).join(".");

  return (
    <>
      {messageContextHolder}

      {isIncomplete ? (
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

      <div data-pwa-train-page style={{ display: "flex", flexDirection: "column" }}>
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
              onClick={() => {
                window.location.assign(date ? `/?date=${date}` : "/");
              }}
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
                  if (window.plausible) window.plausible("Press Help");
                  setLegendModalOpen(true);
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
            stations={stations}
            timeRange={timeRange}
            selectedSeat={selectedSeat}
            heatmapEnabled={heatmapEnabled}
            colorblindMode={colorblindMode}
            setMainMapRef={setMainMapRef}
          />

          <MiniMap
            wagons={wagons.filter(
              (wagon) => wagon.placeType !== "VEHICLE" && !["EIL", "EILF"].includes(wagon.type)
            )}
            mainMapRef={mainMapRef}
            trainDisplayInfo={trainDisplayInfo}
            train={train}
          />

          {isIncomplete ? null : (
            <SeatFinder
              wagons={wagons}
              stations={stations}
              timeRange={timeRange}
              messageApi={messageApi}
              selectedSeat={selectedSeat}
              changeSeatSelection={changeSeatSelection}
            />
          )}
        </div>

        <div style={{ marginTop: "2em", textAlign: "center", width: "100%" }}>
          <p style={{ color: "#757575", fontSize: "12px", margin: "0 0 4px 0" }}>
            Tiedot haettu: {formatShortFinnishTime(fetchedAt)}{" "}
            {fetchedMinutesAgo != null
              ? fetchedMinutesAgo === 0
                ? "(juuri nyt)"
                : fetchedMinutesAgo === 1
                  ? "(1 minuutti sitten)"
                  : `(${fetchedMinutesAgo} minuuttia sitten)`
              : ""}
          </p>

          <a
            style={{
              color: "#757575",
              fontSize: "12px",
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
              color: "#757575",
              fontSize: "12px",
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
              color: "#757575",
              fontSize: "12px",
              marginLeft: "10px",
              marginRight: "10px",
              marginTop: "5px",
            }}
          >
            Emme ole <span style={{ fontStyle: "italic" }}>VR-Yhtymä Oyj:n</span>, sen
            tytäryhtiöiden tai sen yhteistyökumppanien kanssa sidoksissa tai millään tavalla
            virallisesti yhteydessä niihin. Virallinen verkkosivusto on osoitteessa{" "}
            <a style={{ color: "#757575", textDecoration: "underline" }} href="https://www.vr.fi/">
              www.vr.fi
            </a>
            .
          </p>
        </div>
      </div>

      <LegendModal
        IsOpen={legendModalOpen}
        setIsOpen={setLegendModalOpen}
        heatmapEnabled={heatmapEnabled}
        setHeatmapEnabled={setHeatmapEnabled}
        colorblindMode={colorblindMode}
        setColorblindMode={setColorblindMode}
      />
    </>
  );
}

export function TrainNotFound({ date, tooOld }: { date?: string; tooOld: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      {tooOld ? <h1>Juna on lähtenyt jo aikoja sitten...</h1> : <h1>Junaa ei löytynyt...</h1>}
      <Button
        style={{
          fontWeight: 500,
          height: "40px",
          fontSize: "16px",
        }}
        onClick={() => window.location.assign(date ? `/?date=${date}` : "/")}
      >
        <LeftCircleOutlined /> Takaisin
      </Button>
    </div>
  );
}
