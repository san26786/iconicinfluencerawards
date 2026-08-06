import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function verifyEventOwner(eventId: number, siteId: number) {
  const { rows } = await query(
    `SELECT id FROM events WHERE id = $1 AND site_id = $2`,
    [eventId, siteId],
  );
  return rows[0] ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; catId: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, catId } = await params;
  const siteId = await getSiteId();
  if (!await verifyEventOwner(Number(id), siteId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows } = await query(
    `SELECT ec.*, t.name AS theme_name, t.icon AS theme_icon
       FROM event_categories ec
       LEFT JOIN themes t ON t.id = ec.theme_id
      WHERE ec.id = $1 AND ec.event_id = $2`,
    [Number(catId), Number(id)],
  );
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ category: rows[0] });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; catId: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, catId } = await params;
  const siteId = await getSiteId();
  if (!await verifyEventOwner(Number(id), siteId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as {
    name?: string;
    tagline?: string;
    short_name?: string;
    theme_id?: number | null;
    short_summary?: string;
    description?: string;
    eligibility?: string;
    judging_criteria?: string;
    qualitative_criteria?: string;
    metrics?: string;
    additional_criteria?: string;
    icon?: string;
    entry_fee?: number;
    display_order?: number;
    is_active?: boolean;
    promo?: boolean;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

  const { rows } = await query(
    `UPDATE event_categories SET
       name                 = $1,
       tagline              = $2,
       short_name           = $3,
       theme_id             = CASE WHEN $4::boolean THEN NULL ELSE $5::int END,
       short_summary        = $6,
       description          = $7,
       eligibility          = $8,
       judging_criteria     = $9,
       qualitative_criteria = $10,
       metrics              = $11,
       additional_criteria  = $12,
       icon                 = $13,
       entry_fee            = $14,
       display_order        = $15,
       is_active            = $16,
       promo                = $17
     WHERE id = $18 AND event_id = $19
     RETURNING *`,
    [
      body.name.trim(),
      body.tagline?.trim()              || null,
      body.short_name?.trim()           || null,
      body.theme_id == null,
      body.theme_id ?? null,
      body.short_summary?.trim()        || null,
      body.description?.trim()          || null,
      body.eligibility?.trim()          || null,
      body.judging_criteria?.trim()     || null,
      body.qualitative_criteria?.trim() || null,
      body.metrics?.trim()              || null,
      body.additional_criteria?.trim()  || null,
      body.icon?.trim()                 || null,
      body.entry_fee ?? 0,
      body.display_order ?? 0,
      body.is_active ?? true,
      body.promo ?? false,
      Number(catId),
      Number(id),
    ],
  );

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ category: rows[0] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; catId: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, catId } = await params;
  const siteId = await getSiteId();
  if (!await verifyEventOwner(Number(id), siteId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rowCount } = await query(
    `DELETE FROM event_categories WHERE id = $1 AND event_id = $2`,
    [Number(catId), Number(id)],
  );

  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
