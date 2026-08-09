import { NextRequest, NextResponse } from "next/server";
import { uploadToGCS } from "@/lib/gcs";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

const ZONES = ["South 1", "South 2", "West", "North", "East"];
const ACTIVITIES = ["Customized LAMA/Poster", "S-20 campaign"];
const INPUTS_NEEDED = ["LAMA", "A2 Poster"];
const MIN_VOICE_SECONDS = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const abeName      = (form.get("abeName")      as string | null)?.trim();
    const hq           = (form.get("hq")           as string | null)?.trim();
    const empId        = (form.get("empId")        as string | null)?.trim();
    const zone         = (form.get("zone")         as string | null)?.trim();
    const doctorName   = (form.get("doctorName")   as string | null)?.trim();
    const doctorDegree = (form.get("doctorDegree") as string | null)?.trim();
    const activity     = (form.get("activity")     as string | null)?.trim();
    const inputNeeded  = (form.get("inputNeeded")  as string | null)?.trim();
    const consent      = (form.get("consent")      as string | null) === "true";
    const voiceSeconds = Number(form.get("voiceSeconds") ?? 0);

    const photo = form.get("photo") as File | null;
    const voice = form.get("voice") as File | null;

    if (
      !abeName || !hq || !empId || !zone || !doctorName || !doctorDegree ||
      !activity || !inputNeeded || !photo || !voice
    ) {
      return NextResponse.json(
        { success: false, error: "All fields including photo and voice recording are required." },
        { status: 400 }
      );
    }

    if (!ZONES.includes(zone)) {
      return NextResponse.json({ success: false, error: "Invalid zone." }, { status: 400 });
    }
    if (!ACTIVITIES.includes(activity)) {
      return NextResponse.json({ success: false, error: "Invalid activity." }, { status: 400 });
    }
    if (!INPUTS_NEEDED.includes(inputNeeded)) {
      return NextResponse.json({ success: false, error: "Invalid input needed." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json(
        { success: false, error: "Doctor's consent is required." },
        { status: 400 }
      );
    }
    if (voiceSeconds < MIN_VOICE_SECONDS) {
      return NextResponse.json(
        { success: false, error: `Voice recording must be at least ${MIN_VOICE_SECONDS} seconds.` },
        { status: 400 }
      );
    }

    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const photoUrl = await uploadToGCS(photoBuffer, photo.name, photo.type, "doctors/photos");

    const voiceBuffer = Buffer.from(await voice.arrayBuffer());
    const voiceUrl = await uploadToGCS(voiceBuffer, voice.name, voice.type, "doctors/voice");

    const collectionName = process.env.MONGODB_COLLECTION || "doctor_submissions";
    const db = await getDatabase();
    await db.collection(collectionName).insertOne({
      abeName,
      hq,
      empId,
      zone,
      doctorName,
      doctorDegree,
      activity,
      inputNeeded,
      photoUrl,
      voiceUrl,
      voiceSeconds,
      consent,
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true, photoUrl, voiceUrl });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { success: false, error: "Submission failed. Please try again." },
      { status: 500 }
    );
  }
}
