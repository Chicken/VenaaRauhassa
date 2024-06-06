import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/lib/env";

interface FeedbackBody {
  feedback: string;
  email?: string;
}
interface ExtendedNextApiRequest extends NextApiRequest {
  body: string;
}

export default async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  if (!env.FEEDBACK_DISCORD_WEBHOOK) {
    res.status(500).json({ error: "Webhook URL not configured" });
    return;
  }

  const { feedback, email }: FeedbackBody = JSON.parse(req.body) as FeedbackBody;

  const messageString = email
    ? "```Sähköposti: " + email + "\nPalaute: " + feedback + "```"
    : "```Palaute: " + feedback + "```";

  const response = await fetch(env.FEEDBACK_DISCORD_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: messageString,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send feedback");
  }

  res.status(200).json({ message: "Feedback sent successfully" });
}
