// Organiser-only: read/write THIS site's own SMTP mailbox
// (site_email_settings, keyed by site_id — see lib/email/config.ts).
//
// This is distinct from /api/admin/copy-smtp, which edits the GLOBAL
// platform-default mailbox (app_settings, singleton) used as a fallback for
// any site that hasn't configured its own. Every organiser can set up their
// own site's mailbox here, scoped to the site they're signed into.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';
import { query } from '@/lib/db';
import { getSiteEmailRow } from '@/lib/email/config';
import { ensureOnce } from '@/lib/ensureOnce';
import { invalidateEmailConfig } from '@/lib/email/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureTable() {
  await ensureOnce('site_email_settings', () =>
    query(`
      CREATE TABLE IF NOT EXISTS site_email_settings (
        id             SERIAL PRIMARY KEY,
        site_id        INTEGER NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
        smtp_host      TEXT,
        smtp_port      INTEGER NOT NULL DEFAULT 587,
        smtp_user      TEXT,
        smtp_pass      TEXT,
        smtp_secure    BOOLEAN NOT NULL DEFAULT false,
        email_from     TEXT,
        email_reply_to TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(() => {}),
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  await ensureTable();
  const siteId = await getSiteId();
  const row = await getSiteEmailRow(siteId);
  return NextResponse.json({
    smtp_host: row?.smtp_host ?? '',
    smtp_port: row?.smtp_port ?? 465,
    smtp_user: row?.smtp_user ?? '',
    smtp_secure: row?.smtp_secure ?? true,
    email_from: row?.email_from ?? '',
    email_reply_to: row?.email_reply_to ?? '',
    has_password: !!row?.smtp_pass,
    configured: !!(row?.smtp_host && row?.smtp_user),
  });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  await ensureTable();
  const siteId = await getSiteId();

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const smtpHost = typeof b.smtp_host === 'string' ? b.smtp_host.trim() : undefined;
  const smtpPort = Number.isFinite(Number(b.smtp_port)) ? Math.min(65535, Math.max(1, Math.round(Number(b.smtp_port)))) : undefined;
  const smtpUser = typeof b.smtp_user === 'string' ? b.smtp_user.trim() : undefined;
  const smtpPass = typeof b.smtp_pass === 'string' ? b.smtp_pass.trim() : '';
  const smtpSecure = typeof b.smtp_secure === 'boolean' ? b.smtp_secure : undefined;
  const emailFrom = typeof b.email_from === 'string' ? b.email_from.trim() : undefined;
  const emailReplyTo = typeof b.email_reply_to === 'string' ? b.email_reply_to.trim() : undefined;

  // Upsert. A blank password means "keep the stored one" — never overwrite
  // a real secret with an empty string just because the UI round-tripped it blank.
  await query(
    `INSERT INTO site_email_settings (site_id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, email_from, email_reply_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (site_id) DO UPDATE SET
       smtp_host      = EXCLUDED.smtp_host,
       smtp_port      = EXCLUDED.smtp_port,
       smtp_user      = EXCLUDED.smtp_user,
       smtp_pass      = CASE WHEN EXCLUDED.smtp_pass <> '' THEN EXCLUDED.smtp_pass ELSE site_email_settings.smtp_pass END,
       smtp_secure    = EXCLUDED.smtp_secure,
       email_from     = EXCLUDED.email_from,
       email_reply_to = EXCLUDED.email_reply_to,
       updated_at     = now()`,
    [
      siteId,
      smtpHost ?? '',
      smtpPort ?? 587,
      smtpUser ?? '',
      smtpPass,
      smtpSecure ?? (smtpPort === 465),
      emailFrom ?? '',
      emailReplyTo ?? '',
    ],
  );

  invalidateEmailConfig(siteId);
  return NextResponse.json({ ok: true });
}
