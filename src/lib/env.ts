import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    VR_USER: z.string(),
    VR_PASS: z.string(),
    VR_API_KEY: z.string(),
    VR_API_URL: z.string(),
    UPSTASH_URL: z.string(),
    UPSTASH_TOKEN: z.string(),
    ERROR_DISCORD_WEBHOOK: z.string().optional(),
    ERROR_HASTEBIN_URL: z.string().optional(),
    FEEDBACK_DISCORD_WEBHOOK: z.string().optional(),
    MAINTENANCE_MODE: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_PLAUSIBLE_SCRIPT: z.string().optional(),
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().optional(),
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  },
  runtimeEnv: {
    VR_USER: process.env.VR_USER,
    VR_PASS: process.env.VR_PASS,
    VR_API_KEY: process.env.VR_API_KEY,
    VR_API_URL: process.env.VR_API_URL,
    UPSTASH_URL: process.env.UPSTASH_URL,
    UPSTASH_TOKEN: process.env.UPSTASH_TOKEN,
    ERROR_DISCORD_WEBHOOK: process.env.ERROR_DISCORD_WEBHOOK,
    ERROR_HASTEBIN_URL: process.env.ERROR_HASTEBIN_URL,
    FEEDBACK_DISCORD_WEBHOOK: process.env.FEEDBACK_DISCORD_WEBHOOK,
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE,
    NEXT_PUBLIC_PLAUSIBLE_SCRIPT: process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
