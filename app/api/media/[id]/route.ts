import { NextResponse } from 'next/server';
import { getMedia } from '@/lib/media';

// Serves an uploaded image by id. Public on purpose — these are site logos and
// hero photos shown to every visitor. Cached hard: a media row is immutable
// (a new upload always inserts a new id), so it never needs revalidating.
export const runtime = 'nodejs';

export async function GET(
  req: Request,
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

  // ?format=png, for email.
  //
  // Logos are uploaded and stored as WebP, which every browser reads and which
  // is why the site is fast. Mail is the other world: Outlook on Windows
  // renders through Word and shows a broken image, and so do Yahoo and a good
  // share of corporate clients. A brand's own logo appearing broken is the
  // first thing a reader sees, so an email asks for this instead.
  //
  // Only ever widens what is served: an id that is already a PNG, or any
  // request without the parameter, is returned untouched as before. A
  // conversion that fails falls back to the original rather than 500ing, since
  // a WebP that some clients can read beats no image at all.
  // ?w=<px> narrows it on the way out. A logo stored at 900px wide is right
  // for a retina hero and wrong for a 54px line in an email, where it is a
  // quarter of a megabyte spent on something nobody can see the detail of.
  let body = media.data;
  let mime = media.mime;
  const q = new URL(req.url).searchParams;
  const wantsPng = q.get('format') === 'png';
  const askedWidth = Number(q.get('w'));
  const width =
    Number.isInteger(askedWidth) && askedWidth >= 16 && askedWidth <= 2000
      ? askedWidth
      : null;

  // ?bg=rrggbb flattens the transparency onto that colour.
  //
  // A logo's transparent pixels are stored as black with alpha zero, so any
  // client that drops the alpha channel paints them black. Gmail does, or its
  // image proxy does: the Cardiff campaign arrived with the logo in a black
  // rectangle on a dark red banner. Flattening here means no client has to
  // support transparency at all. Give it the colour the logo will sit on and
  // the seam disappears.
  const bgHex = /^#?[0-9a-f]{6}$/i.test(q.get('bg') ?? '')
    ? `#${(q.get('bg') as string).replace(/^#/, '')}`
    : null;

  if (wantsPng || width || bgHex) {
    try {
      const sharp = (await import('sharp')).default;
      let pipeline = sharp(media.data);
      // withoutEnlargement: asking for 360 from a 200px original must not
      // blow it up into a blurry 360.
      if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
      if (bgHex) pipeline = pipeline.flatten({ background: bgHex });
      if (wantsPng) {
        pipeline = pipeline.png({ compressionLevel: 9 });
        mime = 'image/png';
      }
      body = await pipeline.toBuffer();
    } catch (err) {
      // Serve the original rather than 500: a WebP some clients can read beats
      // no image at all, and the website's own copy must never go down over an
      // email's request for a different shape.
      console.error('[media] transform failed, serving the original', numId, err);
      body = media.data;
      mime = media.mime;
    }
  }

  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
