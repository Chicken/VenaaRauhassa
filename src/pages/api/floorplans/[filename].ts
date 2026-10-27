import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { filename } = req.query;
  if (typeof filename !== "string" || !/^[a-zA-Z0-9_-]+\.svg$/.test(filename)) {
    res.status(400).json({ error: "Invalid floorplan filename" });
    return;
  }

  try {
    const response = await fetch(env.VR_FLOORPLANS_URL + filename, {
      signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      res.status(response.status === 404 ? 404 : 502).end();
      return;
    }

    const svg = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.status(200).send(svg);
  } catch (error) {
    console.error("Floorplan fetch error:", error);
    res.status(502).end();
  }
}
