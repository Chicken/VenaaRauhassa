import { env } from "~/lib/env";
import { registry } from "~/lib/metrics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!env.METRICS_SECRET || authHeader !== `Bearer ${env.METRICS_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new Response(await registry.metrics(), {
    headers: { "Content-Type": registry.contentType },
  });
}
