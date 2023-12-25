import { z } from "zod";
import { getJSON, postJSON } from "~/lib/http";
import { formatShortFinnishTime } from "./dateUtilities";

function gql(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.reduce((v, i) => `${v}${String(values[parseInt(i)]) || ""}`);
}

const wagonResponseSchema = z.object({
  data: z.object({
    wagonMapDataV2: z.object({
      coaches: z.record(
        z.string(),
        z.object({
          number: z.number(),
          placeType: z.string().nullable(),
          type: z.string(),
          floorCount: z.number(),
          order: z.number(),
          placeList: z.array(
            z.object({
              floor: z.number(),
              logicalSection: z.number(),
              number: z.number(),
              bookable: z.boolean(),
              type: z.string(),
              productType: z.string(),
              services: z.array(z.string()),
              position: z.string().optional().transform(v => v ?? null),
            })
          ),
        })
      ),
    }),
  }),
});

async function getWagonMapData(
  departureStation: string,
  arrivalStation: string,
  departureTime: Date,
  trainType: string,
  trainNumber: string | number
) {
  const query = gql`
    query getWagonMapDataV2(
      $departureStation: String!
      $arrivalStation: String!
      $departureTime: String!
      $trainNumber: String!
      $trainType: String!
    ) {
      wagonMapDataV2(
        departureStation: $departureStation
        arrivalStation: $arrivalStation
        departureTime: $departureTime
        trainNumber: $trainNumber
        trainType: $trainType
      ) {
        coaches
      }
    }
  `;

  const variables = {
    arrivalStation,
    departureStation,
    departureTime: departureTime.toISOString(),
    trainNumber: trainNumber.toString(),
    trainType,
  };

  const res = (await postJSON("https://www.vr.fi/api/v6", {
    operationName: "getWagonMapDataV2",
    query,
    variables,
  })) as unknown;

  const parsed = wagonResponseSchema.parse(res);

  return parsed.data.wagonMapDataV2.coaches;
}

const trainResponseSchema = z.array(
  z.object({
    trainNumber: z.number(),
    trainType: z.string(),
    departureDate: z.string(),
    timeTableRows: z.array(
      z.object({
        trainStopping: z.boolean(),
        commercialStop: z.boolean().optional(),
        stationShortCode: z.string(),
        scheduledTime: z.string(),
      })
    ),
  })
);

export async function getTrainOnDate(date: string, trainNumber: string) {
  const res = (await getJSON(
    `https://rata.digitraffic.fi/api/v1/trains/${date}/${trainNumber}`
  )) as unknown;

  const data = trainResponseSchema.parse(res);
  const train = data[0];
  if (!train) return null;

  train.timeTableRows = train.timeTableRows.filter((r) => r.trainStopping && r.commercialStop);

  const newTrain = {
    ...train,
    timeTableRows: await Promise.all(
      Array(train.timeTableRows.length / 2)
        .fill(0)
        .map(async (_, i) => {
          const dep = train.timeTableRows[i * 2]!;
          const arr = train.timeTableRows[i * 2 + 1]!;
          const trainNumber = train.trainNumber.toString();
          const wagons = await getWagonMapData(
            dep.stationShortCode,
            arr.stationShortCode,
            new Date(dep.scheduledTime),
            train.trainType,
            trainNumber
          );
          return {
            dep,
            arr,
            wagons,
          };
        })
    ),
  };

  return newTrain;
}

const stationResponseSchema = z.array(
  z.object({
    passengerTraffic: z.boolean(),
    stationShortCode: z.string(),
    stationName: z.string(),
  })
);

export async function getStations() {
  const res = (await getJSON("https://rata.digitraffic.fi/api/v1/metadata/stations")) as unknown;

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
    getJSON(`https://rata.digitraffic.fi/api/v1/trains/${date}`) as Promise<unknown>,
    getStations(),
  ]);

  const initialTrains = trainsResponseSchema.parse(initialTrainsUnchecked);

  return initialTrains
    .filter((t) => ["IC", "S"].includes(t.trainType))
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
