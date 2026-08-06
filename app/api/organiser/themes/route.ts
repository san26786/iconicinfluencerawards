import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';
import { ALL_THEMES } from '@/lib/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureLinkedSiteIds() {
  await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS linked_site_ids integer[]`).catch(() => {});
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  await ensureLinkedSiteIds();
  const { rows } = await query(
    `SELECT * FROM themes WHERE site_id = $1 ORDER BY display_order, id`,
    [siteId],
  );
  return NextResponse.json({ themes: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const body = await req.json() as {
    action?: 'seed';
    name?: string;
    theme?: string;
    tagline?: string;
    description?: string;
    icon?: string;
    logo_url?: string | null;
    href?: string;
    is_hidden?: boolean;
    display_order?: number;
    linked_site_id?: number | null;
    linked_site_ids?: number[];
  };

  // Seed default themes from lib/content.ts
  if (body.action === 'seed') {
    for (let i = 0; i < ALL_THEMES.length; i++) {
      const t = ALL_THEMES[i];
      await query(
        `INSERT INTO themes (site_id, name, theme, tagline, description, icon, href, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING`,
        [siteId, t.name, t.theme, t.tagline, t.desc, t.icon, t.href, i],
      );
    }
    const { rows } = await query(`SELECT * FROM themes WHERE site_id = $1 ORDER BY display_order, id`, [siteId]);
    return NextResponse.json({ seeded: rows.length, themes: rows });
  }

  // Create single theme
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

  await ensureLinkedSiteIds();
  const ids = body.linked_site_ids ?? (body.linked_site_id ? [body.linked_site_id] : null);
  const { rows } = await query(
    `INSERT INTO themes (site_id, name, theme, tagline, description, icon, logo_url, href, is_hidden, display_order, linked_site_id, linked_site_ids)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      siteId,
      body.name.trim(),
      body.theme?.trim() || null,
      body.tagline?.trim() || null,
      body.description?.trim() || null,
      body.icon?.trim() || 'Sparkles',
      body.logo_url || null,
      body.href?.trim() || null,
      body.is_hidden ?? false,
      body.display_order ?? 0,
      ids?.[0] ?? null,
      ids ?? null,
    ],
  );
  return NextResponse.json({ theme: rows[0] }, { status: 201 });
}
