import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getInitialTrains } from "~/lib/digitraffic";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date query parameter is required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date must be in YYYY-MM-DD format" }, { status: 400 });
  }

  return NextResponse.json(await getInitialTrains(date));
}
