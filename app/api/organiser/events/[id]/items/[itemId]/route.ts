import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId } = await params;
  const body = await req.json() as { data: Record<string, unknown>; display_order?: number };

  const { rows } = await query(
    `UPDATE event_items SET data = $1, display_order = COALESCE($2, display_order), updated_at = now()
     WHERE id = $3 RETURNING *`,
    [JSON.stringify(body.data ?? {}), body.display_order ?? null, Number(itemId)],
  );

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item: rows[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId } = await params;
  await query(`DELETE FROM event_items WHERE id = $1`, [Number(itemId)]);
  return NextResponse.json({ ok: true });
}
