import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const user = await getSessionUser();
    results.user = user ? { role: user.role, email: user.email } : null;
  } catch (e) {
    results.user_error = String(e);
  }

  try {
    const siteId = await getSiteId();
    results.siteId = siteId;
  } catch (e) {
    results.siteId_error = String(e);
  }

  // Test 1: plain applications query (same as shortlists)
  try {
    const { rows } = await query(
      `SELECT a.id, a.ref_number, a.status, a.first_name, a.last_name, a.email, a.mobile,
              a.job_title, a.org_name, a.industry, e.title AS event_title, a.created_at
       FROM applications a
       LEFT JOIN events e ON e.id = a.event_id
       WHERE a.site_id = $1
       ORDER BY a.created_at DESC
       LIMIT 5`,
      [results.siteId ?? 1],
    );
    results.plain_query_count = rows.length;
    results.plain_query_sample = rows.slice(0, 2);
    results.created_at_type = rows[0] ? typeof rows[0].created_at + ' / ' + (rows[0].created_at?.constructor?.name) : 'no rows';
  } catch (e) {
    results.plain_query_error = String(e);
  }

  // Test 2: with EXISTS filter
  try {
    const { rows } = await query(
      `SELECT a.id, a.email
       FROM applications a
       WHERE a.site_id = $1
         AND a.email IS NOT NULL
         AND EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(a.email))
       LIMIT 5`,
      [results.siteId ?? 1],
    );
    results.exists_query_count = rows.length;
    results.exists_query_emails = rows.map((r: Record<string, unknown>) => r.email);
  } catch (e) {
    results.exists_query_error = String(e);
  }

  // Test 3: check users table
  try {
    const { rows } = await query(`SELECT COUNT(*) AS cnt FROM users`);
    results.users_count = rows[0]?.cnt;
  } catch (e) {
    results.users_table_error = String(e);
  }

  return NextResponse.json(results, { status: 200 });
}
