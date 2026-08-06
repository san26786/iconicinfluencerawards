import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureTables() {
  return ensureOnce('question-library-links', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS question_library (
        id SERIAL PRIMARY KEY,
        author_site_id INTEGER,
        question_text TEXT NOT NULL,
        question_type VARCHAR(30) NOT NULL DEFAULT 'eligibility',
        field_type VARCHAR(20) NOT NULL DEFAULT 'text',
        options JSONB,
        source_category VARCHAR(255),
        is_required BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await query(`ALTER TABLE question_library ADD COLUMN IF NOT EXISTS source_category VARCHAR(255)`);
    await query(`
      CREATE TABLE IF NOT EXISTS category_question_links (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL,
        event_category_id INTEGER NOT NULL,
        question_library_id INTEGER NOT NULL REFERENCES question_library(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_required BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(site_id, event_category_id, question_library_id)
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS site_eligibility_links (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL,
        question_library_id INTEGER NOT NULL REFERENCES question_library(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_required BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(site_id, question_library_id)
      )
    `);
  });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTables();
  const { rows } = await query(
    `SELECT * FROM question_library ORDER BY question_type, display_order, id`,
  );
  return NextResponse.json({ questions: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTables();

  const siteId = await getSiteId();
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const question_text = String(body.question_text ?? '').trim();
  if (!question_text) return NextResponse.json({ error: 'question_text is required' }, { status: 400 });

  const question_type = String(body.question_type ?? 'eligibility');
  const field_type = String(body.field_type ?? 'text');
  const options = Array.isArray(body.options) ? body.options : null;
  const is_required = body.is_required !== false;
  const display_order = Number(body.display_order) || 0;

  const { rows } = await query(
    `INSERT INTO question_library (author_site_id, question_text, question_type, field_type, options, is_required, display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [siteId, question_text, question_type, field_type, options ? JSON.stringify(options) : null, is_required, display_order],
  );
  return NextResponse.json({ question: rows[0] }, { status: 201 });
}
