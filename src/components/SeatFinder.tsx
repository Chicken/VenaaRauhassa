import { Button } from "antd";
import type { MessageInstance } from "antd/lib/message/interface";
import React from "react";
import type { Floor, Seat, Wagon } from "~/types";

type SeatFinderProps = {
  wagons: Wagon[];
  timeRange: number[];
  messageApi: MessageInstance;
  selectedSeat: number[] | null;
  changeSeatSelection: (wagonNumber: number, seatNumber: number, selected: boolean) => void;
};

export const SeatFinder: React.FC<SeatFinderProps> = ({
  wagons,
  timeRange,
  messageApi,
  selectedSeat,
  changeSeatSelection,
}) => (
  <div
    style={{
      textAlign: "center",
      width: "100%",
    }}
  >
    <Button
      onClick={() => {
        // @ts-expect-error no types for globally available plausible function
        // eslint-disable-next-line
        if (window.plausible) window.plausible("Find Seat");

        function getSeatGroup(floor: Floor, seat: Seat): Seat[] {
          if (seat.services.includes("OPPOSITE")) {
            const seatsInSection = floor.seats.filter(
              (s) => s.section === seat.section && s.number !== seat.number
            );
            return seatsInSection;
          } else {
            const adjacentNumber = seat.number % 2 ? seat.number + 1 : seat.number - 1;
            const adjacent = floor.seats.find((s) => s.number === adjacentNumber);
            if (adjacent) return [adjacent];
            return [];
          }
        }

        function groupScore(group: Seat[]) {
          if (!group.length) return 1;
          // TODO: should probably use time occupied instead of just stations
          return (
            group.reduce(
              (a, c) =>
                a +
                c.status.slice(timeRange[0], timeRange[1]).filter((s) => s === "open").length /
                  c.status.length,
              0
            ) / group.length
          );
        }

        const possibleSeats = wagons.flatMap((w) =>
          w.floors.flatMap((f) =>
            f.seats
              .filter(
                (s) =>
                  s.productType === "ECO_CLASS_SEAT" &&
                  s.type === "SEAT" &&
                  ["WHEELCHAIR", "COMPARTMENT", "PETS", "PET-COACH"].every(
                    (tSrv) => !s.services.some((srv) => srv.includes(tSrv))
                  ) &&
                  s.status.slice(timeRange[0], timeRange[1]).every((r) => r === "open")
              )
              .map((s) => {
                const group = getSeatGroup(f, s);
                return { ...s, wagon: w.number, group, groupScore: groupScore(group) };
              })
          )
        );

        if (!possibleSeats.length) {
          messageApi
            .open({
              type: "error",
              content: "Ei avoimia paikkoja junassa :(",
            })
            .then(
              () => null,
              () => null
            );
          return;
        }

        const posToNum = (pos: string | null) => (pos === "WINDOW" ? 1 : 0);

        // TODO: this sorting and filtering is very primitive and the logic should be fine tuned to be more human-like

        possibleSeats.sort((s1, s2) => {
          if (s1.group.length - s2.group.length) return s1.group.length - s2.group.length;
          if (s2.groupScore - s1.groupScore) return s2.groupScore - s1.groupScore;
          if (posToNum(s2.position) - posToNum(s1.position))
            return posToNum(s2.position) - posToNum(s1.position);
          return 0;
        });

        let criteria = 0;
        let best = possibleSeats;

        criteria = best[0]!.group.length;
        best = best.filter((s) => s.group.length === criteria);

        criteria = best[0]!.groupScore;
        best = best.filter((s) => s.groupScore >= criteria - 0.0001);

        criteria = posToNum(best[0]!.position);
        best = best.filter((s) => posToNum(s.position) === criteria);

        if (selectedSeat)
          best = best.filter((s) => s.wagon !== selectedSeat[0] || s.number !== selectedSeat[1]);

        if (!best.length) {
          messageApi
            .open({
              type: "info",
              content: "Ei muita yhtä hyviä vaihtoehtoja",
            })
            .then(
              () => null,
              () => null
            );
          return;
        }

        const randomSeat = best[Math.floor(Math.random() * best.length)]!;

        changeSeatSelection(randomSeat.wagon, randomSeat.number, true);

        messageApi
          .open({
            type: "success",
            content: `Vaunu ${randomSeat.wagon} paikka ${randomSeat.number}`,
          })
          .then(
            () => null,
            () => null
          );
      }}
      style={{
        fontWeight: "bold",
        height: "40px",
        fontSize: "16px",
        marginTop: "10px",
      }}
    >
      ✨ Löydä paikkasi ✨{" "}
      <span
        style={{
          backgroundColor: "rgba(0, 0, 200, 0.2)",
          borderRadius: "10px",
          padding: "1px 7px",
          marginLeft: "5px",
          boxSizing: "border-box",
        }}
      >
        Beta
      </span>
    </Button>
  </div>
);
