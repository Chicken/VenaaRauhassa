import { error } from "~/lib/logger";
import { cacheRequests } from "~/lib/metrics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAsyncFn = (...args: any[]) => Promise<any>;

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  timeout: NodeJS.Timeout;
}

export function cache<TFn extends AnyAsyncFn>(
  freshTimeMs: number,
  staleTimeMs: number,
  fn: TFn,
  metricsName: string
): TFn {
  const cache = new Map<string, CacheEntry<Awaited<ReturnType<TFn>>>>();

  return ((...args: Parameters<TFn>) => {
    const key = args.map((arg) => String(arg)).join(",");
    const entry = cache.get(key);
    const now = Date.now();

    if (entry && now - entry.timestamp < freshTimeMs) {
      if (metricsName) cacheRequests.inc({ function: metricsName, status: "hit" });
      return Promise.resolve(entry.value);
    }

    return new Promise((resolve, reject) => {
      fn(...args)
        .then((result) => {
          if (metricsName) cacheRequests.inc({ function: metricsName, status: "miss" });
          if (cache.has(key)) clearTimeout(cache.get(key)!.timeout);
          cache.set(key, {
            value: result as Awaited<ReturnType<TFn>>,
            timestamp: Date.now(),
            timeout: setTimeout(() => cache.delete(key), freshTimeMs + staleTimeMs),
          });
          resolve(result);
        })
        .catch((err) => {
          if (metricsName) cacheRequests.inc({ function: metricsName, status: "miss-error" });
          if (entry && now - entry.timestamp < freshTimeMs + staleTimeMs) {
            console.warn(
              `Cache refresh failed for ${metricsName ?? "unknown"}, returning stale data. Error: ${
                err instanceof Error ? err.message : "Unknown"
              }`
            );
            void error(
              {
                message: `Error in ${
                  metricsName ?? "unknown"
                } cache refresh, returning stale data.`,
              },
              err
            ).catch(console.error);
            resolve(entry.value);
          } else {
            reject(err);
          }
        });
    });
  }) as TFn;
}

export const HOUR = 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
