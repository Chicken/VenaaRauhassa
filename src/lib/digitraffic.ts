import { z } from "zod";
import { getJSON } from "~/lib/http";
import { formatShortFinnishTime } from "./dateUtilities";

const stationResponseSchema = z.array(
  z.object({
    passengerTraffic: z.boolean(),
    stationShortCode: z.string(),
    stationName: z.string(),
  })
);

export async function getStations() {
  const res = await getJSON("https://rata.digitraffic.fi/api/v1/metadata/stations");
  const data = stationResponseSchema.parse(res);
  const filteredData = data.filter((s) => s.passengerTraffic);
  const stations = Object.fromEntries(filteredData.map((s) => [s.stationShortCode, s.stationName]));
  return stations;
}

const trainsResponseSchema = z.array(
  z.object({
    trainNumber: z.number(),
    trainType: z.string(),
    timeTableRows: z.array(
      z.object({
        stationShortCode: z.string(),
        scheduledTime: z.string(),
      })
    ),
  })
);

export async function getInitialTrains(date: string) {
  const [initialTrainsUnchecked, stations] = await Promise.all([
    getJSON(`https://rata.digitraffic.fi/api/v1/trains/${date}`),
    getStations(),
  ]);

  const initialTrains = trainsResponseSchema.parse(initialTrainsUnchecked);

  return initialTrains
    .filter((t) => ["IC", "S", "PYO"].includes(t.trainType))
    .map((t) => {
      const departure = t.timeTableRows[0];
      const arrival = t.timeTableRows[t.timeTableRows.length - 1];

      if (!departure || !arrival) {
        return {
          value: t.trainNumber.toString(),
          label: `${t.trainType}${t.trainNumber}`,
          departureStationShortCode: "",
          arrivalStationShortCode: "",
          departureStationName: "",
          arrivalStationName: "",
        };
      }

      const departureTime = formatShortFinnishTime(departure.scheduledTime);
      const arrivalTime = formatShortFinnishTime(arrival.scheduledTime);

      const longDepartureStationName =
        stations[departure.stationShortCode]?.replace(" asema", "").trim() ??
        departure.stationShortCode;
      const longArrivalStationName =
        stations[arrival.stationShortCode]?.replace(" asema", "").trim() ??
        arrival.stationShortCode;

      return {
        value: t.trainNumber.toString(),
        label: `${t.trainType}${t.trainNumber} (${departure.stationShortCode} ${departureTime} -> ${arrival.stationShortCode} ${arrivalTime})`,
        title: `${t.trainType}${t.trainNumber} (${longDepartureStationName} ${departureTime} -> ${longArrivalStationName} ${arrivalTime})`,
        departureStationShortCode: departure.stationShortCode,
        arrivalStationShortCode: arrival.stationShortCode,
        departureStationName: stations[departure.stationShortCode] ?? departure.stationShortCode,
        arrivalStationName: stations[arrival.stationShortCode] ?? arrival.stationShortCode,
      };
    });
}
