import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { getDatabase } from "@/lib/mongodb";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

const ROUTE = "GET /api/admin/submissions";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    logError(ROUTE, "Unauthorized access attempt", null);
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collectionName = process.env.MONGODB_COLLECTION || "doctor_submissions";
    const db = await getDatabase();
    const submissions = await db
      .collection(collectionName)
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();

    logInfo(ROUTE, "Fetched submissions", { count: submissions.length });
    return NextResponse.json({ success: true, submissions });
  } catch (err) {
    logError(ROUTE, "Failed to fetch submissions", err);
    return NextResponse.json({ success: false, error: "Failed to fetch submissions." }, { status: 500 });
  }
}
