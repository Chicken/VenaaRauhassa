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
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!env.FEEDBACK_WEBHOOK) {
    res.status(500).json({ error: "Webhook URL not configured" });
    return;
  }

  const { feedback, email }: FeedbackBody = JSON.parse(req.body) as FeedbackBody;

  const messageString = email
    ? "```Sähköposti: " + email + "\nPalaute: " + feedback + "```"
    : "```Palaute: " + feedback + "```";

  const response = await fetch(env.FEEDBACK_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: messageString,
    }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => ({ ok: false, error: err as unknown }));

  if (!response.ok) {
    console.error("Failed to send feedback:", response);
    res.status(500).json({ error: "Failed to send feedback" });
  } else {
    res.status(200).json({ message: "Feedback sent successfully" });
  }
}
