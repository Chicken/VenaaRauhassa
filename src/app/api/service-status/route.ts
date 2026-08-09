import { getAPIStatus } from "~/lib/status";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getAPIStatus());
  } catch (error) {
    console.error("Status fetch error:", error);
    return new Response(null, { status: 500 });
  }
}
