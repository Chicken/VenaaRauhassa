import { useEffect } from "react";
import type { Wagon } from "~/types";

export const useSliderStyling = (
  timeRange: number[],
  selectedSeat: number[] | null,
  wagons: Wagon[] | undefined,
  isInComplete: boolean,
  missingRanges: boolean[]
) => {
  useEffect(() => {
    const [leftHandle, rightHandle] = [...document.querySelectorAll(".ant-slider-handle")] as [
      HTMLElement,
      HTMLElement,
    ];

    const allSliderDots = Array.from(
      document.getElementsByClassName("ant-slider-dot")
    ) as HTMLElement[];

    allSliderDots.forEach((dotEl) => {
      if (!dotEl.classList.contains("ant-slider-dot-active")) {
        dotEl.style.borderColor = "rgba(0, 0, 0, 0.06)";
      }
    });

    const sliderDots = Array.from(
      document.getElementsByClassName("ant-slider-dot-active")
    ) as HTMLElement[];

    let styleStr = "linear-gradient(to right, ";

    sliderDots.forEach((dotEl, i) => {
      const percent = (i / (sliderDots.length - 1)) * 100 + "%";
      const nextPercent = ((i + 1) / (sliderDots.length - 1)) * 100 + "%";

      const seat =
        selectedSeat && wagons
          ? wagons
              .find((w) => w.number === selectedSeat[0])!
              .floors.flatMap((f) => f.seats)
              .find((s) => s.number === selectedSeat[1])!
          : null;

      const color = seat
        ? {
            missing: "#45475a",
            unavailable: "#9399b2",
            reserved: "#f38ba8",
            open: "#a6e3a1",
          }[seat.status[i + timeRange[0]!]!]
        : isInComplete && missingRanges.slice(timeRange[0], timeRange[1])[i]
        ? "#45475a"
        : "#7f849c";

      if (i === 0) leftHandle.style.setProperty("--handle-color", color);
      if (i === sliderDots.length - 2) rightHandle.style.setProperty("--handle-color", color);

      if (i === sliderDots.length - 1) {
        styleStr = styleStr.slice(0, -2);
        styleStr += ")";
      } else {
        styleStr += `${color} ${percent}, ${color} ${nextPercent}, `;
      }

      dotEl.style.borderColor = color;
    });

    const sliderEl = document.getElementsByClassName("ant-slider-track-1")[0] as HTMLElement;
    if (sliderEl) sliderEl.style.background = styleStr;
  }, [timeRange, selectedSeat, wagons, isInComplete, missingRanges]);
};
