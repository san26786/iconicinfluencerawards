// Organiser-only: update app settings (singleton row id=1) — both the email
// send cadence AND the email provider/credentials. Only keys present in the
// body are updated, so the cadence form and the provider form can save
// independently without clobbering each other. Secret fields (API keys, SMTP
// password) are only overwritten when a non-empty value is supplied, so leaving
// them blank keeps the stored value.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { invalidateEmailConfig } from '@/lib/email/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  const add = (col: string, val: unknown) => {
    vals.push(val);
    sets.push(`${col} = $${vals.length}`);
  };
  const has = (k: string) => b[k] !== undefined;
  const secret = (k: string, col: string) => {
    if (typeof b[k] === 'string' && (b[k] as string).trim()) add(col, (b[k] as string).trim());
  };

  // ── Cadence ──
  if (has('batchSize')) add('email_batch_size', clampInt(b.batchSize, 1, 1000, 25));
  if (has('intervalSeconds')) add('email_interval_seconds', clampInt(b.intervalSeconds, 10, 86400, 120));
  if (has('smallThreshold')) add('email_small_threshold', clampInt(b.smallThreshold, 1, 1000, 10));
  if (has('smallGapSeconds')) add('email_small_gap_seconds', clampInt(b.smallGapSeconds, 1, 600, 6));

  // ── Daily send window (auto-pause) ──
  const hhmm = (v: unknown, fb: string) => {
    const s = typeof v === 'string' ? v.trim() : '';
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(s) ? s.padStart(5, '0') : fb;
  };
  if (has('sendWindowEnabled')) add('send_window_enabled', b.sendWindowEnabled === true);
  if (has('sendWindowStart')) add('send_window_start', hhmm(b.sendWindowStart, '09:00'));
  if (has('sendWindowEnd')) add('send_window_end', hhmm(b.sendWindowEnd, '18:30'));

  // ── Reminder flows ──
  if (has('remindersEnabled')) add('reminders_enabled', b.remindersEnabled === true);
  if (has('reminderDefaultDelayMinutes'))
    add('reminder_default_delay_minutes', clampInt(b.reminderDefaultDelayMinutes, 1, 43200, 240));

  // ── Provider config ──
  if (has('provider')) {
    const p = String(b.provider).toLowerCase();
    add('email_provider', ['resend', 'mailgun', 'smtp'].includes(p) ? p : '');
  }
  if (has('from')) add('email_from', String(b.from).trim());
  if (has('replyTo')) add('email_reply_to', String(b.replyTo).trim());
  if (has('mailgunDomain')) add('mailgun_domain', String(b.mailgunDomain).trim());
  if (has('mailgunRegion')) add('mailgun_region', String(b.mailgunRegion).toLowerCase() === 'eu' ? 'eu' : 'us');
  if (has('smtpHost')) add('smtp_host', String(b.smtpHost).trim());
  if (has('smtpPort')) add('smtp_port', clampInt(b.smtpPort, 1, 65535, 587));
  if (has('smtpUser')) add('smtp_user', String(b.smtpUser).trim());
  if (has('smtpSecure')) add('smtp_secure', b.smtpSecure === true);
  // SMTP sending pool (multi-mailbox). A blank password on an incoming account
  // means "keep the stored one", matched by username against current accounts —
  // so the UI never has to round-trip secrets to the browser.
  if (has('smtpAccounts') && Array.isArray(b.smtpAccounts)) {
    const prevRes = await query<{ smtp_accounts: unknown }>(
      'SELECT smtp_accounts FROM app_settings WHERE id = 1',
    );
    const prevRaw = prevRes.rows[0]?.smtp_accounts;
    const prevArr: Array<Record<string, unknown>> = Array.isArray(prevRaw)
      ? (prevRaw as Array<Record<string, unknown>>)
      : typeof prevRaw === 'string'
      ? (() => {
          try {
            const p = JSON.parse(prevRaw);
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];
    const prevPassByUser = new Map<string, string>();
    for (const p of prevArr) {
      const u = typeof p.user === 'string' ? p.user.trim().toLowerCase() : '';
      const pw = typeof p.pass === 'string' ? p.pass : '';
      if (u && pw) prevPassByUser.set(u, pw);
    }

    const cleaned: Array<{
      host: string;
      port: number;
      user: string;
      pass: string;
      secure: boolean;
      from: string;
    }> = [];
    for (const raw of b.smtpAccounts as unknown[]) {
      if (!raw || typeof raw !== 'object') continue;
      const a = raw as Record<string, unknown>;
      const host = typeof a.host === 'string' ? a.host.trim() : '';
      const user = typeof a.user === 'string' ? a.user.trim() : '';
      if (!host || !user) continue; // drop incomplete rows
      const port = clampInt(a.port, 1, 65535, 587);
      const incomingPass = typeof a.pass === 'string' ? a.pass.trim() : '';
      const pass = incomingPass || prevPassByUser.get(user.toLowerCase()) || '';
      cleaned.push({
        host,
        user,
        port,
        pass,
        secure: a.secure === true || port === 465,
        from: typeof a.from === 'string' ? a.from.trim() : '',
      });
    }
    add('smtp_accounts', JSON.stringify(cleaned));
  }
  // ── Tracking + webhooks ──
  if (has('trackOpens')) add('track_opens', b.trackOpens === true);
  if (has('trackClicks')) add('track_clicks', b.trackClicks === true);
  // Secrets — only when provided.
  secret('resendApiKey', 'resend_api_key');
  secret('mailgunApiKey', 'mailgun_api_key');
  secret('smtpPass', 'smtp_pass');
  secret('resendWebhookSecret', 'resend_webhook_secret');
  secret('mailgunWebhookSigningKey', 'mailgun_webhook_signing_key');

  if (sets.length === 0) return NextResponse.json({ ok: true });

  vals.push(1);
  await query(`UPDATE app_settings SET ${sets.join(', ')}, updated_at = now() WHERE id = $${vals.length}`, vals);
  invalidateEmailConfig();
  return NextResponse.json({ ok: true });
}
