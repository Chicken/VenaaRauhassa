import type { NextApiRequest, NextApiResponse } from "next";
import { registry } from "~/lib/metrics";
import { env } from "~/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!env.METRICS_SECRET || authHeader !== `Bearer ${env.METRICS_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.setHeader("Content-Type", registry.contentType);
  res.send(await registry.metrics());
}
