import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, createSessionToken } from "@/lib/adminAuth";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

const ROUTE = "POST /api/admin/login";

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const expectedUsername = process.env.ADMIN_USERNAME || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "";

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !safeEqual(username, expectedUsername) ||
    !safeEqual(password, expectedPassword)
  ) {
    logError(ROUTE, "Login failed: invalid credentials", null, { username: typeof username === "string" ? username : undefined });
    return NextResponse.json({ success: false, error: "Invalid username or password." }, { status: 401 });
  }

  logInfo(ROUTE, "Login succeeded", { username });
  const token = createSessionToken(username);
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
