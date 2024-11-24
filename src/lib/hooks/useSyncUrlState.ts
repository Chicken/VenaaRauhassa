import type { NextRouter } from "next/router";
import { useEffect } from "react";
import type { Train, Station } from "~/types";

export const useSyncUrlState = (
  router: NextRouter,
  train: Train | undefined,
  stations: Station[] | undefined,
  timeRange: number[],
  selectedSeat: number[] | null
) => {
  useEffect(() => {
    if (!train || !stations) return;
    function safeShallow(url: string) {
      if (decodeURIComponent(router.asPath) !== url)
        void router.replace(url, undefined, { shallow: true }).catch(console.error);
    }
    if (
      timeRange[0] === 0 &&
      timeRange[1] === train?.timeTableRows.length &&
      selectedSeat === null
    ) {
      safeShallow(`/train/${train.departureDate}/${train.trainNumber}`);
    } else if (
      (timeRange[0] !== 0 || timeRange[1] !== train?.timeTableRows.length) &&
      selectedSeat !== null
    ) {
      safeShallow(
        `/train/${train.departureDate}/${train.trainNumber}?from=${
          stations[timeRange[0]!]!.stationShortCode
        }&to=${stations[timeRange[1]!]!.stationShortCode}&seat=${selectedSeat[0]}-${
          selectedSeat[1]
        }`
      );
    } else if (selectedSeat !== null) {
      safeShallow(
        `/train/${train.departureDate}/${train.trainNumber}?seat=${selectedSeat[0]}-${selectedSeat[1]}`
      );
    } else {
      safeShallow(
        `/train/${train.departureDate}/${train.trainNumber}?from=${
          stations[timeRange[0]!]!.stationShortCode
        }&to=${stations[timeRange[1]!]!.stationShortCode}`
      );
    }
  }, [router, train, stations, timeRange, selectedSeat]);
};
