import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_TYPES = ['Business Leader', 'People in Business', 'New Recruits'];

async function ensureTable(siteId: number) {
  // Schema is global — create once per process.
  await ensureOnce('leadership_types', () =>
    query(`
      CREATE TABLE IF NOT EXISTS leadership_types (
        id         SERIAL PRIMARY KEY,
        site_id    INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        name       TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(() => {}),
  );

  // Seed defaults if empty — keyed per site so each tenant is checked once
  // per process (not on every request).
  await ensureOnce(`leadership_types-seed-${siteId}`, async () => {
    const { rows } = await query(
      `SELECT id FROM leadership_types WHERE site_id = $1 LIMIT 1`, [siteId],
    );
    if (rows.length === 0) {
      for (let i = 0; i < DEFAULT_TYPES.length; i++) {
        await query(
          `INSERT INTO leadership_types (site_id, name, display_order) VALUES ($1, $2, $3)`,
          [siteId, DEFAULT_TYPES[i], i],
        );
      }
    }
  });
}

export async function GET() {
  const siteId = await getSiteId();
  await ensureTable(siteId);
  const { rows } = await query<{ id: number; name: string }>(
    `SELECT id, name FROM leadership_types WHERE site_id = $1 ORDER BY display_order, name`,
    [siteId],
  );
  return NextResponse.json({ types: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const siteId = await getSiteId();
  await ensureTable(siteId);
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { rows } = await query<{ id: number; name: string }>(
    `INSERT INTO leadership_types (site_id, name) VALUES ($1, $2) RETURNING id, name`,
    [siteId, name.trim()],
  );
  return NextResponse.json({ type: rows[0] });
}
