import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

// Ensure the table exists on first hit — no migration file needed.
const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS pre_launch_registrations (
    id          SERIAL PRIMARY KEY,
    site_id     INTEGER REFERENCES sites(id) ON DELETE SET NULL,
    phone       VARCHAR(50),
    email       VARCHAR(255) NOT NULL,
    organisation VARCHAR(255),
    message     TEXT,
    consented   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS pre_launch_site_idx
    ON pre_launch_registrations (site_id, created_at DESC);
`;

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await query(INIT_SQL, []);
  tableReady = true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, email, organisation, message, consented } = body as Record<string, string | boolean>;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!consented) {
      return NextResponse.json({ error: 'Please confirm your consent.' }, { status: 400 });
    }

    await ensureTable();
    const siteId = await getSiteId();

    const { rows } = await query<{ id: number }>(
      `INSERT INTO pre_launch_registrations
         (site_id, phone, email, organisation, message, consented)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [siteId, phone ?? null, email.trim().toLowerCase(), organisation ?? null, message ?? null, Boolean(consented)]
    );

    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('[pre-launch]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
