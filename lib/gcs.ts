import { Storage } from "@google-cloud/storage";

const bucketName = process.env.GCS_BUCKET || "typhighter-uploads";

function getStorage() {
  const raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) throw new Error("GOOGLE_CREDENTIALS is not set in .env.local");
  const credentials = JSON.parse(raw);
  return new Storage({ credentials });
}

export async function uploadToGCS(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = "doctors"
): Promise<string> {
  const storage = getStorage();
  const bucket  = storage.bucket(bucketName);

  // Unique filename: timestamp + sanitised original name
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const destName = `${folder}/${Date.now()}_${safeName}`;

  const file = bucket.file(destName);

  await file.save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  // Make the file publicly readable
  await file.makePublic();

  return `https://storage.googleapis.com/${bucketName}/${destName}`;
}
