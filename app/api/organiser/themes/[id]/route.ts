import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const siteId = await getSiteId();
  const body = await req.json() as {
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

  try {
    // Ensure optional columns exist (self-healing migrations)
    await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS linked_site_ids integer[]`).catch(() => {});
    await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`).catch(() => {});
    await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS logo_url text`).catch(() => {});
    await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS linked_site_id integer`).catch(() => {});

    const hasLinkedSites = 'linked_site_ids' in body || 'linked_site_id' in body;
    const ids = 'linked_site_ids' in body
      ? (body.linked_site_ids ?? null)
      : (body.linked_site_id ? [body.linked_site_id] : null);
    const firstId = ids?.[0] ?? null;

    const { rows } = await query(
      `UPDATE themes
          SET name            = COALESCE($1, name),
              theme           = COALESCE($2, theme),
              tagline         = COALESCE($3, tagline),
              description     = COALESCE($4, description),
              icon            = COALESCE($5, icon),
              logo_url        = CASE WHEN $6::boolean THEN $7 ELSE logo_url END,
              href            = COALESCE($8, href),
              is_hidden       = COALESCE($9, is_hidden),
              display_order   = COALESCE($10, display_order),
              linked_site_id  = CASE WHEN $11::boolean THEN $12 ELSE linked_site_id END,
              linked_site_ids = CASE WHEN $11::boolean THEN $13::integer[] ELSE linked_site_ids END,
              updated_at      = now()
        WHERE id = $14 AND site_id = $15
        RETURNING *`,
      [
        body.name?.trim()        ?? null,
        body.theme?.trim()       ?? null,
        body.tagline?.trim()     ?? null,
        body.description?.trim() ?? null,
        body.icon?.trim()        ?? null,
        'logo_url' in body,
        body.logo_url            ?? null,
        body.href?.trim()        ?? null,
        body.is_hidden           ?? null,
        body.display_order       ?? null,
        hasLinkedSites,
        firstId,
        ids,
        Number(id),
        siteId,
      ],
    );

    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ theme: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[themes PUT]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const siteId = await getSiteId();

  const { rowCount } = await query(
    `DELETE FROM themes WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );

  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
