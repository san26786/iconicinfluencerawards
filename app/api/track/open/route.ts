// Open-tracking pixel. Returns a 1×1 GIF for every request (so it never reveals
// whether a token is valid) and records an open for the matching recipient.
// Works for any provider, including SMTP.

import { query } from '@/lib/db';
import { TRACKING_GIF } from '@/lib/email/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('e');
  if (token) {
    try {
      const { rows } = await query<{ id: number; job_id: number }>(
        `UPDATE email_recipients
            SET open_count = open_count + 1, opened_at = COALESCE(opened_at, now()), updated_at = now()
          WHERE token = $1
          RETURNING id, job_id`,
        [token],
      );
      const r = rows[0];
      if (r) {
        await query(`INSERT INTO email_events (recipient_id, job_id, type) VALUES ($1, $2, 'opened')`, [
          r.id,
          r.job_id,
        ]);
      }
    } catch (err) {
      console.error('[track/open] failed', err);
    }
  }

  return new Response(TRACKING_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRACKING_GIF.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
