import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';
import { storeMedia } from '@/lib/media';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, WEBP or SVG allowed.' }, { status: 400 });
  }

  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 4 MB.' }, { status: 400 });
  }

  try {
    // Stored as bytes and served from /api/media/<id> — see lib/media for why
    // this is deliberately not a base64 data: URL.
    const siteId = await getSiteId().catch(() => null);
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await storeMedia(siteId, file.type, bytes);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[logo-upload]', message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
