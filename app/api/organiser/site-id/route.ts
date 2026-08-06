import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const siteId = await getSiteId();
  return NextResponse.json({ siteId });
}
