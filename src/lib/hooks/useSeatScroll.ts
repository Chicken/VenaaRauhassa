import { useEffect } from "react";
import { Easing, animate } from "~/lib/animate";

export const useSeatScroll = (
  initialSelectedSeat: number[] | null,
  mainMapRef: HTMLDivElement | null
) => {
  useEffect(() => {
    if (!initialSelectedSeat || !mainMapRef) return;
    let cancelAnimation: (() => void) | null = null;
    const timeout = setTimeout(() => {
      const seatEl =
        document.querySelector(
          `[data-wagon="${initialSelectedSeat[0]}"] #seat_${initialSelectedSeat[1]}`
        ) ??
        document.querySelector(
          `[data-wagon="${initialSelectedSeat[0]}"] #bed_${initialSelectedSeat[1]}`
        );
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
      cancelAnimation = animate((t) => {
        mainMapRef.scrollLeft =
          originalScroll + (targetScroll - originalScroll) * Easing.easeInOutQuad(t);
      }, 300);
    }, 500);
    return () => {
      clearTimeout(timeout);
      if (cancelAnimation) cancelAnimation();
    };
  }, [initialSelectedSeat, mainMapRef]);
};
