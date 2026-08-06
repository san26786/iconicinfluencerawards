import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  try {
    const { rows } = await query(
      `SELECT
         er.id,
         er.email,
         er.status,
         er.sent_at::text      AS sent_at,
         er.delivered_at::text AS delivered_at,
         er.opened_at::text    AS opened_at,
         er.clicked_at::text   AS clicked_at,
         er.error,
         ej.name               AS job_name,
         et.name               AS template_name,
         COALESCE(ej.subject, et.subject, '') AS subject
       FROM email_recipients er
       LEFT JOIN email_jobs      ej ON ej.id = er.job_id
       LEFT JOIN email_templates et ON et.id = ej.template_id
       WHERE LOWER(er.email) = LOWER($1)
       ORDER BY er.created_at DESC
       LIMIT 50`,
      [email],
    );
    return NextResponse.json({ emails: rows });
  } catch {
    return NextResponse.json({ emails: [] });
  }
}
