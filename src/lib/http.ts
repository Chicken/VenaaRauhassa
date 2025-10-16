import { env } from "~/lib/env";

const userAgent = "VenaaRauhassa (https://github.com/Chicken/VenaaRauhassa)";

const sanitizedKeywords = ["aste-apikey", "x-jwt-token", "password", "refreshtoken"];
function sanitizeObject(obj: Record<string, unknown>) {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    if (sanitizedKeywords.includes(key.toLowerCase())) {
      const original = String(sanitized[key]) ?? "";
      sanitized[key] = original.slice(0, 2) + "..." + original.slice(-2);
    }
  }
  return sanitized;
}

export const postJSON = async (url: string, body?: unknown, headers?: Record<string, string>) => {
  try {
    const res = (await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "User-Agent": userAgent,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
    }).then((res) => res.json())) as unknown;
    return res;
  } catch (e: unknown) {
    if (e instanceof Error) {
      // @ts-expect-error just adding some ghost properties
      e.requestUrl = url;
      // @ts-expect-error just adding some ghost properties
      e.requestBody = sanitizeObject(body);
      // @ts-expect-error just adding some ghost properties
      e.requestHeaders = sanitizeObject(headers);
    }
    throw e;
  }
};

export const getJSON = async (url: string, headers?: Record<string, string>) => {
  try {
    const res = (await fetch(url, {
      method: "GET",
      headers: {
        ...headers,
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
    }).then((res) => res.json())) as unknown;
    return res;
  } catch (e: unknown) {
    if (e instanceof Error) {
      // @ts-expect-error just adding some ghost properties
      e.requestUrl = url;
      // @ts-expect-error just adding some ghost properties
      e.requestHeaders = sanitizeObject(headers);
    }
    throw e;
  }
};
