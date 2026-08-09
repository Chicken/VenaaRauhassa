import { useEffect } from "react";
import type { Train, Station } from "~/types";

export const useSyncUrlState = (
  train: Omit<Train, "timeTableRows"> | undefined,
  stations: Station[] | undefined,
  timeRange: number[],
  selectedSeat: number[] | null
) => {
  useEffect(() => {
    if (!train || !stations) return;
    function replaceUrl(url: string) {
      const currentUrl = decodeURIComponent(window.location.pathname + window.location.search);
      if (currentUrl !== url) window.history.replaceState(null, "", url);
    }
    if (timeRange[0] === 0 && timeRange[1] === stations.length - 1 && selectedSeat === null) {
      replaceUrl(`/train/${train.departureDate}/${train.trainNumber}`);
    } else if (
      (timeRange[0] !== 0 || timeRange[1] !== stations.length - 1) &&
      selectedSeat !== null
    ) {
      replaceUrl(
        `/train/${train.departureDate}/${train.trainNumber}?from=${
          stations[timeRange[0]!]!.stationShortCode
        }&to=${stations[timeRange[1]!]!.stationShortCode}&seat=${selectedSeat[0]}-${
          selectedSeat[1]
        }`
      );
    } else if (selectedSeat !== null) {
      replaceUrl(
        `/train/${train.departureDate}/${train.trainNumber}?seat=${selectedSeat[0]}-${selectedSeat[1]}`
      );
    } else {
      replaceUrl(
        `/train/${train.departureDate}/${train.trainNumber}?from=${
          stations[timeRange[0]!]!.stationShortCode
        }&to=${stations[timeRange[1]!]!.stationShortCode}`
      );
    }
  }, [train, stations, timeRange, selectedSeat]);
};
