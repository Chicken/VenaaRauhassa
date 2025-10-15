// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAsyncFn = (...args: any[]) => Promise<any>;

export function cache<TFn extends AnyAsyncFn>(timeMs: number, fn: TFn): TFn {
  const cache = new Map<string, Awaited<ReturnType<TFn>>>();
  return ((...args: Parameters<TFn>) => {
    const key = args.map((arg) => String(arg)).join(",");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cache.has(key)) return cache.get(key)!;
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
