// Clears the session cookie.

import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function logoutResponse(req: Request) {
  const res = NextResponse.redirect(new URL('/login', req.url));
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  return logoutResponse(req);
}

export async function GET(req: Request) {
  return logoutResponse(req);
}
