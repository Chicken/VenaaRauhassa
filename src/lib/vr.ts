import crypto from "crypto";
import { JSDOM as JSDom } from "jsdom";
import { z, ZodError } from "zod";
import { env } from "~/lib/env";
import { getJSON, postJSON } from "~/lib/http";
import { error } from "~/lib/logger";
// TODO: refactor to use fetch or something...
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { cache, HOUR, MINUTE } from "~/lib/cacheFn";
import { digitrafficUser } from "~/lib/digitraffic";
import { sessionStore } from "~/lib/sessionStore";
import { sessionUpdates } from "~/lib/metrics";

function createRandomString() {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.";
  return Array.from(crypto.getRandomValues(new Uint8Array(43)))
    .map((v) => charset[v % charset.length])
    .join("");
}

const tokenSchema = z.object({
  bffToken: z.string(),
  expiresOn: z.string(),
});

const auth0ConfigSchema = z.object({
  extraParams: z.object({
    state: z.string(),
  }),
});

async function vrLogin(username: string, password: string) {
  console.log("Logging in on a new session...");
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));
  const codeVerifier = createRandomString();
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64");

  const initLoginUrl = new URL(
    `${env.VR_ID_API}/vrgroup/uaa/v1/api/login?${new URLSearchParams({
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      locale: "en",
      channel_id: env.VR_ID_CHANNEL_ID,
      redirect_uri: new URL(
        `${env.VR_API_URL}/ciam/callback?${new URLSearchParams({
          redirect_uri: new URL(
            `${env.VR_API_SECONDARY_URL}/?${new URLSearchParams({
              ibi: "fi.vr.mobile.app",
              apn: "fi.vr.mobile.app",
              ius: "matkallaprod",
              isi: "1410647394",
              ofl: "https://www.vr.fi/",
              link: new URL(
                `${env.VR_API_SECONDARY_URL}/ciam-auth?${new URLSearchParams({
                  challenge: codeChallenge,
                  action: "login",
                }).toString()}`
              ).toString(),
            }).toString()}`
          ).toString(),
        }).toString()}`
      ).toString(),
    }).toString()}`
  ).toString();

  const loginInitRes = await client.get(initLoginUrl, {
    signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
  });
  if (loginInitRes.status !== 200) throw new Error("Failed to get login init");
  if (typeof loginInitRes.data !== "string") throw new Error("Login init response was not text");
  const auth0Config = auth0ConfigSchema.parse(
    JSON.parse(
      Buffer.from(loginInitRes.data.split(' = "')[1]?.split('"')[0] ?? "", "base64").toString(
        "utf-8"
      )
    )
  );

  const loginRes = await client.post(
    `${env.VR_ID_API}/usernamepassword/login`,
    {
      client_id: env.VR_CLIENT_ID,
      tenant: env.VR_ID_TENANT,
      reponse_type: "token",
      connection: env.VR_ID_CONNECTION,
      state: auth0Config.extraParams.state,
      username,
      password,
    },
    {
      signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
    }
  );
  if (typeof loginRes.data !== "string") throw new Error("Login init response was not text");
  const { document: loginDataDom } = new JSDom(loginRes.data).window;

  const nullableCallbackData = {
    wa: loginDataDom.querySelector("input[name='wa']")?.getAttribute("value"),
    wresult: loginDataDom.querySelector("input[name='wresult']")?.getAttribute("value"),
    wctx: loginDataDom.querySelector("input[name='wctx']")?.getAttribute("value"),
  };

  if (!nullableCallbackData.wa || !nullableCallbackData.wresult || !nullableCallbackData.wctx)
    throw new Error("Failed to parse login form data");

  const callbackData = nullableCallbackData as { [K in keyof typeof nullableCallbackData]: string };

  const callbackUrl = `${env.VR_ID_API}/login/callback`;
  const callbackRes = await client.post(callbackUrl, new URLSearchParams(callbackData).toString(), {
    signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
  });

  const sessionKey = new URL(
    // i cant be arsed with typings rn
    // eslint-disable-next-line
    new URLSearchParams((callbackRes.request?.path as string).slice(2)).get("link")!
  ).searchParams.get("session_key");

  const sessionId = crypto.randomUUID();

  const tokenRes = await client.post(
    `${env.VR_API_URL}/ciam/tokens`,
    {
      sessionKey,
      verifier: codeVerifier,
    },
    {
      headers: {
        "x-vr-requestid": crypto.randomUUID(),
        "x-vr-sessionid": sessionId,
        "aste-apikey": env.VR_API_KEY,
      },
      signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
    }
  );
  if (typeof tokenRes.data !== "object") throw new Error("Token response was not json");

  return {
    ...tokenSchema.parse(tokenRes.data),
    sessionId: sessionId,
  };
}

async function vrRefreshToken(token: string, sessionId: string) {
  console.log("Refreshing token...");
  const session = await postJSON(
    `${env.VR_API_URL}/auth/token`,
    {
      /** empty json body */
    },
    {
      "x-vr-requestid": crypto.randomUUID(),
      "x-vr-sessionid": sessionId,
      "aste-apikey": env.VR_API_KEY,
      "x-jwt-token": token,
    }
  );

  return tokenSchema.parse(session);
}

