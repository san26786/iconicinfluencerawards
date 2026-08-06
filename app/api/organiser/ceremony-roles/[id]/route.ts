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
    category?: string | null;
    role?: string | null;
    person_name?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    status?: string | null;
  };

  const { rows } = await query(
    `UPDATE ceremony_roles
        SET category    = COALESCE($1, category),
            role        = COALESCE($2, role),
            person_name = $3,
            company     = $4,
            email       = $5,
            phone       = $6,
            notes       = $7,
            status      = COALESCE($8, status)
      WHERE id = $9 AND site_id = $10
      RETURNING *`,
    [
      body.category?.trim()     || null,
      body.role?.trim()         || null,
      body.person_name?.trim()  || null,
      body.company?.trim()      || null,
      body.email?.trim()        || null,
      body.phone?.trim()        || null,
      body.notes?.trim()        || null,
      body.status               || null,
      Number(id),
      siteId,
    ],
  );

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ role: rows[0] });
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
    `DELETE FROM ceremony_roles WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );

  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
