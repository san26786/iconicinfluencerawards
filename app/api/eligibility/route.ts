import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public (logged-in) endpoint — returns site eligibility questions + user profile completeness
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();

  // Self-heal tables
  await query(`
    CREATE TABLE IF NOT EXISTS site_eligibility_links (
      id SERIAL PRIMARY KEY,
      site_id INTEGER NOT NULL,
      question_library_id INTEGER NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_required BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(site_id, question_library_id)
    )
  `).catch(() => {});

  // Fetch eligibility questions for this site
  const { rows: questions } = await query<{
    id: number;
    question_text: string;
    field_type: string;
    options: string[] | null;
    is_required: boolean;
    display_order: number;
  }>(
    `SELECT ql.id, ql.question_text, ql.field_type, ql.options,
            sel.is_required, sel.display_order
       FROM site_eligibility_links sel
       JOIN question_library ql ON ql.id = sel.question_library_id
      WHERE sel.site_id = $1 AND ql.is_active = true
      ORDER BY sel.display_order, sel.id`,
    [siteId],
  ).catch(() => ({ rows: [] }));

  // Fetch user profile to check completeness
  const { rows: userRows } = await query<{
    first_name: string | null;
    last_name: string | null;
    profile: Record<string, string> | null;
  }>(
    `SELECT first_name, last_name, profile FROM users WHERE id = $1`,
    [user.sub],
  ).catch(() => ({ rows: [] }));

  const u = userRows[0];
  const profile = (u?.profile ?? {}) as Record<string, string>;

  const firstName = profile.firstName || u?.first_name || '';
  const lastName = profile.lastName || u?.last_name || '';
  const phone = profile.phone || profile.mobile || '';
  const jobTitle = profile.jobTitle || '';
  const orgName = profile.orgName || '';

  // Profile is "complete" when at least: firstName + lastName + (phone OR jobTitle OR orgName)
  const profileComplete = Boolean(firstName && lastName && (phone || jobTitle || orgName));

  return NextResponse.json({
    profileComplete,
    missingFields: [
      !firstName && 'First Name',
      !lastName && 'Last Name',
      !(phone || jobTitle || orgName) && 'Phone / Job Title / Organisation',
    ].filter(Boolean),
    questions,
  });
}
