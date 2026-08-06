import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BulkCategory = {
  name: string;
  tagline?: string;
  short_name?: string;
  icon?: string;
  theme_name?: string;
  theme_id?: number | null;
  short_summary?: string;
  description?: string;
  eligibility?: string;
  judging_criteria?: string;
  qualitative_criteria?: string;
  metrics?: string;
  additional_criteria?: string;
  display_order?: number;
  is_active?: boolean;
  promo?: boolean;
  entry_fee?: number;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const eventId = Number(id);
  const siteId = await getSiteId();

  // Verify this event belongs to the site
  const { rows: evRows } = await query<{ id: number }>(
    `SELECT id FROM events WHERE id = $1 AND site_id = $2`,
    [eventId, siteId],
  );
  if (!evRows[0]) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const body = await req.json() as { categories: BulkCategory[] };
  if (!Array.isArray(body.categories) || body.categories.length === 0) {
    return NextResponse.json({ error: 'categories array is required' }, { status: 400 });
  }

  // Build theme name → id lookup for this site
  const { rows: themeRows } = await query<{ id: number; name: string }>(
    `SELECT id, name FROM themes WHERE site_id = $1`,
    [siteId],
  );
  const themeMap = new Map(themeRows.map(t => [t.name.toLowerCase().trim(), t.id]));

  // Fetch existing names to skip duplicates
  const { rows: existingRows } = await query<{ name: string }>(
    `SELECT name FROM event_categories WHERE event_id = $1`,
    [eventId],
  );
  const existingNames = new Set(existingRows.map(r => r.name.toLowerCase().trim()));

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < body.categories.length; i++) {
    const cat = body.categories[i];
    if (!cat.name?.trim()) { errors.push(`Row ${i + 1}: name is required`); continue; }
    if (existingNames.has(cat.name.toLowerCase().trim())) { skipped++; continue; }

    // Resolve theme: explicit theme_id wins, else look up by theme_name, else auto-create
    let themeId: number | null = cat.theme_id ?? null;
    if (!themeId && cat.theme_name) {
      const key = cat.theme_name.toLowerCase().trim();
      if (themeMap.has(key)) {
        themeId = themeMap.get(key)!;
      } else {
        // Auto-create the theme so categories are visible on /categories
        const { rows: newTheme } = await query<{ id: number }>(
          `INSERT INTO themes (site_id, name, icon, display_order)
           VALUES ($1, $2, 'Sparkles', (SELECT COALESCE(MAX(display_order), 0) + 1 FROM themes WHERE site_id = $1))
           RETURNING id`,
          [siteId, cat.theme_name.trim()],
        );
        themeId = newTheme[0].id;
        themeMap.set(key, themeId);
      }
    }

    try {
      await query(
        `INSERT INTO event_categories
           (event_id, theme_id, name, tagline, short_name, icon, short_summary, description,
            eligibility, judging_criteria, qualitative_criteria, metrics, additional_criteria,
            display_order, is_active, promo, entry_fee)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          eventId,
          themeId,
          cat.name.trim(),
          cat.tagline?.trim()              || null,
          cat.short_name?.trim()           || null,
          cat.icon?.trim()                 || null,
          cat.short_summary?.trim()        || null,
          cat.description?.trim()          || null,
          cat.eligibility?.trim()          || null,
          cat.judging_criteria?.trim()     || null,
          cat.qualitative_criteria?.trim() || null,
          cat.metrics?.trim()              || null,
          cat.additional_criteria?.trim()  || null,
          cat.display_order ?? 0,
          cat.is_active ?? true,
          cat.promo ?? false,
          cat.entry_fee ?? 0,
        ],
      );
      existingNames.add(cat.name.toLowerCase().trim());
      inserted++;
    } catch (err) {
      errors.push(`Row ${i + 1} "${cat.name}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ inserted, skipped, errors });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const eventId = Number(id);
  const siteId = await getSiteId();

  const { rows: evRows } = await query<{ id: number }>(
    `SELECT id FROM events WHERE id = $1 AND site_id = $2`,
    [eventId, siteId],
  );
  if (!evRows[0]) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const body = await req.json() as { ids: number[] };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  const { rowCount } = await query(
    `DELETE FROM event_categories WHERE id = ANY($1::int[]) AND event_id = $2`,
    [body.ids, eventId],
  );

  return NextResponse.json({ deleted: rowCount ?? 0 });
}
