import { Storage } from "@google-cloud/storage";

const bucketName = process.env.GCS_BUCKET || "typhighter-uploads";

function getStorage() {
  const raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) throw new Error("GOOGLE_CREDENTIALS is not set in .env.local");
  const credentials = JSON.parse(raw);
  return new Storage({ credentials });
}

const SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000;

export function gcsPublicUrl(destName: string): string {
  return `https://storage.googleapis.com/${bucketName}/${destName}`;
}

export function gcsPathFromPublicUrl(url: string): string | null {
  const prefix = `https://storage.googleapis.com/${bucketName}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

/**
 * Returns a short-lived signed PUT URL so the browser can upload directly to
 * GCS, bypassing the Vercel serverless function's 4.5MB body limit and
 * function-duration timeout for large photo/voice files on slow networks.
 */
export async function getSignedUploadUrl(
  originalName: string,
  contentType: string,
  folder: string
): Promise<{ uploadUrl: string; publicUrl: string; destName: string }> {
  const storage = getStorage();
  const bucket = storage.bucket(bucketName);

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const destName = `${folder}/${Date.now()}_${safeName}`;
  const file = bucket.file(destName);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + SIGNED_URL_EXPIRY_MS,
    contentType,
  });

  return { uploadUrl, publicUrl: gcsPublicUrl(destName), destName };
}

export async function makeGcsFilePublic(destName: string): Promise<void> {
  const storage = getStorage();
  await storage.bucket(bucketName).file(destName).makePublic();
}
