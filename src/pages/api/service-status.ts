import type { NextApiRequest, NextApiResponse } from "next";
import { getAPIStatus } from "~/lib/status";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const status = await getAPIStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error("Status fetch error:", error);
    res.status(500).end();
  }
}
