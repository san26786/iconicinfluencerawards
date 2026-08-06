import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireHubAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`,
    [user.sub],
  );
  return rows[0]?.hub_admin ? user : null;
}

export async function GET() {
  const user = await requireHubAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Self-healing: widen year column if it's still varchar(4)
  await query(`ALTER TABLE sites ALTER COLUMN year TYPE varchar(20)`).catch(() => {});

  const { rows } = await query(
    `SELECT id, domain, name, slug, year, email, company, design_variant,
            theme_primary, theme_light, is_active, created_at
       FROM sites ORDER BY created_at`,
  );
  return NextResponse.json({ sites: rows });
}

export async function POST(req: Request) {
  const user = await requireHubAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    domain: string; name: string; slug: string; year?: string; email?: string;
    company?: string; design_variant?: string; theme_primary?: string; theme_light?: string;
    theme_deep?: string; theme_50?: string; theme_bg?: string; theme_bg_slate?: string;
    theme_bg_warm?: string; theme_bg_darkest?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.domain?.trim()) return NextResponse.json({ error: 'Domain is required.' }, { status: 400 });
  if (!body.name?.trim())   return NextResponse.json({ error: 'Site name is required.' }, { status: 400 });
  if (!body.slug?.trim())   return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });

  const domain = body.domain.trim().toLowerCase().replace(/^www\./, '');

  await query(`ALTER TABLE sites ALTER COLUMN year TYPE varchar(20)`).catch(() => {});

  try {
    const { rows } = await query(
      `INSERT INTO sites
         (domain, name, slug, year, email, company, design_variant,
          theme_primary, theme_light, theme_deep, theme_50,
          theme_bg, theme_bg_slate, theme_bg_warm, theme_bg_darkest)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        domain,
        body.name.trim(),
        body.slug.trim().toLowerCase(),
        body.year?.trim() || '2027',
        body.email?.trim() || null,
        body.company?.trim() || null,
        body.design_variant || 'luxury',
        body.theme_primary    || '204 27 27',
        body.theme_light      || '232 184 75',
        body.theme_deep       || '139 0 0',
        body.theme_50         || '255 245 245',
        body.theme_bg         || '11 10 14',
        body.theme_bg_slate   || '20 17 26',
        body.theme_bg_warm    || '26 15 15',
        body.theme_bg_darkest || '6 4 8',
      ],
    );
    return NextResponse.json({ site: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Domain or slug already exists. Please use a different one.' }, { status: 409 });
    }
    console.error('[hub/sites POST]', err);
    return NextResponse.json({ error: `DB error: ${msg}` }, { status: 500 });
  }
}
