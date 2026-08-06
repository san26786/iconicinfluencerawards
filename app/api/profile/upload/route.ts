import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const mb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

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

  if (!isImage && !isDoc) {
    return NextResponse.json(
      { error: "Only images (PNG, JPG, WebP, GIF) and PDF/Word documents are allowed." },
      { status: 400 },
    );
  }

  const limit = isImage ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
  if (file.size > limit) {
    return NextResponse.json(
      { error: `That file is too large. Maximum ${mb(limit)}.` },
      { status: 400 },
    );
  }

  // Images → base64 data URL (no external storage needed)
  if (isImage) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ url: dataUrl, name: file.name, type: file.type, size: file.size });
  }

  // Documents — not supported without file storage
  return NextResponse.json(
    { error: "Document uploads are not available at this time. Please contact the organiser." },
    { status: 503 },
  );
}
