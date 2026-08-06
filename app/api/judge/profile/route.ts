import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'judge') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    judgeId: number;
    phone?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    expertise?: string | null;
    bio?: string | null;
    linkedin?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    profilePicUrl?: string | null;
  };

  const siteId = await getSiteId();

  // Ensure judge belongs to this user
  const { rows } = await query<{ id: number }>(
    `SELECT id FROM judges WHERE id = $1 AND user_id = $2 AND site_id = $3 LIMIT 1`,
    [body.judgeId, user.sub, siteId],
  );
  if (!rows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await query(
    `UPDATE judges
        SET phone           = $1,
            company         = $2,
            job_title       = $3,
            expertise       = $4,
            bio             = $5,
            linkedin        = $6,
            facebook        = $7,
            twitter         = $8,
            profile_pic_url = $9,
            updated_at      = now()
      WHERE id = $10`,
    [body.phone ?? null, body.company ?? null, body.jobTitle ?? null,
     body.expertise ?? null, body.bio ?? null, body.linkedin ?? null,
     body.facebook ?? null, body.twitter ?? null, body.profilePicUrl ?? null,
     body.judgeId],
  );

  return NextResponse.json({ ok: true });
}
