import { Slider } from "antd";
import dayjs from "dayjs";
import React from "react";
import { useMediaQuery } from "react-responsive";
import type { Station, Wagon } from "~/types";

type SeatSliderProps = {
  stations: Station[];
  timeRange: number[];
  selectedSeat: number[] | null;
  wagons: Wagon[];
  setTimeRange: (range: number[]) => void;
};

export const SeatSlider: React.FC<SeatSliderProps> = ({
  stations,
  timeRange,
  selectedSeat,
  wagons,
  setTimeRange,
}) => {
  const seat = selectedSeat
    ? wagons
        .find((w) => w.number === selectedSeat[0])!
        .floors.flatMap((f) => f.seats)
        .find((s) => s.number === selectedSeat[1])!
    : null;

  const isMobile = useMediaQuery({
    maxWidth: 768,
  });

  const maxNameLen = Math.max(...stations.map((s) => s.station.replace(" asema", "").length));
  const labelWidth = Math.max(maxNameLen * 8, 80);
  const singleRowWidth = stations.length * labelWidth;
  const needsAlternation = isMobile || singleRowWidth > 900;
  const computedMinWidth = Math.max(400, needsAlternation ? Math.ceil(stations.length / 2) * labelWidth : singleRowWidth);

  return (
    <Slider
      range
      max={stations.length - 1}
      value={timeRange}
      onChange={(value) => {
        // @ts-expect-error no types for globally available plausible function
        // eslint-disable-next-line
        if (window.plausible) window.plausible("Change Range");
        if (value[0] === value[1]) {
          if (value[0] === 0 || value[0] === stations.length - 1) return;
          setTimeRange(
            timeRange[0] !== value[0] ? [value[1]!, value[0]! + 1] : [value[1]! - 1, value[0]!]
          );
          return;
        }
        setTimeRange(value);
      }}
      tooltip={{
        open: false,
      }}
      marks={Object.fromEntries(
        stations.map((station, i) => {
          const stationName = station.station.replace(" asema", "");
          const color = seat?.status[i] === "unavailable" ? "grey" : "unset";
          return [
            i,
            <div
              key={station.stationShortCode}
              style={{
                marginTop: needsAlternation && i % 2 === 1 ? "55px" : "5px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  color,
                  fontSize: "max(12px, min(18px, calc(8px + 0.5vw)))",
                  margin: "0px",
                  width: "fit-content",
                  whiteSpace: "nowrap",
                }}
              >
                {stationName}
              </p>
              <p
                style={{
                  color,
                  fontSize: "max(10px, min(16px, calc(4px + 0.5vw)))",
                  margin: "0px",
                  width: "fit-content",
                  whiteSpace: "nowrap",
                }}
              >
                {station.arrivalTime && dayjs(station.arrivalTime).format("HH:mm")}
                {station.arrivalTime && station.departureTime && " - "}
                {station.departureTime && dayjs(station.departureTime).format("HH:mm")}
              </p>
            </div>,
          ];
        })
      )}
      style={{
        margin: "auto",
        marginBottom: needsAlternation ? "90px" : "40px",
        minWidth: `${computedMinWidth}px`,
        maxWidth: "90%",
      }}
    />
  );
};
