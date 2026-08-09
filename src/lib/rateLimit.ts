import { env } from "~/lib/env";
import { rateLimitRequests } from "~/lib/metrics";

const store = new Map<string, { count: number; resetAt: number }>();

function expandIPv6(addr: string): number[] {
  const halves = addr.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - left.length - right.length;
  const groups = [...left, ...Array<string>(fill).fill("0"), ...right];
  return groups.map((g) => parseInt(g || "0", 16));
}

function truncateIPv6ToSubnet(addr: string, prefixLength: number): string {
  const groups = expandIPv6(addr);
  const fullGroups = Math.floor(prefixLength / 16);
  const remainder = prefixLength % 16;
  return groups
    .map((g, i) => {
      if (i < fullGroups) return g;
      if (i === fullGroups && remainder > 0) return g & (0xffff & (0xffff << (16 - remainder)));
      return 0;
    })
    .map((g) => g.toString(16))
    .join(":");
}

export function getIp(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for");
  const raw =
    (forwarded ? forwarded.split(",")[0]?.trim() : (headers.get("x-real-ip") ?? undefined)) ??
    "unknown";
  return raw.includes(":") ? truncateIPv6ToSubnet(raw, env.RATE_LIMIT_IPV6_PREFIX) : raw;
}

/** Returns null if allowed, or the retry-after seconds if rate limited. */
export function checkRateLimit(ip: string): number | null {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + env.RATE_LIMIT_WINDOW_MS });
    rateLimitRequests.inc({ status: "allowed" });
    return null;
  }

  if (entry.count >= env.RATE_LIMIT_MAX) {
    rateLimitRequests.inc({ status: "limited" });
    return Math.ceil((entry.resetAt - now) / 1000);
  }

  entry.count++;
  rateLimitRequests.inc({ status: "allowed" });
  return null;
}
