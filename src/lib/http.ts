import bent from "bent";

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

const _postJSON = bent("POST", "json", {
  "User-Agent": userAgent,
});

export const postJSON = async (
  url: string,
  body?: bent.RequestBody,
  headers?: Record<string, string>
) => {
  try {
    const res = (await _postJSON(url, body, headers)) as unknown;
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

const _getJSON = bent("GET", "json", {
  "User-Agent": userAgent,
});

export const getJSON = async (url: string, headers?: Record<string, string>) => {
  try {
    const res = (await _getJSON(url, undefined, headers)) as unknown;
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
