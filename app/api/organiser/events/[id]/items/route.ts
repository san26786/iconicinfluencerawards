import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureTable() {
  return ensureOnce('event_items', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS event_items (
        id            SERIAL PRIMARY KEY,
        site_id       INTEGER NOT NULL,
        event_id      INTEGER NOT NULL,
        type          TEXT NOT NULL,
        data          JSONB NOT NULL DEFAULT '{}',
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT now(),
        updated_at    TIMESTAMPTZ DEFAULT now()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS event_items_lookup ON event_items (site_id, event_id, type)`);
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const agendaId = url.searchParams.get('agenda_id');

  await ensureTable();

  let sql = `SELECT * FROM event_items WHERE event_id = $1`;
  const args: unknown[] = [Number(id)];
  if (type) { args.push(type); sql += ` AND type = $${args.length}`; }
  if (agendaId) { args.push(agendaId); sql += ` AND data->>'agenda_id' = $${args.length}`; }
  sql += ` ORDER BY display_order, created_at`;

  const { rows } = await query(sql, args);

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { type: string; data: Record<string, unknown>; display_order?: number; site_id: number };

  if (!body.type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

  await ensureTable();

  const { rows } = await query(
    `INSERT INTO event_items (site_id, event_id, type, data, display_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [body.site_id, Number(id), body.type, JSON.stringify(body.data ?? {}), body.display_order ?? 0],
  );

  return NextResponse.json({ item: rows[0] }, { status: 201 });
}
