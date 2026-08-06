import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureApplicationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS applications (
      id              serial PRIMARY KEY,
      site_id         int NOT NULL,
      event_id        int,
      ref_number      varchar(20) NOT NULL UNIQUE,
      status          varchar(30) NOT NULL DEFAULT 'submitted',
      first_name      varchar(100),
      last_name       varchar(100),
      email           varchar(255),
      phone           varchar(50),
      mobile          varchar(50),
      job_title       varchar(200),
      org_name        varchar(200),
      industry        varchar(100),
      eligibility_answers jsonb,
      application_answers jsonb,
      created_at      timestamptz NOT NULL DEFAULT now(),
      updated_at      timestamptz NOT NULL DEFAULT now()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS applications_site_id_idx ON applications(site_id)`);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureApplicationsTable();
    const siteId = await getSiteId();
    const { rows } = await query(
      `SELECT
         a.id, a.ref_number, a.status,
         a.first_name, a.last_name, a.email, a.mobile,
         a.job_title, a.org_name, a.industry,
         e.title AS event_title,
         a.created_at::text AS created_at
       FROM applications a
       LEFT JOIN events e ON e.id = a.event_id
       WHERE a.site_id = $1
         AND a.email IS NOT NULL
         AND EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(a.email))
       ORDER BY a.created_at DESC`,
      [siteId],
    );
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const siteId = await getSiteId();
    const { id, status } = await req.json();
    const allowed = ['submitted', 'reviewing', 'shortlisted', 'semifinalist', 'finalist', 'winner', 'runner_up', 'rejected'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    const { rows } = await query(
      `UPDATE applications SET status=$3, updated_at=now()
       WHERE id=$1 AND site_id=$2 RETURNING id, status`,
      [id, siteId, status],
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
