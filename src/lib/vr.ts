import { Redis } from "@upstash/redis";
import crypto from "crypto";
import { z } from "zod";
import { env } from "~/lib/env";
import { getJSON, postJSON } from "~/lib/http";
import { formatShortFinnishTime } from "./dateUtilities";

const loginResponseSchema = z.object({
  identityToken: z.string(),
  expiresOn: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresOn: z.string(),
});

async function vrLogin(username: string, password: string) {
  const sessionId = crypto.randomUUID();
  const session = await postJSON(
    `${env.VR_API_URL}/auth/login`,
    {
      username,
      password,
    },
    {
      "x-vr-requestid": crypto.randomUUID(),
      "x-vr-sessionid": sessionId,
      "aste-apikey": env.VR_API_KEY,
    }
  );

  return {
    ...loginResponseSchema.parse(session),
    sessionId: sessionId,
  };
}

const resfreshResponseSchema = z.object({
  accessToken: z.string(),
  expiresOn: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresOn: z.string(),
});

async function vrRefreshToken(token: string, refreshToken: string, sessionId: string) {
  const session = await postJSON(
    `${env.VR_API_URL}/auth/token`,
    {
      refreshToken,
    },
    {
      "x-vr-requestid": crypto.randomUUID(),
      "x-vr-sessionid": sessionId,
      "aste-apikey": env.VR_API_KEY,
      "x-jwt-token": token,
    }
  );

  return resfreshResponseSchema.parse(session);
}

const storedSessionSchema = z.object({
  sessionId: z.string(),
  token: z.string(),
  refreshToken: z.string(),
  expiresOn: z.string(),
});

type StoredSession = z.infer<typeof storedSessionSchema>;

async function getVrAuth(retry = false): Promise<{ sessionId: string; token: string }> {
  const redis = new Redis({
    url: env.UPSTASH_URL,
    token: env.UPSTASH_TOKEN,
  });

  const rawSession = await redis.hgetall("session");
  const parsedSession = storedSessionSchema.safeParse(rawSession);
  if (
    !rawSession ||
    !parsedSession.success ||
    (retry &&
      parsedSession.success &&
      new Date(parsedSession.data.expiresOn).getTime() < Date.now())
  ) {
    const newSession = await vrLogin(env.VR_USER, env.VR_PASS);
    await redis.hset("session", {
      sessionId: newSession.sessionId,
      token: newSession.identityToken,
      refreshToken: newSession.refreshToken,
      expiresOn: newSession.expiresOn,
    } satisfies StoredSession);
    return {
      sessionId: newSession.sessionId,
      token: newSession.identityToken,
    };
  }
  const session = parsedSession.data;
  if (new Date(session.expiresOn).getTime() < Date.now()) {
    try {
      const newSession = await vrRefreshToken(
        session.token,
        session.refreshToken,
        session.sessionId
      );
      await redis.hset("session", {
        sessionId: session.sessionId,
        token: newSession.accessToken,
        refreshToken: newSession.refreshToken,
        expiresOn: newSession.expiresOn,
      } satisfies StoredSession);
      return {
        sessionId: session.sessionId,
        token: newSession.accessToken,
      };
    } catch (e) {
      console.error("refreshing session failed", e);
      // just sleep a bit and try again
      await new Promise((res) => setTimeout(res, 50));
      return getVrAuth(true);
    }
  }

  return {
    sessionId: session.sessionId,
    token: session.token,
  };
}

const wagonResponseSchema = z.object({
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
          position: z
            .string()
            .optional()
            .transform((v) => v ?? null),
        })
      ),
    })
  ),
});

async function getWagonMapData(
  departureStation: string,
  arrivalStation: string,
  departureTime: Date,
  trainNumber: string | number,
  sessionId: string,
  token: string
) {
  try {
    const res = await getJSON(
      `${
        env.VR_API_URL
      }/trains/${trainNumber}/wagonmap/v3?departureStation=${departureStation}&arrivalStation=${arrivalStation}&departureTime=${departureTime.toISOString()}`,
      {
        "x-vr-requestid": crypto.randomUUID(),
        "x-vr-sessionid": sessionId,
        "aste-apikey": env.VR_API_KEY,
        "x-jwt-token": token,
      }
    );

    const parsed = wagonResponseSchema.parse(res);

    return parsed.coaches;
  } catch (e) {
    if (
      e instanceof Error &&
      e.name === "StatusError" &&
      // @ts-expect-error bent typings are wrong and we can't check for instanceof StatusError
      (e.statusCode === 401 || e.statusCode === 403)
    ) {
      try {
        const redis = new Redis({
          url: env.UPSTASH_URL,
          token: env.UPSTASH_TOKEN,
        });
        const newSession = await vrLogin(env.VR_USER, env.VR_PASS);
        await redis.hset("session", {
          sessionId: newSession.sessionId,
          token: newSession.identityToken,
          refreshToken: newSession.refreshToken,
          expiresOn: newSession.expiresOn,
        } satisfies StoredSession);
      } catch (_ignored) {}
    }
    throw e;
  }
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
  const res = await getJSON(`https://rata.digitraffic.fi/api/v1/trains/${date}/${trainNumber}`);

  const data = trainResponseSchema.parse(res);
  const train = data[0];
  if (!train) return null;

  const auth = await getVrAuth();

  train.timeTableRows = train.timeTableRows.filter((r) => r.trainStopping && r.commercialStop);
  // TODO: figure out a real solution for this problem
  if (
    train.timeTableRows
      .slice(0, 2)
      .map((ttr) => ttr.stationShortCode)
      .join(",") === "TUS,TKU"
  ) {
    train.timeTableRows.splice(0, 2);
  }
  if (
    train.timeTableRows
      .slice(-2)
      .map((ttr) => ttr.stationShortCode)
      .join(",") === "TKU,TUS"
  ) {
    train.timeTableRows.splice(-2);
  }

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
            trainNumber,
            auth.sessionId,
            auth.token
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
