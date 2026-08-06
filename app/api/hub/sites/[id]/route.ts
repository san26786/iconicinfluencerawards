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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireHubAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    domain?: string; name?: string; slug?: string; year?: string; email?: string;
    company?: string; design_variant?: string; is_active?: boolean;
    theme_primary?: string; theme_light?: string; theme_deep?: string;
    theme_50?: string; theme_bg?: string; theme_bg_slate?: string;
    theme_bg_warm?: string; theme_bg_darkest?: string; logo_url?: string;
  };

  const { rows } = await query(
    `UPDATE sites
        SET domain          = COALESCE($1,  domain),
            name            = COALESCE($2,  name),
            slug            = COALESCE($3,  slug),
            year            = COALESCE($4,  year),
            email           = COALESCE($5,  email),
            company         = COALESCE($6,  company),
            design_variant  = COALESCE($7,  design_variant),
            is_active       = COALESCE($8,  is_active),
            theme_primary   = COALESCE($9,  theme_primary),
            theme_light     = COALESCE($10, theme_light),
            theme_deep      = COALESCE($11, theme_deep),
            theme_50        = COALESCE($12, theme_50),
            theme_bg        = COALESCE($13, theme_bg),
            theme_bg_slate  = COALESCE($14, theme_bg_slate),
            theme_bg_warm   = COALESCE($15, theme_bg_warm),
            theme_bg_darkest= COALESCE($16, theme_bg_darkest),
            logo_url        = COALESCE($17, logo_url),
            updated_at      = now()
      WHERE id = $18
      RETURNING id, domain, name, slug, year, email, company,
                design_variant, theme_primary, theme_light, is_active, logo_url, created_at`,
    [
      body.domain?.trim().toLowerCase().replace(/^www\./, '') ?? null,
      body.name?.trim()           ?? null,
      body.slug?.trim().toLowerCase() ?? null,
      body.year?.trim()           ?? null,
      body.email?.trim()          ?? null,
      body.company?.trim()        ?? null,
      body.design_variant         ?? null,
      body.is_active              ?? null,
      body.theme_primary          ?? null,
      body.theme_light            ?? null,
      body.theme_deep             ?? null,
      body.theme_50               ?? null,
      body.theme_bg               ?? null,
      body.theme_bg_slate         ?? null,
      body.theme_bg_warm          ?? null,
      body.theme_bg_darkest       ?? null,
      body.logo_url               ?? null,
      Number(id),
    ],
  );

  if (!rows[0]) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  return NextResponse.json({ site: rows[0] });
}
