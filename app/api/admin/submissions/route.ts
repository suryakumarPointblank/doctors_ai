import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const collectionName = process.env.MONGODB_COLLECTION || "doctor_submissions";
  const db = await getDatabase();
  const submissions = await db
    .collection(collectionName)
    .find({})
    .sort({ submittedAt: -1 })
    .toArray();

  return NextResponse.json({ success: true, submissions });
}
