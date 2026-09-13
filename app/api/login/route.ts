import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { passcode, next } = await req.json();

  if (typeof passcode !== "string" || passcode !== process.env.TRACKER_PASSCODE) {
    return NextResponse.json({ ok: false, error: "That's not it — try again." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, next: typeof next === "string" ? next : "/" });
  res.cookies.set("wiwo_auth", passcode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
