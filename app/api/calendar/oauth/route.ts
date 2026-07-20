import { NextResponse } from "next/server";
import { getGoogleAuthUrl, isCalendarConfigured } from "@/lib/calendar";

export async function GET() {
  if (!isCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar не налаштовано на сервері" },
      { status: 400 },
    );
  }
  return NextResponse.redirect(getGoogleAuthUrl());
}
