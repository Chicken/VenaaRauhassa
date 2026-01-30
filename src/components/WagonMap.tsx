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

                  const extra = [
                    "EXTRA_CLASS_SEAT",
                    "EXTRA_PLUS_SEAT",
                    "SINGLE_EXTRA_CLASS_SEAT",
                    "EXTRA_PLUS_SINGLE_SEAT",
                  ].includes(seat.productType);
                  const restaurant = [
                    "SINGLE_SEAT_UPSTAIRS_RESTAURANT_WAGON",
                    "SEAT_UPSTAIRS_RESTAURANT_WAGON",
                  ].includes(seat.productType);
                  const wheelchair = seat.services.some((s) => s.includes("WHEELCHAIR"));
                  const compartment = seat.services.some((s) => s.includes("COMPARTMENT"));
                  const petCoach = seat.services.some((s) => s.includes("PET-COACH"));
                  const pet = seat.services.some((s) => s.includes("PETS"));
                  const bed = seat.type === "BED";
                  const special =
                    extra || restaurant || wheelchair || compartment || petCoach || pet || bed;

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
      <div
        style={{
          display: "none",
        }}
      >
        <svg
          id="pet-service-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="24"
          height="24"
        >
          <path
            fill="unset"
            d="M42.2 15.868a2.013 2.013 0 01-.716.132H27.548a2 2 0 01-1.02-.279l-7.883-4.669-2.736-6.519A2.5 2.5 0 0013.604 3h-2.676l1.26 3h-1.204a6 6 0 00-6 6v.099l-3.699 1.416a2 2 0 00-1.152 2.584l1.263 3.274A6 6 0 006.906 23h3.078v4.388c0 1.256.395 2.481 1.127 3.501l1.873 2.606V45h1.5a2.5 2.5 0 002.5-2.5v-9.004c0-.837-.263-1.654-.752-2.334l-1.87-2.606a2.002 2.002 0 01-.378-1.169V23a4 4 0 00-4-4H6.906a2 2 0 01-1.867-1.284l-.454-1.18 1.64-.627c1.581-.606 2.787-2.116 2.76-3.81V12c-.019-1.12.883-1.997 2-1.997h2.883l1.09 2.597a4.002 4.002 0 001.65 1.893l7.881 4.669a5.996 5.996 0 003.06.838h13.934c.735 0 1.462-.134 2.148-.397l2.748-1.053a2.5 2.5 0 001.605-2.334v-2.564L42.2 13.868zm4.067 8.562a2.499 2.499 0 00-3.228-1.44l-1.4.537 1.212 3.169c.088.228.133.471.133.715v17.584h1.5a2.5 2.5 0 002.5-2.5V27.41a6.01 6.01 0 00-.397-2.146l-.32-.834zm-9.445 4.117a4.001 4.001 0 00-4.668-1.384l-9.359 3.59a6.001 6.001 0 00-3.853 5.663L18.984 45l1.493-.007a2.501 2.501 0 002.488-2.52l-.023-6.097a2.005 2.005 0 011.288-1.889l9.356-3.589 3.016 4.153a2 2 0 01.382 1.175V45h1.5a2.5 2.5 0 002.5-2.5v-6.277c0-1.266-.4-2.5-1.145-3.524l-3.017-4.152z"
          ></path>
        </svg>
      </div>
    </div>
  );
};
