import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { invalidateEmailConfig } from '@/lib/email/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN = 'copy-smtp-pba-2024';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { rows } = await query(`
      SELECT id, email_provider,
             smtp_host, smtp_port, smtp_user, smtp_secure, email_from,
             CASE WHEN smtp_pass <> '' THEN true ELSE false END AS has_password,
             resend_api_key <> '' AS has_resend_key,
             mailgun_api_key <> '' AS has_mailgun_key
      FROM app_settings WHERE id = 1
    `);
    return NextResponse.json(rows[0] ?? { error: 'No app_settings row found' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json() as {
      email_provider?: string;
      email_from?: string;
      smtp_host?: string;
      smtp_port?: number;
      smtp_user?: string;
      smtp_pass?: string;
      smtp_secure?: boolean;
    };

    const fields: Record<string, unknown> = {};
    if (body.email_provider !== undefined) fields.email_provider = body.email_provider;
    if (body.email_from     !== undefined) fields.email_from     = body.email_from;
    if (body.smtp_host      !== undefined) fields.smtp_host      = body.smtp_host;
    if (body.smtp_port      !== undefined) fields.smtp_port      = body.smtp_port;
    if (body.smtp_user      !== undefined) fields.smtp_user      = body.smtp_user;
    if (body.smtp_pass      !== undefined) fields.smtp_pass      = body.smtp_pass;
    if (body.smtp_secure    !== undefined) fields.smtp_secure    = body.smtp_secure;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const keys   = Object.keys(fields);
    const values = Object.values(fields);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(1);
    await query(
      `UPDATE app_settings SET ${setClauses} WHERE id = $${values.length}`,
      values,
    );
    invalidateEmailConfig();

    return NextResponse.json({ ok: true, updated: Object.keys(fields) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
