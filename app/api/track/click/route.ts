// Click-tracking redirect. Verifies the HMAC signature (so we can't be abused
// as an open redirector), records the click, then 302s to the real target.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifySig } from '@/lib/email/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('e') || '';
  const target = url.searchParams.get('u') || '';
  const sig = url.searchParams.get('s') || '';

  const valid =
    !!token &&
    !!target &&
    !!sig &&
    /^https?:\/\//i.test(target) &&
    verifySig(`${token}:${target}`, sig);

  if (!valid) {
    // Tampered or malformed — refuse to redirect anywhere off-site.
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const { rows } = await query<{ id: number; job_id: number }>(
      `UPDATE email_recipients
          SET click_count = click_count + 1,
              clicked_at = COALESCE(clicked_at, now()),
              opened_at = COALESCE(opened_at, now()),
              updated_at = now()
        WHERE token = $1
        RETURNING id, job_id`,
      [token],
    );
    const r = rows[0];
    if (r) {
      await query(`INSERT INTO email_events (recipient_id, job_id, type, url) VALUES ($1, $2, 'clicked', $3)`, [
        r.id,
        r.job_id,
        target,
      ]);
    }
  } catch (err) {
    console.error('[track/click] failed', err);
  }

  return NextResponse.redirect(target);
}
