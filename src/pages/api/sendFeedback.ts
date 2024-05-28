import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { feedback, email } = JSON.parse(req.body);
  if (!env.FEEDBACK_DISCORD_WEBHOOK) return;
  
  try {
    const messageString = email
      ? "```Sähköposti: " + email + "\nPalaute: " + feedback + "```"
      : "```Palaute: " + feedback + "```";

    await fetch(env.FEEDBACK_DISCORD_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: messageString,
      }),
    });
  } catch (err: any) {
    console.log(err.message);
    res.status(500).send({ error: "Failed to send feedback" });
    return;
  }

  res.status(200).json({ message: "Feedback sent successfully" });
}
