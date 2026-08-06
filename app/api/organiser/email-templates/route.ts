import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureEmailTemplatesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id            serial PRIMARY KEY,
      name          varchar(200) NOT NULL,
      subject       varchar(500) NOT NULL DEFAULT '',
      html          text NOT NULL DEFAULT '',
      description   text,
      design        jsonb,
      is_system     boolean NOT NULL DEFAULT false,
      deleted_at    timestamptz,
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  await ensureEmailTemplatesTable();
  const { rows } = await query(
    `SELECT id, name, subject, description FROM email_templates
     WHERE deleted_at IS NULL ORDER BY name`,
  );
  return NextResponse.json({ templates: rows });
}

export async function POST(req: Request) {
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
  const name = String(b.name ?? '').trim() || 'Untitled template';
  const design = Array.isArray(b.design) ? JSON.stringify(b.design) : null;
  const { rows } = await query<{ id: number }>(
    `INSERT INTO email_templates (name, subject, html, description, design, is_system)
     VALUES ($1, $2, $3, $4, $5::jsonb, false) RETURNING id`,
    [name, String(b.subject ?? ''), String(b.html ?? ''), String(b.description ?? '') || null, design],
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}
