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
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const siteId = await getSiteId();
  if (!await verifyEventOwner(Number(id), siteId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows } = await query(
    `SELECT ec.*, t.name AS theme_name, t.icon AS theme_icon
       FROM event_categories ec
       LEFT JOIN themes t ON t.id = ec.theme_id
      WHERE ec.event_id = $1
      ORDER BY ec.display_order, ec.name`,
    [Number(id)],
  );
  return NextResponse.json({ categories: rows });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
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
    `INSERT INTO event_categories
       (event_id, theme_id, name, tagline, short_name, short_summary, description,
        eligibility, judging_criteria, qualitative_criteria, metrics,
        additional_criteria, icon, entry_fee, display_order, is_active, promo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      Number(id),
      body.theme_id ?? null,
      body.name.trim(),
      body.tagline?.trim()             || null,
      body.short_name?.trim()          || null,
      body.short_summary?.trim()       || null,
      body.description?.trim()         || null,
      body.eligibility?.trim()         || null,
      body.judging_criteria?.trim()    || null,
      body.qualitative_criteria?.trim()|| null,
      body.metrics?.trim()             || null,
      body.additional_criteria?.trim() || null,
      body.icon?.trim()                || null,
      body.entry_fee ?? 0,
      body.display_order ?? 0,
      body.is_active ?? true,
      body.promo ?? false,
    ],
  );
  return NextResponse.json({ category: rows[0] }, { status: 201 });
}
