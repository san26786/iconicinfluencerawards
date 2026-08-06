import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';

const ALLOWED_FIELDS = [
  'name', 'tagline', 'year', 'legal',
  'event_date', 'event_date_long', 'event_date_iso',
  'event_deadline_iso', 'event_deadline_label',
  'event_city', 'venue', 'venue_short', 'ceremonies_count',
  'email', 'phone_display', 'phone_href', 'company', 'address', 'official_site',
  'social_facebook', 'social_instagram', 'social_linkedin', 'social_x',
  'theme_primary', 'theme_light', 'theme_deep', 'theme_50',
  'theme_bg', 'theme_bg_slate', 'theme_bg_warm', 'theme_bg_darkest',
  'hero_image_id', 'hero_video_url', 'categories', 'ga_id', 'is_active',
  'logo_url', 'logo_url_light', 'font_display', 'font_body',
] as const;

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as Record<string, unknown>;
  const siteId = await getSiteId();

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const field of ALLOWED_FIELDS) {
    if (!(field in body)) continue;
    const raw = body[field];
    // Coerce empty strings to null for nullable columns (except booleans/numbers)
    const value = raw === '' ? null : raw;
    setClauses.push(`${field} = $${idx++}`);
    values.push(value);
  }

  if (!setClauses.length) {
    return NextResponse.json({ error: 'No fields provided.' }, { status: 400 });
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(siteId);

  await query(
    `UPDATE sites SET ${setClauses.join(', ')} WHERE id = $${idx}`,
    values,
  );

  // Bust the full-page cache so getSite() returns fresh data on next request.
  revalidatePath('/', 'layout');

  return NextResponse.json({ ok: true });
}
