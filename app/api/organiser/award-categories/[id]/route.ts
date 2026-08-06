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
  const siteId  = await getSiteId();

  const body = await req.json() as {
    include_in_eligibility?: boolean;
    nominations_count?: number;
    applications_count?: number;
    judges_count?: number;
    include_in_graph?: boolean;
    applicant_level_judging?: boolean;
    excluded_in_stats?: boolean;
  };

  const { rows } = await query(
    `UPDATE award_categories
        SET include_in_eligibility  = COALESCE($1, include_in_eligibility),
            nominations_count       = COALESCE($2, nominations_count),
            applications_count      = COALESCE($3, applications_count),
            judges_count            = COALESCE($4, judges_count),
            include_in_graph        = COALESCE($5, include_in_graph),
            applicant_level_judging = COALESCE($6, applicant_level_judging),
            excluded_in_stats       = COALESCE($7, excluded_in_stats)
      WHERE id = $8 AND site_id = $9
      RETURNING *`,
    [
      body.include_in_eligibility  ?? null,
      body.nominations_count       ?? null,
      body.applications_count      ?? null,
      body.judges_count            ?? null,
      body.include_in_graph        ?? null,
      body.applicant_level_judging ?? null,
      body.excluded_in_stats       ?? null,
      Number(id),
      siteId,
    ],
  );

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ category: rows[0] });
}
