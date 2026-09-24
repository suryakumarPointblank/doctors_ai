import { NextRequest, NextResponse } from "next/server";
import { gcsPathFromPublicUrl, makeGcsFilePublic } from "@/lib/gcs";
import { getDatabase } from "@/lib/mongodb";
import { ZONES, ZONE_MANAGERS, CITY_TYPES, PRACTICE_TYPES, INPUTS_NEEDED, REGIONAL_LANGUAGES } from "@/lib/constants";
import { logInfo, logError } from "@/lib/logger";

const ROUTE = "POST /api/submit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_VOICE_SECONDS = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const abeName      = (body.abeName as string | undefined)?.trim();
    const hq           = (body.hq      as string | undefined)?.trim();
    const empId        = (body.empId   as string | undefined)?.trim();
    const zone         = (body.zone    as string | undefined)?.trim();

    const doctorName       = (body.doctorName     as string | undefined)?.trim();
    const doctorUniqueId   = (body.doctorUniqueId as string | undefined)?.trim();
    const doctorMobile     = (body.doctorMobile   as string | undefined)?.trim();
    const doctorEmail      = (body.doctorEmail    as string | undefined)?.trim();
    const doctorQualification = (body.doctorQualification as string | undefined)?.trim();
    const doctorSpeciality    = (body.doctorSpeciality    as string | undefined)?.trim();

    const city              = (body.city              as string | undefined)?.trim();
    const cityType          = (body.cityType          as string | undefined)?.trim();
    const practiceType      = (body.practiceType      as string | undefined)?.trim();
    const yearsExperience   = Number(body.yearsExperience ?? NaN);
    const monthlyPcvPotential = Number(body.monthlyPcvPotential ?? NaN);
    const pneubevax14Usage = Number(body.pneubevax14Usage ?? NaN);

    const inputNeeded       = (body.inputNeeded      as string | undefined)?.trim();
    const regionalLanguage  = (body.regionalLanguage as string | undefined)?.trim();
    const script            = (body.script           as string | undefined)?.trim() ?? "";

    const consent      = body.consent === true;
    const voiceSeconds = Number(body.voiceSeconds ?? 0);

    const photoUrl = (body.photoUrl as string | undefined)?.trim();
    const voiceUrl = (body.voiceUrl as string | undefined)?.trim();

    if (
      !abeName || !hq || !empId || !zone ||
      !doctorName || !doctorUniqueId || !doctorMobile || !doctorEmail ||
      !doctorQualification || !doctorSpeciality ||
      !city || !cityType || !practiceType ||
      Number.isNaN(yearsExperience) || Number.isNaN(monthlyPcvPotential) || Number.isNaN(pneubevax14Usage) ||
      !inputNeeded || !regionalLanguage ||
      !photoUrl || !voiceUrl
    ) {
      logError(ROUTE, "Validation failed: missing required fields", null, { empId, doctorUniqueId });
      return NextResponse.json(
        { success: false, error: "All fields including photo and voice recording are required." },
        { status: 400 }
      );
    }

    if (!ZONES.includes(zone)) {
      logError(ROUTE, "Validation failed: invalid zone", null, { empId, zone });
      return NextResponse.json({ success: false, error: "Invalid zone." }, { status: 400 });
    }
    if (!CITY_TYPES.includes(cityType)) {
      logError(ROUTE, "Validation failed: invalid city type", null, { empId, cityType });
      return NextResponse.json({ success: false, error: "Invalid city type." }, { status: 400 });
    }
    if (!PRACTICE_TYPES.includes(practiceType)) {
      logError(ROUTE, "Validation failed: invalid practice type", null, { empId, practiceType });
      return NextResponse.json({ success: false, error: "Invalid type of practice." }, { status: 400 });
    }
    if (!INPUTS_NEEDED.includes(inputNeeded)) {
      logError(ROUTE, "Validation failed: invalid input needed", null, { empId, inputNeeded });
      return NextResponse.json({ success: false, error: "Invalid input needed." }, { status: 400 });
    }
    if (!REGIONAL_LANGUAGES.includes(regionalLanguage)) {
      logError(ROUTE, "Validation failed: invalid regional language", null, { empId, regionalLanguage });
      return NextResponse.json({ success: false, error: "Invalid regional language." }, { status: 400 });
    }
    if (!/^[0-9]{10}$/.test(doctorMobile)) {
      logError(ROUTE, "Validation failed: invalid doctor mobile", null, { empId, doctorUniqueId });
      return NextResponse.json({ success: false, error: "Invalid doctor's mobile number." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(doctorEmail)) {
      logError(ROUTE, "Validation failed: invalid doctor email", null, { empId, doctorUniqueId });
      return NextResponse.json({ success: false, error: "Invalid doctor's email address." }, { status: 400 });
    }
    if (!consent) {
      logError(ROUTE, "Validation failed: consent not given", null, { empId, doctorUniqueId });
      return NextResponse.json(
        { success: false, error: "Doctor's consent is required." },
        { status: 400 }
      );
    }
    if (voiceSeconds < MIN_VOICE_SECONDS) {
      logError(ROUTE, "Validation failed: voice recording too short", null, { empId, doctorUniqueId, voiceSeconds });
      return NextResponse.json(
        { success: false, error: `Voice recording must be at least ${MIN_VOICE_SECONDS} seconds.` },
        { status: 400 }
      );
    }

    const photoPath = gcsPathFromPublicUrl(photoUrl);
    const voicePath = gcsPathFromPublicUrl(voiceUrl);
    if (!photoPath?.startsWith("doctors/photos/") || !voicePath?.startsWith("doctors/voice/")) {
      logError(ROUTE, "Validation failed: photo/voice URL not from expected bucket path", null, { empId, doctorUniqueId, photoUrl, voiceUrl });
      return NextResponse.json({ success: false, error: "Invalid photo/voice upload reference." }, { status: 400 });
    }

    try {
      await Promise.all([makeGcsFilePublic(photoPath), makeGcsFilePublic(voicePath)]);
    } catch (err) {
      logError(ROUTE, "Failed to finalize GCS upload (makePublic)", err, { empId, doctorUniqueId, photoUrl, voiceUrl });
      return NextResponse.json(
        { success: false, error: "Failed to finalize photo/voice upload. Please try again." },
        { status: 502 }
      );
    }

    try {
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
        doctorQualification,
        doctorSpeciality,
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
    } catch (err) {
      logError(ROUTE, "MongoDB insert failed", err, { empId, doctorUniqueId, photoUrl, voiceUrl });
      return NextResponse.json(
        { success: false, error: "Submission failed. Please try again." },
        { status: 500 }
      );
    }

    logInfo(ROUTE, "Submission succeeded", { empId, doctorUniqueId });
    return NextResponse.json({ success: true, photoUrl, voiceUrl });
  } catch (err) {
    logError(ROUTE, "Unhandled submission error", err);
    return NextResponse.json(
      { success: false, error: "Submission failed. Please try again." },
      { status: 500 }
    );
  }
}
