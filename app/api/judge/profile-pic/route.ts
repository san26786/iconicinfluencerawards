import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or WEBP images are accepted.' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 3 MB.' }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Resize to max 400×400, convert to JPEG for consistent output
    const resized = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82 })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${resized.toString('base64')}`;
    return NextResponse.json({ url: dataUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image processing failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
