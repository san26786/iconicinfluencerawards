import type { MetadataRoute } from 'next';
import { getSite } from '@/lib/site';

// Every public route, ordered by how much we want it crawled. The ORIGIN comes
// from the requesting site rather than a hardcoded domain.
const ROUTES: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/register-interest', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/nomination-guideline', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/view-application', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/categories', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/themes', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/brochure', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/judges', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about-event', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/venue', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/tickets', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/faqs', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/speakers', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/sponsors', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/partner', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/challenge', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/for-organisers', priority: 0.7, changeFrequency: 'monthly' },
  // Stage listings change as judging progresses, so they are worth re-crawling
  // more often than the static marketing pages above.
  { path: '/shortlists', priority: 0.65, changeFrequency: 'weekly' },
  { path: '/semifinalists', priority: 0.65, changeFrequency: 'weekly' },
  { path: '/finalists', priority: 0.65, changeFrequency: 'weekly' },
  { path: '/winners', priority: 0.65, changeFrequency: 'weekly' },
  { path: '/find-my-award', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.4, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const base = (site.official_site || `https://${site.domain}`).replace(/\/$/, '');

  return ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
