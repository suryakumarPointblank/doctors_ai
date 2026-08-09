import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "doctors_admin_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set in .env.local");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(username: string) {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username}.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [username, expires, signature] = parts;
  const payload = `${username}.${expires}`;
  const expected = sign(payload);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  return Date.now() < Number(expires);
}

export function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;
