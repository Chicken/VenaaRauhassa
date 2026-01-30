import { cacheRequests } from "~/lib/metrics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAsyncFn = (...args: any[]) => Promise<any>;

export function cache<TFn extends AnyAsyncFn>(timeMs: number, fn: TFn, metricsName?: string): TFn {
  const cache = new Map<string, Awaited<ReturnType<TFn>>>();
  return ((...args: Parameters<TFn>) => {
    const key = args.map((arg) => String(arg)).join(",");
    if (cache.has(key)) {
      if (metricsName) cacheRequests.inc({ function: metricsName, status: "hit" });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return cache.get(key)!;
    }
    if (metricsName) cacheRequests.inc({ function: metricsName, status: "miss" });
    return new Promise((res, rej) => {
      fn(...args)
        .then((result) => {
          cache.set(key, result as Awaited<ReturnType<TFn>>);
          setTimeout(() => cache.delete(key), timeMs);
          res(result);
        })
        .catch((err) => rej(err));
    });
  }) as TFn;
}

export const HOUR = 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
