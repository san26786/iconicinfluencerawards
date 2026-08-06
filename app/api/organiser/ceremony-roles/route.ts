import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';
import { seedCeremonyRoles } from '@/lib/seedCeremonyRoles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureTable() {
  return ensureOnce('ceremony_roles', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS ceremony_roles (
        id                 SERIAL PRIMARY KEY,
        site_id            INTEGER NOT NULL,
        event_id           INTEGER NOT NULL,
        category           TEXT NOT NULL,
        role               TEXT NOT NULL,
        description        TEXT,
        additional_details TEXT,
        person_name        TEXT,
        company            TEXT,
        email              TEXT,
        phone              TEXT,
        notes              TEXT,
        status             TEXT NOT NULL DEFAULT 'vacant',
        created_at         TIMESTAMPTZ DEFAULT now()
      )
    `);
    await query(`ALTER TABLE ceremony_roles ADD COLUMN IF NOT EXISTS description text`);
    await query(`ALTER TABLE ceremony_roles ADD COLUMN IF NOT EXISTS additional_details text`);
    // Unique index to support idempotent upsert seeding
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ceremony_roles_uq
      ON ceremony_roles (site_id, event_id, category, role)
    `);
  });
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('event_id');
  const siteId = await getSiteId();

  await ensureTable();

  // Auto-seed if this event has no roles yet
  if (eventId) {
    await seedCeremonyRoles(siteId, Number(eventId)).catch(() => {});
  }

  const { rows } = await query(
    `SELECT * FROM ceremony_roles WHERE site_id = $1 ${eventId ? 'AND event_id = $2' : ''} ORDER BY category, role`,
    eventId ? [siteId, Number(eventId)] : [siteId],
  );
  return NextResponse.json({ roles: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const body = await req.json() as {
    event_id: number;
    category: string;
    role: string;
    person_name?: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
    status?: string;
  };

  if (!body.event_id || !body.category || !body.role) {
    return NextResponse.json({ error: 'event_id, category and role are required' }, { status: 400 });
  }

  await ensureTable();

  const { rows } = await query(
    `INSERT INTO ceremony_roles (site_id, event_id, category, role, person_name, company, email, phone, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      siteId, body.event_id, body.category, body.role,
      body.person_name?.trim() || null,
      body.company?.trim()     || null,
      body.email?.trim()       || null,
      body.phone?.trim()       || null,
      body.notes?.trim()       || null,
      body.status              || 'vacant',
    ],
  );
  return NextResponse.json({ role: rows[0] }, { status: 201 });
}
