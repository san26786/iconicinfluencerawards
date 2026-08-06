import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireHubAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`, [user.sub],
  );
  return rows[0]?.hub_admin ? user : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireHubAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { rows } = await query(`SELECT * FROM sites WHERE id = $1`, [Number(id)]);
  if (!rows[0]) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  return NextResponse.json({ site: rows[0] });
}

const ALLOWED = [
  'name','tagline','year','email','phone_display','phone_href','company','address',
  'official_site','event_date','event_date_long','event_date_iso','event_deadline_iso',
  'event_deadline_label','event_city','venue','venue_short','ceremonies_count',
  'social_facebook','social_instagram','social_linkedin','social_x',
  'theme_primary','theme_light','theme_deep','theme_50',
  'theme_bg','theme_bg_slate','theme_bg_warm','theme_bg_darkest',
  'logo_url','logo_url_light','hero_image_id','hero_video_url','font_display','font_body','design_variant','is_active',
] as const;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireHubAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const field of ALLOWED) {
    if (!(field in body)) continue;
    const raw = body[field];
    const value = raw === '' ? null : raw;
    setClauses.push(`${field} = $${idx++}`);
    values.push(value);
  }

  if (!setClauses.length) return NextResponse.json({ error: 'No fields provided.' }, { status: 400 });

  setClauses.push(`updated_at = NOW()`);
  values.push(Number(id));

  const { rows } = await query(
    `UPDATE sites SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );

  if (!rows[0]) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  return NextResponse.json({ ok: true, site: rows[0] });
}
