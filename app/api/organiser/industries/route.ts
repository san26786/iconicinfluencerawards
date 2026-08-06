import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireOrganiser() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return null;
  return user;
}

function ensureTable() {
  return ensureOnce('industries', () =>
    query(`
      CREATE TABLE IF NOT EXISTS industries (
        id          SERIAL PRIMARY KEY,
        site_id     INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        code        TEXT,
        description TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(() => {}),
  );
}

export async function GET() {
  const user = await requireOrganiser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  await ensureTable();
  const siteId = await getSiteId();

  const { rows } = await query<{ id: number; name: string; code: string | null; description: string | null; created_at: string }>(
    `SELECT id, name, code, description, created_at FROM industries WHERE site_id = $1 ORDER BY name`,
    [siteId],
  );
  return NextResponse.json({ industries: rows });
}

export async function POST(req: Request) {
  const user = await requireOrganiser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  await ensureTable();
  const siteId = await getSiteId();
  const { name, code, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { rows } = await query<{ id: number; name: string; code: string | null; description: string | null }>(
    `INSERT INTO industries (site_id, name, code, description) VALUES ($1, $2, $3, $4) RETURNING id, name, code, description`,
    [siteId, name.trim(), code?.trim() || null, description?.trim() || null],
  );
  return NextResponse.json({ industry: rows[0] });
}
