import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';
import { seedProductsServices } from '@/lib/seedProductsServices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureTable() {
  return ensureOnce('products_services', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS products_services (
        id          SERIAL PRIMARY KEY,
        site_id     INTEGER NOT NULL,
        event_id    INTEGER NOT NULL,
        category    TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        name        TEXT NOT NULL,
        price       NUMERIC(10,2),
        currency    TEXT DEFAULT 'GBP',
        status      TEXT NOT NULL DEFAULT 'inactive',
        notes       TEXT,
        created_at  TIMESTAMPTZ DEFAULT now()
      )
    `);
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS products_services_uq
      ON products_services (site_id, event_id, category, subcategory, name)
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

  if (eventId) {
    await seedProductsServices(siteId, Number(eventId)).catch(() => {});
  }

  const { rows } = await query(
    `SELECT * FROM products_services WHERE site_id = $1 ${eventId ? 'AND event_id = $2' : ''} ORDER BY category, subcategory, name`,
    eventId ? [siteId, Number(eventId)] : [siteId],
  );

  return NextResponse.json({ products: rows });
}
