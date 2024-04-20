export function getBaseURL(): string {
  if (process.env.NEXT_OVERWRITE_BASE_URL) return process.env.NEXT_OVERWRITE_BASE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
