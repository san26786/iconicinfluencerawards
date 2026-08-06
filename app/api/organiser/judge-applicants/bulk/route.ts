import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: bulk-allocate multiple nominations to one judge
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { judgeId, nominationIds } = await req.json() as { judgeId: number; nominationIds: number[] };
    if (!judgeId || !Array.isArray(nominationIds) || nominationIds.length === 0) {
      return NextResponse.json({ error: 'judgeId and nominationIds[] required' }, { status: 400 });
    }

    const siteId = await getSiteId();

    for (const nomId of nominationIds) {
      await query(
        `INSERT INTO judge_applicants (judge_id, nomination_id, site_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (judge_id, nomination_id) DO NOTHING`,
        [judgeId, nomId, siteId],
      );
    }

    return NextResponse.json({ ok: true, allocated: nominationIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: bulk-remove multiple nominations from one judge
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { judgeId, nominationIds } = await req.json() as { judgeId: number; nominationIds: number[] };
    if (!judgeId || !Array.isArray(nominationIds) || nominationIds.length === 0) {
      return NextResponse.json({ error: 'judgeId and nominationIds[] required' }, { status: 400 });
    }

    const siteId = await getSiteId();

    await query(
      `DELETE FROM judge_applicants
       WHERE judge_id = $1 AND site_id = $2
         AND nomination_id = ANY($3::int[])`,
      [judgeId, siteId, nominationIds],
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
