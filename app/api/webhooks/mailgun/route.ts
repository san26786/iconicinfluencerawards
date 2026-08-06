// Mailgun webhook → delivered / bounced (permanent failure) / complained /
// unsubscribed. Opens & clicks are tracked by us, so Mailgun's open/click
// events are ignored to avoid double counting.
//
// Verifies Mailgun's HMAC signature using the webhook signing key (organiser
// settings → falls back to MAILGUN_WEBHOOK_SIGNING_KEY). No key configured →
// accepted but logged.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { query } from '@/lib/db';
import { applyDeliveryEvent, type DeliveryEvent } from '@/lib/email/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function signingKey(): Promise<string> {
  try {
    const { rows } = await query<{ mailgun_webhook_signing_key: string }>(
      'SELECT mailgun_webhook_signing_key FROM app_settings WHERE id = 1',
    );
    if (rows[0]?.mailgun_webhook_signing_key) return rows[0].mailgun_webhook_signing_key;
  } catch {
    /* fall back to env */
  }
  return process.env.MAILGUN_WEBHOOK_SIGNING_KEY || '';
}

function verify(key: string, timestamp: string, token: string, signature: string): boolean {
  const expected = crypto.createHmac('sha256', key).update(timestamp + token).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type MgEvent = {
  signature?: { timestamp?: string; token?: string; signature?: string };
  'event-data'?: {
    event?: string;
    severity?: string;
    recipient?: string;
    message?: { headers?: { 'message-id'?: string } };
  };
};

export async function POST(req: Request) {
  let body: MgEvent;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const key = await signingKey();
  const sig = body.signature;
  if (key) {
    if (!sig?.timestamp || !sig.token || !sig.signature || !verify(key, sig.timestamp, sig.token, sig.signature)) {
      return NextResponse.json({ error: 'bad signature' }, { status: 400 });
    }
  } else {
    console.warn('[webhooks/mailgun] no signing key configured — accepting unverified');
  }

  const d = body['event-data'];
  const event = d?.event;
  let type: DeliveryEvent | null = null;
  if (event === 'delivered') type = 'delivered';
  else if (event === 'failed' && d?.severity === 'permanent') type = 'bounced';
  else if (event === 'complained') type = 'complained';
  else if (event === 'unsubscribed') type = 'unsubscribed';

  if (type) {
    try {
      await applyDeliveryEvent(type, {
        messageId: d?.message?.headers?.['message-id'],
        email: d?.recipient,
      });
    } catch (err) {
      console.error('[webhooks/mailgun] apply failed', err);
    }
  }
  return NextResponse.json({ ok: true });
}
