import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const nomId = Number(id);
  if (!nomId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json() as {
    isShortlisted: boolean;
    isSemifinalist: boolean;
    isFinalist: boolean;
  };

  await query(
    `UPDATE nominations
        SET is_shortlisted   = $1,
            is_semifinalist  = $2,
            is_finalist      = $3
      WHERE id = $4 AND deleted_at IS NULL`,
    [!!body.isShortlisted, !!body.isSemifinalist, !!body.isFinalist, nomId],
  );

  return NextResponse.json({ ok: true });
}
