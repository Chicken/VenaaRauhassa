import React, { useMemo } from "react";
// @ts-expect-error no types exists
import { SvgLoader, SvgProxy } from "react-svgmt";
import { hueShift } from "~/lib/colors";
import { getSeatSelector } from "~/lib/seatUtils";
import type { Station, Wagon } from "~/types";

type WagonMapProps = {
  wagons: Wagon[];
  stations: Station[];
  timeRange: number[];
  selectedSeat: number[] | null;
  heatmapEnabled: boolean;
  setMainMapRef: (ref: HTMLDivElement | null) => void;
};

export const WagonMap: React.FC<WagonMapProps> = ({
  wagons,
  stations,
  timeRange,
  selectedSeat,
  heatmapEnabled,
  setMainMapRef,
}) => {
  const travelTimes = useMemo(
    () =>
      stations.map((station, idx, arr) => {
        if (idx === arr.length - 1) return 0;
        return (
          (arr[idx + 1]?.arrivalTime ?? arr[idx + 1]?.departureTime)! -
          (station.departureTime ?? station.arrivalTime)!
        );
      }),
    [stations]
  ).slice(0, -1);
  return (
    <div
      id="wagon-map"
      ref={(ref) => setMainMapRef(ref)}
      className="wagonClass"
      style={{
        display: "flex",
        overflow: "auto",
        paddingBottom: "8px",
      }}
    >
      {wagons.map((wagon) => {
        if (wagon.placeType === "VEHICLE" || ["EIL", "EILF"].includes(wagon.type)) {
          return null;
          // if we ever want to show vehicle wagons
          // also the below serves as a great "empty" wagon for errors or loading skeletons if necessary in the future
          /*
          return (
            <div
              key={wagon.number}
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {[...wagon.floors].reverse().map((floor) => (
                <div
                  className={"wagon-svg"}
                  key={floor.number}
                  style={{
                    aspectRatio: "calc(1587 + 12) / calc(237 + 12)",
                    padding: "6px",
                    boxSizing: "border-box",
                  }}
                  data-wagon={wagon.number}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "calc(100% - 2 * 6px)",
                      border: "3px solid #e0e0e0",
                      backgroundColor: "#f2f2f2",
                      boxSizing: "border-box",
                      borderRadius: "18px",
                      margin: "6px 0px",
                    }}
                  ></div>
                </div>
              ))}
              <div style={{ textAlign: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: 20 }}>{wagon.number}</span>
              </div>
            </div>
          );
        */
        }
        return (
          <div
            key={wagon.number}
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[...wagon.floors].reverse().map((floor) => (
              <SvgLoader
                className={"wagon-svg"}
                key={floor.number}
                path={floor.image}
                style={{
                  aspectRatio: "calc(1587 + 12) / calc(237 + 12)",
                  padding: "6px",
                }}
                data-wagon={wagon.number}
              >
                {/* background */}
                <SvgProxy selector="svg > g > path" fill="f9f9f9" />
                {floor.seats.map((seat) => {
                  const statusRange = seat.status.slice(timeRange[0], timeRange[1]);
                  const travelTimeRange = travelTimes.slice(timeRange[0], timeRange[1]);
                  const totalTime = travelTimeRange
                    .filter((_, i) => statusRange[i] !== "missing")
                    .reduce((a, c) => a + c, 0);
                  const occupiedTime = travelTimeRange
                    .filter((_, i) => statusRange[i] === "reserved")
                    .reduce((a, c) => a + c, 0);

                  const isSelected = selectedSeat
                    ? seat.number === selectedSeat[1] && wagon.number === selectedSeat[0]
                    : false;

                  const allUnavailable = statusRange
                    .filter((r) => r !== "missing")
                    .every((r) => r === "unavailable");
                  const allReserved = statusRange
                    .filter((r) => r !== "missing")
                    .every((r) => r === "reserved");
                  const allOpen = statusRange
                    .filter((r) => r !== "missing")
                    .every((r) => r === "open");

                  const extra = seat.productType === "EXTRA_CLASS_SEAT";
                  const restaurant = seat.productType === "SEAT_UPSTAIRS_RESTAURANT_WAGON";
                  const wheelchair = seat.services.some((s) => s.includes("WHEELCHAIR"));
                  const compartment = seat.services.some((s) => s.includes("COMPARTMENT"));
                  const petCoach = seat.services.some((s) => s.includes("PET-COACH"));
                  const pet = seat.services.some((s) => s.includes("PETS"));
                  const bed = seat.type === "BED";
                  const special =
                    extra || restaurant || wheelchair || compartment || petCoach || pet || bed;

                  // TODO: show "kiintiöpaikat" with some color / border because they show up as "reserved" but actually arent

                  const proxies = [
                    <SvgProxy
                      key={seat.number + "-bg"}
                      selector={getSeatSelector(seat.type, seat.number)}
                      fill={(() => {
                        if (allUnavailable) return "#45475a";
                        if (statusRange.includes("unavailable")) return "#9399b2";
                        if (allReserved) return "#f38ba8";
                        if (allOpen) return "#a6e3a1";
                        if (heatmapEnabled)
                          return hueShift("#f9e2af", 20 * (8 / 2 - (occupiedTime / totalTime) * 8));
                        return "#f9e2af";
                      })()}
                      stroke={(() => {
                        if (isSelected) return "#313244";
                        if (special) return "#820909";
                        return "#1b50af";
                      })()}
                      stroke-width={(() => {
                        if (heatmapEnabled) {
                          if (isSelected) return "5px";
                          if (allReserved || allOpen || special) return "3px";
                          return "1px";
                        } else {
                          if (isSelected) return "3px";
                          if (special) return "2px";
                          return "1px";
                        }
                      })()}
                    />,
                  ];

                  if (pet || petCoach) {
                    proxies.push(
                      <SvgProxy
                        key={seat.number + "-pet-indicator"}
                        selector={"#pet_seat_indicator_" + seat.number}
                        fill="rgb(213, 238, 250)"
                      />
                    );
                    if (pet) {
                      proxies.push(
                        <SvgProxy
                          key={seat.number + "-seat-number-1"}
                          selector={"#seatnumber_" + seat.number}
                          fill="none"
                        />
                      );
                      proxies.push(
                        <SvgProxy
                          key={seat.number + "-seat-number-2"}
                          selector={"#seatnumber_" + seat.number + "-with-service-icon"}
                          fill="rgb(27, 80, 175)"
                        />
                      );
                    }
                  }

                  return proxies;
                })}
              </SvgLoader>
            ))}

            <div style={{ textAlign: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: 20 }}>{wagon.number}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
