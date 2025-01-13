import { useEffect, type SetStateAction } from "react";
import { getSeatId } from "~/lib/seatUtils";

export const useDraggableMap = (
  mainMapRef: HTMLDivElement | null,
  setSelectedSeat: (value: SetStateAction<number[] | null>) => void,
  changeSeatSelection: (wagon: number, seat: number, set: boolean) => void
) => {
  useEffect(() => {
    if (!mainMapRef) return;
    mainMapRef.style.cursor = "grab";

    let pos = { left: 0, x: 0 };
    let timestamp = 0;
    let animationId: number | null = null;

    const mouseDownHandler = (e: MouseEvent) => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      mainMapRef.style.cursor = "grabbing";
      mainMapRef.style.userSelect = "none";
      timestamp = Date.now();

      pos = {
        left: mainMapRef.scrollLeft,
        x: e.clientX,
      };

      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    };

    let velocity = 0;
    let prevLeft = 0;
    const mouseMoveHandler = (e: MouseEvent) => {
      const dx = e.clientX - pos.x;
      prevLeft = mainMapRef.scrollLeft;
      mainMapRef.scrollLeft = pos.left - dx;
      velocity = (1.5 * velocity + (mainMapRef.scrollLeft - prevLeft)) / 2.5;
    };

    const mouseUpHandler = (e: MouseEvent) => {
      if (Date.now() - timestamp < 150 && Math.abs(e.clientX - pos.x) < 50) {
        const seat = getSeatId(e);
        setSelectedSeat(seat);
        if (seat) setTimeout(() => changeSeatSelection(seat[0]!, seat[1]!, false), 100);
      }

      mainMapRef.style.cursor = "grab";
      mainMapRef.style.removeProperty("user-select");

      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);

      animationId = requestAnimationFrame(slideScroll);
    };

    const slideScroll = () => {
      if (Math.abs(velocity) < 0.1) {
        animationId = null;
        return;
      }
      mainMapRef.scrollLeft += velocity;
      velocity *= 0.95;
      animationId = requestAnimationFrame(slideScroll);
    };

    mainMapRef.addEventListener("mousedown", mouseDownHandler);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      mainMapRef.removeEventListener("mousedown", mouseDownHandler);
    };
  }, [changeSeatSelection, mainMapRef, setSelectedSeat]);
};