async function getVrAuth(retry = 0): Promise<{ sessionId: string; token: string }> {
  const currentSession = sessionStore.get();
  if (!currentSession || retry >= 2) {
    if (!currentSession) sessionUpdates.inc({ type: "login", reason: "no-session" });
    else sessionUpdates.inc({ type: "login", reason: "retry-limit" });
    const newSession = await vrLogin(env.VR_USER, env.VR_PASS);
    sessionStore.set({
      sessionId: newSession.sessionId,
      token: newSession.bffToken,
      expiresOn: new Date(newSession.expiresOn).getTime(),
    });
    return {
      sessionId: newSession.sessionId,
      token: newSession.bffToken,
    };
  }
  if (currentSession.expiresOn < Date.now() + 2 * MINUTE) {
    try {
      if (retry > 0) sessionUpdates.inc({ type: "refresh", reason: "retry" });
      else sessionUpdates.inc({ type: "refresh", reason: "expiry" });
      const newSession = await vrRefreshToken(currentSession.token, currentSession.sessionId);
      sessionStore.set({
        sessionId: currentSession.sessionId,
        token: newSession.bffToken,
        expiresOn: new Date(newSession.expiresOn).getTime(),
      });
      return {
        sessionId: currentSession.sessionId,
        token: newSession.bffToken,
      };
    } catch (e) {
      console.error("refreshing session failed", e);
      // just sleep a bit and try again
      await new Promise((res) => setTimeout(res, 50));
      return getVrAuth(retry + 1);
    }
  }

  return {
    sessionId: currentSession.sessionId,
    token: currentSession.token,
  };
}

const wagonResponseSchema = z.object({
  coaches: z.record(
    z.string(),
    z.object({
      number: z.number(),
      placeType: z
        .string()
        .nullable()
        .optional()
        .transform((v) => v ?? null),
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
  let res;
  try {
    res = await getJSON(
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
      // @ts-expect-error lol no typings
      // eslint-disable-next-line
      e.response?.status === 401
    ) {
      try {
        sessionUpdates.inc({ type: "login", reason: "wagon-error" });
        const newSession = await vrLogin(env.VR_USER, env.VR_PASS);
        sessionStore.set({
          sessionId: newSession.sessionId,
          token: newSession.bffToken,
          expiresOn: new Date(newSession.expiresOn).getTime(),
        });
      } catch (_ignored) {}
    }
    if (e instanceof ZodError) {
      // @ts-expect-error really abusing errors huh
      e.input = res;
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
        cancelled: z.boolean(),
        type: z.enum(["ARRIVAL", "DEPARTURE"]),
      })
    ),
  })
);

export const getTrainOnDate = cache(10 * MINUTE, 2 * HOUR, async (date: string, trainNumber: string) => {
  const res = await getJSON(`https://rata.digitraffic.fi/api/v1/trains/${date}/${trainNumber}`, {
    "Digitraffic-User": digitrafficUser,
  });

  const data = trainResponseSchema.parse(res);
  const train = data[0];
  if (!train) return null;

  const auth = await getVrAuth();

  train.timeTableRows = train.timeTableRows.filter(
    (r) => !r.cancelled && r.trainStopping && r.commercialStop
  );
  // Somethings filtering is whack with cancellations, remove first or last if they are clearly wrong
  if (train.timeTableRows.at(0)?.type === "ARRIVAL") train.timeTableRows.shift();
  if (train.timeTableRows.at(-1)?.type === "DEPARTURE") train.timeTableRows.pop();

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
          try {
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
          } catch (e) {
            // cant search because HSL
            if (dep.stationShortCode !== "PSL" && arr.stationShortCode !== "HKI") {
              console.error(e);
              void error(
                {
                  date,
                  train: trainNumber,
                  error:
                    e instanceof Error
                      ? e instanceof ZodError
                        ? "Zod validation error"
                        : e.name + " " + e.message
                      : undefined,
                  message: "Wagon map data fetching failed",
                },
                e
              ).catch(console.error);
            }
            return {
              dep,
              arr,
              wagons: null,
              error: e,
            };
          }
        })
    ),
  };

  // TODO: figure out a real solution for this problem
  if (
    newTrain.timeTableRows.at(-1) != null &&
    newTrain.timeTableRows.at(-2) != null &&
    newTrain.timeTableRows.at(-1)!.wagons == null &&
    newTrain.timeTableRows.at(-2)!.wagons != null &&
    // cant search because HSL
    newTrain.timeTableRows.at(-1)!.dep.stationShortCode === "PSL" &&
    newTrain.timeTableRows.at(-1)!.arr.stationShortCode === "HKI"
  ) {
    newTrain.timeTableRows.at(-1)!.wagons = newTrain.timeTableRows.at(-2)!.wagons;
  }

  const nullWagons = newTrain.timeTableRows.filter((ttr) => ttr.wagons == null).length;
  if (nullWagons === newTrain.timeTableRows.length || nullWagons >= 3) {
    throw new AggregateError(
      newTrain.timeTableRows.filter((ttr) => "error" in ttr).map((ttr) => ttr.error),
      "Too many null wagons!"
    );
  }

  for (const ttr of newTrain.timeTableRows) delete ttr.error;

  return newTrain;
}, "getTrainOnDate");
