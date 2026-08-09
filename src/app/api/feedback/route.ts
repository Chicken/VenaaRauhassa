import { env } from "~/lib/env";

interface FeedbackBody {
  feedback: string;
  email?: string;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!env.FEEDBACK_WEBHOOK) {
    return Response.json({ error: "Webhook URL not configured" }, { status: 500 });
  }

  const { feedback, email } = (await request.json()) as FeedbackBody;
  const messageString = email
    ? `\`\`\`Sähköposti: ${email}\nPalaute: ${feedback}\`\`\``
    : `\`\`\`Palaute: ${feedback}\`\`\``;

  const response = await fetch(env.FEEDBACK_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: messageString }),
    signal: AbortSignal.timeout(5000),
  }).catch((error: unknown) => ({ ok: false, error }));

  if (!response.ok) {
    console.error("Failed to send feedback:", response);
    return Response.json({ error: "Failed to send feedback" }, { status: 500 });
  }

  return Response.json({ message: "Feedback sent successfully" });
}
