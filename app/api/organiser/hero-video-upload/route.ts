import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

// Hero videos are uploaded CLIENT-SIDE, straight from the browser to Vercel
// Blob — the file never passes through this function. That matters because a
// Vercel serverless function caps its request body at ~4.5MB, so routing a
// multi-MB video through the server silently fails. This route only issues a
// short-lived signed token for the browser to upload with, and receives the
// completion callback.
export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Surface the most common misconfiguration as a readable message rather than
  // letting the SDK fail with an opaque error the browser can't parse.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          'Video storage is not configured yet: BLOB_READ_WRITE_TOKEN is missing. ' +
          'Connect the Blob store to this project in the Vercel dashboard (Storage → ' +
          'londonbusinessawards-blob → Connect Project), then redeploy. ' +
          'In the meantime you can paste a hosted video URL into the field instead of uploading.',
      },
      { status: 500 },
    );
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // Authorise here — this runs before any token is handed out.
        const user = await getSessionUser();
        if (!user || user.role !== 'organiser') {
          throw new Error('Unauthorized');
        }
        const siteId = await getSiteId();
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          pathname: `hero-video/site-${siteId}`,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to persist here — the browser puts the returned URL into the
        // settings form, which saves it with the rest of the site settings.
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[hero-video-upload]', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
