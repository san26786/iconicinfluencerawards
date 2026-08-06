import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getSite } from '@/lib/site';

// The site advertises its own sitemap and host, and only the canonical host is
// crawlable.
//
// NOTE: middleware.ts must NOT exclude robots.txt from its matcher, or
// x-site-domain won't be set here and getSite() would fall back to defaults.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  const base = (site.official_site || `https://${site.domain}`).replace(/\/$/, '');

  // Staging and per-deployment *.vercel.app hosts serve exactly the same pages
  // as the canonical domain. Left crawlable they compete with it for the same
  // queries, and they advertise a Host they don't answer on — so any host that
  // isn't the canonical one is closed to crawlers outright.
  let requestHost = '';
  try {
    requestHost = (await headers()).get('x-site-domain') ?? '';
  } catch {
    // headers() unavailable during static generation — treat as canonical.
  }

  let canonicalHost: string;
  try {
    canonicalHost = new URL(base).host.replace(/^www\./, '');
  } catch {
    canonicalHost = site.domain;
  }

  const isCanonical =
    !requestHost || requestHost === 'localhost' || requestHost === canonicalHost;

  if (!isCanonical) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nothing here is useful to crawlers, and some of it is per-user.
        disallow: ['/api/', '/organiser/', '/hub/', '/judge/', '/account/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
