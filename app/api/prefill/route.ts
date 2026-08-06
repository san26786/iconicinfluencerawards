// Exchanges a prefill token for the person's basic details (Option B — no PII
// in the link). With no token, falls back to the signed-in visitor's own
// profile so the nomination form also auto-fills when they're logged in.
//
// Public: the token is a capability delivered only in that person's email.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { resolvePrefill, prefillForUserId } from '@/lib/email/prefill';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('t');

  if (token) {
    const prefill = await resolvePrefill(token);
    return NextResponse.json({ prefill });
  }

  // No token → use the logged-in visitor's profile if there is one.
  const session = await getSessionUser();
  if (session && session.role === 'visitor') {
    const prefill = await prefillForUserId(session.sub);
    return NextResponse.json({ prefill });
  }

  return NextResponse.json({ prefill: null });
}
