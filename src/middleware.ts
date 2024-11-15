import dayjs from "dayjs";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const today = dayjs().format("YYYY-MM-DD");
  const trainNumber = request.nextUrl.pathname.split("/")[2];
  return NextResponse.redirect(new URL(`/train/${today}/${trainNumber}`, request.url));
}

export const config = {
  matcher: "/train/:id(\\d{1,})",
};
