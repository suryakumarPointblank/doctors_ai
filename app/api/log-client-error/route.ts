import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

const ROUTE = "CLIENT";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message : "Unknown client error";
    const stack = typeof body.stack === "string" ? body.stack : undefined;
    const page = typeof body.page === "string" ? body.page : undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    logError(ROUTE, message, null, {
      page,
      userAgent,
      stack,
      context: body.context,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Logging must never break the client that's reporting the error.
    return NextResponse.json({ success: true });
  }
}
