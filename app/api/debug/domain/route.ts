import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const headersList = await headers();
  const rawDomain = headersList.get('x-site-domain') ?? '(missing)';
  const host = headersList.get('host') ?? '(missing)';

  let sites: { id: number; domain: string; name: string; is_active: boolean }[] = [];
  let matched: { id: number; domain: string; name: string } | null = null;
  let dbError: string | null = null;

  try {
    const { rows } = await query<{ id: number; domain: string; name: string; is_active: boolean }>(
      `SELECT id, domain, name, is_active FROM sites ORDER BY id`,
      [],
    );
    sites = rows;
    matched = rows.find(r => r.domain === rawDomain && r.is_active) ?? null;
  } catch (err) {
    dbError = String(err);
  }

  return NextResponse.json({
    host_header: host,
    x_site_domain: rawDomain,
    matched_site: matched,
    all_sites: sites,
    db_error: dbError,
  });
}
