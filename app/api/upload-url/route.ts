import { NextRequest, NextResponse } from "next/server";
import { getSignedUploadUrl } from "@/lib/gcs";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

const ROUTE = "POST /api/upload-url";

const ALLOWED_KINDS: Record<string, { folder: string; contentTypePrefix: string }> = {
  photo: { folder: "doctors/photos", contentTypePrefix: "image/" },
  voice: { folder: "doctors/voice", contentTypePrefix: "audio/" },
};

export async function POST(req: NextRequest) {
  try {
    const { kind, fileName, contentType } = await req.json();

    const spec = ALLOWED_KINDS[kind];
    if (!spec || typeof fileName !== "string" || typeof contentType !== "string" || !contentType.startsWith(spec.contentTypePrefix)) {
      logError(ROUTE, "Invalid upload-url request", null, { kind, fileName, contentType });
      return NextResponse.json({ success: false, error: "Invalid upload request." }, { status: 400 });
    }

    const { uploadUrl, publicUrl } = await getSignedUploadUrl(fileName, contentType, spec.folder);
    return NextResponse.json({ success: true, uploadUrl, publicUrl });
  } catch (err) {
    logError(ROUTE, "Failed to generate signed upload URL", err);
    return NextResponse.json({ success: false, error: "Failed to prepare upload. Please try again." }, { status: 500 });
  }
}
