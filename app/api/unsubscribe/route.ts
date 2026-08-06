// Unsubscribe endpoint. GET shows a confirmation page; POST handles RFC 8058
// one-click unsubscribe (List-Unsubscribe-Post). Both add the address to the
// suppression list so no future campaign can email it.

import { query } from '@/lib/db';
import { getSite } from '@/lib/site';
import { verifySig } from '@/lib/email/tracking';
import { getBrandConfig } from '@/lib/email/brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function unsubscribe(token: string): Promise<string | null> {
  const { rows } = await query<{ id: number; job_id: number; email: string }>(
    'SELECT id, job_id, email FROM email_recipients WHERE token = $1',
    [token],
  );
  const r = rows[0];
  if (!r) return null;
  await query(
    `INSERT INTO email_suppressions (email, reason, job_id) VALUES ($1, 'unsubscribed', $2)
     ON CONFLICT (email) DO UPDATE SET deleted_at = NULL`,
    [r.email, r.job_id],
  );
  // Engagement event only — don't overwrite the delivery status.
  await query(`INSERT INTO email_events (recipient_id, job_id, type) VALUES ($1, $2, 'unsubscribed')`, [
    r.id,
    r.job_id,
  ]);
  return r.email;
}

function valid(req: Request): string | null {
  const url = new URL(req.url);
  const token = url.searchParams.get('e') || '';
  const sig = url.searchParams.get('s') || '';
  if (token && sig && verifySig(`unsub:${token}`, sig)) return token;
  return null;
}

export async function POST(req: Request) {
  const token = valid(req);
  if (token) {
    try {
      await unsubscribe(token);
    } catch (err) {
      console.error('[unsubscribe] POST failed', err);
    }
  }
  return new Response('OK', { status: 200 });
}

export async function GET(req: Request) {
  const token = valid(req);
  let email: string | null = null;
  if (token) {
    try {
      email = await unsubscribe(token);
    } catch (err) {
      console.error('[unsubscribe] GET failed', err);
    }
  }
  const brand = getBrandConfig(await getSite());
  const ok = !!email;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Unsubscribe · ${brand.name}</title></head>
<body style="margin:0;background:#07151c;font-family:Arial,Helvetica,sans-serif;color:#fff">
  <div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center">
    <div style="font-size:18px;font-weight:bold;letter-spacing:2px;color:#caa24a">${brand.name}</div>
    <div style="margin-top:32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px">
      <h1 style="margin:0 0 12px;font-size:22px">${ok ? 'You’ve been unsubscribed' : 'Link not recognised'}</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7)">
        ${
          ok
            ? `We won’t send any more marketing emails to <strong style="color:#fff">${email}</strong>.`
            : 'This unsubscribe link is invalid or has expired. If you keep receiving emails, contact us and we’ll remove you.'
        }
      </p>
    </div>
  </div>
</body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
