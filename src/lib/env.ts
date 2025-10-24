import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    VR_USER: z.string(),
    VR_PASS: z.string(),
    VR_API_KEY: z.string(),
    VR_API_URL: z.string(),
    VR_API_SECONDARY_URL: z.string(),
    VR_FLOORPLANS_URL: z.string(),
    VR_ID_API: z.string(),
    VR_ID_CHANNEL_ID: z.string(),
    VR_ID_CONNECTION: z.string(),
    VR_ID_TENANT: z.string(),
    VR_CLIENT_ID: z.string(),
    ERROR_WEBHOOK: z.string().optional(),
    ERROR_UPLOAD_URL: z.string().optional(),
    FEEDBACK_WEBHOOK: z.string().optional(),
    MAINTENANCE_MODE: z.string().optional(),
    REQUEST_TIMEOUT: z
      .string()
      .default("5000")
      .transform((val) => parseInt(val, 10)), // in milliseconds
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
    VR_API_SECONDARY_URL: process.env.VR_API_SECONDARY_URL,
    VR_FLOORPLANS_URL: process.env.VR_FLOORPLANS_URL,
    VR_ID_API: process.env.VR_ID_API,
    VR_ID_CHANNEL_ID: process.env.VR_ID_CHANNEL_ID,
    VR_ID_CONNECTION: process.env.VR_ID_CONNECTION,
    VR_ID_TENANT: process.env.VR_ID_TENANT,
    VR_CLIENT_ID: process.env.VR_CLIENT_ID,
    ERROR_WEBHOOK: process.env.ERROR_WEBHOOK,
    ERROR_UPLOAD_URL: process.env.ERROR_UPLOAD_URL,
    FEEDBACK_WEBHOOK: process.env.FEEDBACK_WEBHOOK,
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE,
    REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT,
    NEXT_PUBLIC_PLAUSIBLE_SCRIPT: process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
