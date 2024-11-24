import React from "react";
import { Slider } from "antd";
import type { Station, Wagon } from "~/types";
import dayjs from "dayjs";

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
          const seat = selectedSeat
            ? wagons
                .find((w) => w.number === selectedSeat[0])!
                .floors.flatMap((f) => f.seats)
                .find((s) => s.number === selectedSeat[1])!
            : null;

          const stationName = station.station.replace(" asema", "");
          return [
            i,
            <div
              key={station.stationShortCode}
              style={{
                marginTop: i % 2 === 1 ? "15px" : "5px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  width: "fit-content",
                  color: seat?.status[i] === "unavailable" ? "grey" : "unset",
                  fontSize: "max(12px, min(18px, calc(8px + 0.5vw)))",
                  margin: "0px",
                }}
              >
                {i % 2 === 1 ? <br /> : ""}
                {stationName}
              </p>
              <p
                style={{
                  color: seat?.status[i] === "unavailable" ? "grey" : "unset",
                  fontSize: "max(10px, min(16px, calc(4px + 0.5vw)))",
                  margin: "0px",
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
        marginBottom: "60px",
        minWidth: "500px",
        maxWidth: "90%",
      }}
    />
  );
};
