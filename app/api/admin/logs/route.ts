import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

const LOG_COLLECTION = process.env.MONGODB_LOG_COLLECTION || "doctor_ai_logs";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200) || 200, 1000);

  const filter = level === "info" || level === "error" ? { level } : {};

  const db = await getDatabase();
  const logs = await db
    .collection(LOG_COLLECTION)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return NextResponse.json({ success: true, logs });
}
