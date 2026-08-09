import type { getTrainOnDate } from "~/lib/vr";

export type Train = NonNullable<Awaited<ReturnType<typeof getTrainOnDate>>>;

export type Station = {
  arrivalTime: number | null;
  departureTime: number | null;
  stationShortCode: string;
  station: string;
};

export type Wagon = {
  number: number;
  type: string;
  placeType: string | null;
  floors: Floor[];
};

export type TrainOrientation = {
  from: string;
  to: string;
  orientation: "largest_number_first" | "smallest_number_first";
};

export type SplitTrainPart = {
  trainNumber: string;
  coachStart: number;
  coachEnd: number;
  departureStation: string;
  destinationStation: string;
};

export type TrainDisplayInfo = {
  orientations: TrainOrientation[];
  split: {
    station: string;
    parts: SplitTrainPart[];
  } | null;
};

export type Floor = {
  number: number;
  image: string;
  services: string[];
  seats: Seat[];
};

export type Seat = {
  number: number;
  section: number;
  status: ("open" | "reserved" | "unavailable" | "missing")[];
  productType: string;
  type: string;
  services: string[];
  position: string | null;
};

export type AllTrains = {
  value: string;
  label: string;
  departureStationShortCode: string;
  arrivalStationShortCode: string;
  departureStationName: string;
  arrivalStationName: string;
}[];
