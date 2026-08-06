import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Reads the incoming Host header on every request and forwards the clean
// domain (no www prefix, no port) as x-site-domain.  Server components and
// API routes call getSite() which reads this header — they never touch the
// raw Host value directly.
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  // Strip www. prefix and any :port suffix (the latter keeps localhost:3000 working)
  const domain = host.replace(/^www\./, '').replace(/:\d+$/, '');

  const res = NextResponse.next();
  res.headers.set('x-site-domain', domain);
  return res;
}

export const config = {
  // Run on every route except Next.js internals and the icon.
  //
  // robots.txt is deliberately NOT excluded any more: it's generated per-tenant
  // by app/robots.ts, which needs x-site-domain to resolve the right site.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon\\.png).*)'],
};
