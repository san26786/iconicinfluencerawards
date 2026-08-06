import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { price?: number | null; status?: string; notes?: string | null };

  const { rows } = await query(
    `UPDATE products_services
     SET price = $1, status = $2, notes = $3
     WHERE id = $4
     RETURNING *`,
    [body.price ?? null, body.status ?? 'inactive', body.notes?.trim() || null, Number(id)],
  );

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product: rows[0] });
}
