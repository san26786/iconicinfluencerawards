// Organiser-only: send a one-off test email using the currently-saved provider
// config, so the organiser can verify Resend / Mailgun / SMTP works before
// running a real campaign.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getEmailConfig } from '@/lib/email/config';
import { sendMail } from '@/lib/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  let b: { to?: unknown; siteId?: unknown };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const to = String(b.to ?? '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: 'Enter a valid email address to test.' }, { status: 400 });
  }
  // Optional: test THIS site's own mailbox (per-site Email Setup) rather than
  // the platform default (global admin Email Setup, which omits siteId).
  const siteId = Number.isInteger(Number(b.siteId)) ? Number(b.siteId) : undefined;

  const cfg = await getEmailConfig(siteId);
  const result = await sendMail({
    to,
    subject: `Test email from ${process.env.NODE_ENV === 'production' ? 'your awards site' : 'your awards site (dev)'}`,
    html: `<p>This is a test email confirming your <strong>${cfg.provider}</strong> email configuration works.</p>`,
    text: 'This is a test email confirming your email configuration works.',
    siteId,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, provider: result.provider, message: `Test email sent to ${to} via ${result.provider}.` });
  }
  return NextResponse.json(
    { ok: false, provider: result.provider, error: `Send failed (${result.reason}): ${result.error}` },
    { status: 502 },
  );
}
