import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const mb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const VIDEO_TYPES = new Set([
  "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska",
]);

export async function POST(req: Request): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.has(file.type);
  const isDoc = DOC_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);

  if (!isImage && !isDoc && !isVideo) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  // Documents and videos: not supported without external storage
  if (isDoc || isVideo) {
    return NextResponse.json(
      { error: "Document and video upload is currently unavailable. Please email your supporting materials directly to us." },
      { status: 503 },
    );
  }

  // Images: convert to base64 data URL
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `Image too large. Maximum ${mb(MAX_IMAGE_BYTES)}.` },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const url = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ url, name: file.name, size: file.size, type: file.type });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
