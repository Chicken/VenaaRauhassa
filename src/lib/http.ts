import { env } from "~/lib/env";
import { externalApiRequestDuration, externalApiRequests } from "~/lib/metrics";

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

function getVendor(url: string) {
  if (url.includes("vr.fi") || url.includes("vrpublic.fi")) return "VR";
  if (url.includes("digitraffic.fi")) return "Digitraffic";
  return "Other";
}

export const postJSON = async (url: string, body?: unknown, headers?: Record<string, string>) => {
  const vendor = getVendor(url);
  const end = externalApiRequestDuration.startTimer({ vendor, method: "POST" });
  try {
    const res = (await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "User-Agent": userAgent,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
    }).then(async (res) => {
      externalApiRequests.inc({ vendor, method: "POST", status: res.status });
      if (!res.ok) {
        const err = new Error(res.status + " " + res.statusText);
        // @ts-expect-error just adding some ghost properties
        err.response = res;
        // @ts-expect-error just adding some ghost properties
        err.responseBody = (await res.json().catch(() => res.text().catch(() => null))) as unknown;
        throw err;
      }
      return res.json();
    })) as unknown;
    end();
    return res;
  } catch (e: unknown) {
    end(); // ensure timer ends on error too, though status logic above handles the response code. 
           // If fetch fails (network error), status won't be recorded in the .then block.
           // We could add a catch block counter for network errors if needed.
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
  const vendor = getVendor(url);
  const end = externalApiRequestDuration.startTimer({ vendor, method: "GET" });
  try {
    const res = (await fetch(url, {
      method: "GET",
      headers: {
        ...headers,
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
    }).then(async (res) => {
      externalApiRequests.inc({ vendor, method: "GET", status: res.status });
      if (!res.ok) {
        const err = new Error(res.status + " " + res.statusText);
        // @ts-expect-error just adding some ghost properties
        err.response = res;
        // @ts-expect-error just adding some ghost properties
        err.responseBody = (await res.json().catch(() => res.text().catch(() => null))) as unknown;
        throw err;
      }
      return res.json();
    })) as unknown;
    end();
    return res;
  } catch (e: unknown) {
    end();
    if (e instanceof Error) {
      // @ts-expect-error just adding some ghost properties
      e.requestUrl = url;
      // @ts-expect-error just adding some ghost properties
      e.requestHeaders = sanitizeObject(headers);
    }
    throw e;
  }
};
