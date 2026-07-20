import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?calendar=error`);
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(`${appUrl}/settings?calendar=connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?calendar=error`);
  }
}
