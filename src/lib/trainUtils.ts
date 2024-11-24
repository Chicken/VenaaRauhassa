import dayjs from "dayjs";
import type { Station, Train, Wagon } from "~/types";

export const processStations = (train: Train, allStations: Record<string, string>): Station[] => {
  return train.timeTableRows
    .map((row, i, rows) =>
      i > 1 ? { ...row.dep, arrivalTime: rows[i - 1]!.arr.scheduledTime } : row.dep
    )
    .concat(train.timeTableRows.at(-1)!.arr)
    .map((station, i, stations) => ({
      departureTime: i === stations.length - 1 ? null : new Date(station.scheduledTime).getTime(),
      arrivalTime:
        i === stations.length - 1
          ? new Date(station.scheduledTime).getTime()
          : "arrivalTime" in station
            ? new Date(station.arrivalTime).getTime()
            : null,
      stationShortCode: station.stationShortCode,
      station: allStations[station.stationShortCode] ?? station.stationShortCode,
    }));
};

export const processWagons = (train: Train) => {
  const rawWagons: NonNullable<(typeof train)["timeTableRows"][number]["wagons"]>[string][] = [];
  train.timeTableRows.forEach((timeTableRow) => {
    if (!timeTableRow.wagons) return;
    Object.values(timeTableRow.wagons).forEach((wagon) => {
      if (!rawWagons.some((w) => w.number === wagon.number)) {
        rawWagons.push(wagon);
      }
    });
  });

  const wagons = rawWagons
    .sort((w1, w2) => w2.number - w1.number)
    .map((wagon) => ({
      number: wagon.number,
      type: wagon.type,
      placeType: wagon.placeType,
      floors: Array(wagon.floorCount)
        .fill(0)
        .map((_, floor) => ({
          number: floor + 1,
          image:
            "https://prod.wagonmap.prodvrfi.vrpublic.fi/images/v1.6.0/" +
            wagon.type +
            (wagon.floorCount !== 1 ? (floor ? "_up" : "_down") : "") +
            ".svg",
          seats: wagon.placeList
            .filter((place) => place.floor === floor + 1)
            .map((place) => ({
              number: place.number,
              section: place.logicalSection,
              status: train.timeTableRows.map((row) => {
                if (!row.wagons) return "missing";
                const rowWagon = Object.values(row.wagons).find(
                  (wagon2) => wagon2.number === wagon.number
                );
                if (!rowWagon) return "unavailable";
                const rowPlace = rowWagon.placeList.find(
                  (place2) => place2.number === place.number
                );
                return rowPlace ? (rowPlace.bookable ? "open" : "reserved") : "reserved";
              }),
              type: place.type,
              productType: place.productType,
              services: place.services,
              position: place.position,
            })),
        })),
    }));

  if (["IM2", "EDO"].includes(wagons[0]?.type ?? "")) wagons.reverse();
  return wagons;
};

export const getDescription = (wagons: Wagon[], train: Train, stations: Station[]) => {
  const totalSeats = wagons.reduce(
    (a, c) =>
      a + c.floors.reduce((a2, c2) => a2 + c2.seats.filter((s) => s.type !== "VEHICLE").length, 0),
    0
  );
  const ecoSeatObjs = wagons.flatMap((w) =>
    w.floors.flatMap((f) =>
      f.seats.filter(
        (seat) =>
          seat.productType === "ECO_CLASS_SEAT" &&
          seat.type !== "VEHICLE" &&
          seat.services.length === 0
      )
    )
  );
  const ecoSeats = ecoSeatObjs.length;
  const bookedEcoSeats = ecoSeatObjs.filter((s) => s.status.includes("reserved")).length;
  const percentageBookedEcoSeats =
    ecoSeatObjs.reduce((a, c) => a + c.status.filter((s) => s === "reserved").length, 0) /
    ecoSeatObjs.reduce((a, c) => a + c.status.filter((s) => s !== "missing").length, 0);

  return train && stations
    ? `Juna ${train.trainType}${train.trainNumber} lähtee asemalta ${stations[0]?.station.replace(
        " asema",
        ""
      )} klo ${dayjs(stations[0]!.departureTime).format("HH:mm")} ja saapuu asemalle ${stations
        .at(-1)
        ?.station.replace(" asema", "")} klo ${dayjs(stations.at(-1)?.arrivalTime).format(
        "HH:mm"
      )}. Välillä on ${totalSeats} paikkaa, joista ${ecoSeats} on normaaleja. Normaaleista välillä on varattuna ${bookedEcoSeats} paikkaa. Mutta todellisuudessa paikat ovat ajallisesti varattuna vain ${(
        percentageBookedEcoSeats * 100
      ).toFixed(0)}% ajasta.`
    : "";
};
