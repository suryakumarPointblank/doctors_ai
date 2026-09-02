import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { zoneForToken } from "@/lib/zoneAccess";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const zone = zoneForToken(token);
  if (!zone) {
    return NextResponse.json({ success: false, error: "Invalid or expired link." }, { status: 401 });
  }

  const collectionName = process.env.MONGODB_COLLECTION || "doctor_submissions";
  const db = await getDatabase();
  const submissions = await db
    .collection(collectionName)
    .find({ zone })
    .sort({ submittedAt: -1 })
    .toArray();

  return NextResponse.json({ success: true, zone, submissions });
}
