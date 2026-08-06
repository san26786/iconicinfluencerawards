import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireOrganiser() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return null;
  return user;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireOrganiser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const siteId = await getSiteId();
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { rows } = await query<{ id: number; name: string }>(
    `UPDATE leadership_types SET name=$1 WHERE id=$2 AND site_id=$3 RETURNING id, name`,
    [name.trim(), id, siteId],
  );
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ type: rows[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireOrganiser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const siteId = await getSiteId();
  await query(`DELETE FROM leadership_types WHERE id=$1 AND site_id=$2`, [id, siteId]);
  return NextResponse.json({ ok: true });
}
