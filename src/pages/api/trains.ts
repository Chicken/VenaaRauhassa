import type { NextApiRequest, NextApiResponse } from "next";
import { getInitialTrains } from "~/lib/digitraffic";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (typeof req.query.date !== "string") {
    res.status(400).json({ error: "Date query parameter is required" });
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
    res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    return;
  }

  res.status(200).json(await getInitialTrains(req.query.date));
}
