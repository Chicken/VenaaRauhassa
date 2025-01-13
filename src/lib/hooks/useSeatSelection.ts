import { useCallback } from "react";
import { animate, Easing } from "~/lib/animate";

export const useSeatSelection = (
  mainMapRef: HTMLDivElement | null,
  setSelectedSeat: (seat: [number, number] | null) => void
) => {
  const changeSeatSelection = useCallback(
    (wagon: number, seat: number, set: boolean) => {
      if (!mainMapRef) return;
      const seatEl =
        document.querySelector(`[data-wagon="${wagon}"] #seat_${seat}`) ??
        document.querySelector(`[data-wagon="${wagon}"] #bed_${seat}`);
      if (!seatEl) return;
      const bounding = seatEl.getBoundingClientRect();
      const mapBounding = mainMapRef.getBoundingClientRect();
      const originalScroll = mainMapRef.scrollLeft;
      const targetScroll =
        mainMapRef.scrollLeft +
        bounding.left -
        mainMapRef.clientWidth / 2 -
        mapBounding.left +
        seatEl.clientWidth / 2;
      if (Math.abs(originalScroll - targetScroll) < 10) {
        mainMapRef.scrollLeft = targetScroll;
        return;
      }
      animate((t) => {
        mainMapRef.scrollLeft =
          originalScroll + (targetScroll - originalScroll) * Easing.easeInOutQuad(t);
        if (t === 1 && set) setSelectedSeat([wagon, seat]);
      }, 200);
    },
    [mainMapRef, setSelectedSeat]
  );

  return { changeSeatSelection };
};
