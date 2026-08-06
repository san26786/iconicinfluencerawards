import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLUMNS = [
  `ALTER TABLE themes ADD COLUMN IF NOT EXISTS logo_url text`,
  `ALTER TABLE themes ADD COLUMN IF NOT EXISTS href text`,
  `ALTER TABLE themes ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false`,
  `ALTER TABLE themes ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0`,
  `ALTER TABLE themes ADD COLUMN IF NOT EXISTS linked_site_id integer`,
  `ALTER TABLE themes ADD COLUMN IF NOT EXISTS linked_site_ids integer[]`,
  `ALTER TABLE themes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`,
];

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of COLUMNS) {
    try {
      await query(sql);
      results.push({ sql, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ sql, ok: false, error: message });
    }
  }

  const allOk = results.every(r => r.ok);
  return NextResponse.json({ allOk, results }, { status: allOk ? 200 : 500 });
}
