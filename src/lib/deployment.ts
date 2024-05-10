export function getBaseURL(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return `https://${process.env.NEXT_PUBLIC_BASE_URL}`;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isInMaintenance(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE === "true";
}
