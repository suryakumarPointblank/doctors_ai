import { NextRequest, NextResponse } from "next/server";
import { uploadToGCS } from "@/lib/gcs";
import { getDatabase } from "@/lib/mongodb";
import { ZONES, ZONE_MANAGERS, CITY_TYPES, PRACTICE_TYPES, INPUTS_NEEDED, REGIONAL_LANGUAGES } from "@/lib/constants";

export const runtime = "nodejs";

const MIN_VOICE_SECONDS = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const abeName      = (form.get("abeName")      as string | null)?.trim();
    const hq           = (form.get("hq")           as string | null)?.trim();
    const empId        = (form.get("empId")        as string | null)?.trim();
    const zone         = (form.get("zone")         as string | null)?.trim();

    const doctorName       = (form.get("doctorName")       as string | null)?.trim();
    const doctorUniqueId   = (form.get("doctorUniqueId")   as string | null)?.trim();
    const doctorMobile     = (form.get("doctorMobile")     as string | null)?.trim();
    const doctorEmail      = (form.get("doctorEmail")      as string | null)?.trim();

    const city              = (form.get("city")              as string | null)?.trim();
    const cityType          = (form.get("cityType")          as string | null)?.trim();
    const practiceType      = (form.get("practiceType")      as string | null)?.trim();
    const yearsExperience   = Number(form.get("yearsExperience") ?? NaN);
    const monthlyPcvPotential = Number(form.get("monthlyPcvPotential") ?? NaN);
    const pneubevax14Usage  = Number(form.get("pneubevax14Usage") ?? NaN);

    const inputNeeded       = (form.get("inputNeeded")       as string | null)?.trim();
    const regionalLanguage  = (form.get("regionalLanguage")  as string | null)?.trim();
    const script            = (form.get("script")            as string | null)?.trim() ?? "";

    const consent      = (form.get("consent")      as string | null) === "true";
    const voiceSeconds = Number(form.get("voiceSeconds") ?? 0);

    const photo = form.get("photo") as File | null;
    const voice = form.get("voice") as File | null;

    if (
      !abeName || !hq || !empId || !zone ||
      !doctorName || !doctorUniqueId || !doctorMobile || !doctorEmail ||
      !city || !cityType || !practiceType ||
      Number.isNaN(yearsExperience) || Number.isNaN(monthlyPcvPotential) || Number.isNaN(pneubevax14Usage) ||
      !inputNeeded || !regionalLanguage ||
      !photo || !voice
    ) {
      return NextResponse.json(
        { success: false, error: "All fields including photo and voice recording are required." },
        { status: 400 }
      );
    }

    if (!ZONES.includes(zone)) {
      return NextResponse.json({ success: false, error: "Invalid zone." }, { status: 400 });
    }
    if (!CITY_TYPES.includes(cityType)) {
      return NextResponse.json({ success: false, error: "Invalid city type." }, { status: 400 });
    }
    if (!PRACTICE_TYPES.includes(practiceType)) {
      return NextResponse.json({ success: false, error: "Invalid type of practice." }, { status: 400 });
    }
    if (!INPUTS_NEEDED.includes(inputNeeded)) {
      return NextResponse.json({ success: false, error: "Invalid input needed." }, { status: 400 });
    }
    if (!REGIONAL_LANGUAGES.includes(regionalLanguage)) {
      return NextResponse.json({ success: false, error: "Invalid regional language." }, { status: 400 });
    }
    if (!/^[0-9]{10}$/.test(doctorMobile)) {
      return NextResponse.json({ success: false, error: "Invalid doctor's mobile number." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(doctorEmail)) {
      return NextResponse.json({ success: false, error: "Invalid doctor's email address." }, { status: 400 });
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
      zoneManager: ZONE_MANAGERS[zone] ?? "",
      doctorName,
      doctorUniqueId,
      doctorMobile,
      doctorEmail,
      city,
      cityType,
      practiceType,
      yearsExperience,
      monthlyPcvPotential,
      pneubevax14Usage,
      inputNeeded,
      regionalLanguage,
      script,
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
