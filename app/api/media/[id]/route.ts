import { NextResponse } from 'next/server';
import { getMedia } from '@/lib/media';

// Serves an uploaded image by id. Public on purpose — these are site logos and
// hero photos shown to every visitor. Cached hard: a media row is immutable
// (a new upload always inserts a new id), so it never needs revalidating.
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const media = await getMedia(numId).catch(() => null);
  if (!media) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      'Content-Type': media.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
