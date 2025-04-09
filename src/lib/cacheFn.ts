// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFn = (...args: any[]) => any;

export function cache<TFn extends AnyFn>(timeMs: number, fn: TFn): TFn {
  const cache = new Map<string, ReturnType<TFn>>();
  return ((...args: Parameters<TFn>) => {
    const key = args.map((arg) => String(arg)).join(",");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args) as ReturnType<TFn>;
    cache.set(key, result);
    setTimeout(() => cache.delete(key), timeMs);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }) as TFn;
}

export const HOUR = 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
