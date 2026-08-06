// Resend webhook → delivered / bounced / complained events. Opens & clicks are
// tracked by us (so SMTP works too), so we ignore Resend's open/click events to
// avoid double counting.
//
// Verifies the Svix signature using the webhook signing secret (organiser
// settings → falls back to RESEND_WEBHOOK_SECRET). If no secret is configured
// yet, the request is accepted but logged, so setup isn't a chicken-and-egg.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { query } from '@/lib/db';
import { applyDeliveryEvent, type DeliveryEvent } from '@/lib/email/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function webhookSecret(): Promise<string> {
  try {
    const { rows } = await query<{ resend_webhook_secret: string }>(
      'SELECT resend_webhook_secret FROM app_settings WHERE id = 1',
    );
    if (rows[0]?.resend_webhook_secret) return rows[0].resend_webhook_secret;
  } catch {
    /* settings not migrated — fall back to env */
  }
  return process.env.RESEND_WEBHOOK_SECRET || '';
}

function verifySvix(secret: string, headers: Headers, body: string): boolean {
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sigHeader = headers.get('svix-signature');
  if (!id || !ts || !sigHeader) return false;

  const key = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let keyBytes: Buffer;
  try {
    keyBytes = Buffer.from(key, 'base64');
  } catch {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', keyBytes)
    .update(`${id}.${ts}.${body}`)
    .digest('base64');

  // Header is space-separated "v1,<sig> v1,<sig2>"; match any.
  return sigHeader.split(' ').some((part) => {
    const sig = part.includes(',') ? part.split(',')[1] : part;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

const MAP: Record<string, DeliveryEvent> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = await webhookSecret();
  if (secret) {
    if (!verifySvix(secret, req.headers, raw)) {
      return NextResponse.json({ error: 'bad signature' }, { status: 400 });
    }
  } else {
    console.warn('[webhooks/resend] no signing secret configured — accepting unverified');
  }

  let payload: { type?: string; data?: { email_id?: string; to?: string | string[] } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const type = payload.type && MAP[payload.type];
  if (type) {
    const to = Array.isArray(payload.data?.to) ? payload.data?.to[0] : payload.data?.to;
    try {
      await applyDeliveryEvent(type, { messageId: payload.data?.email_id, email: to });
    } catch (err) {
      console.error('[webhooks/resend] apply failed', err);
    }
  }
  return NextResponse.json({ ok: true });
}
