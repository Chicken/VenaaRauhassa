import { env } from "~/lib/env";

export function getBaseURL(): string {
  if (env.NEXT_PUBLIC_BASE_URL) return `https://${env.NEXT_PUBLIC_BASE_URL}`;
  if (env.NEXT_PUBLIC_VERCEL_URL) return `https://${env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isInMaintenance(): boolean {
  return env.NEXT_PUBLIC_MAINTENANCE === "true";
}
