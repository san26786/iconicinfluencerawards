import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { ManageThemesClient } from '@/components/organiser/ManageThemesClient';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Themes' };

type ThemeRow = {
  id: number;
  name: string;
  theme: string | null;
  tagline: string | null;
  description: string | null;
  icon: string;
  logo_url: string | null;
  href: string | null;
  is_hidden: boolean;
  display_order: number;
  linked_site_id: number | null;
  linked_site_ids: number[] | null;
} & QueryResultRow;

type SiteOption = { id: number; name: string; domain: string } & QueryResultRow;

async function loadThemes(siteId: number): Promise<ThemeRow[]> {
  const { rows } = await query<ThemeRow>(
    `SELECT * FROM themes WHERE site_id = $1 ORDER BY display_order, id`,
    [siteId],
  );
  return rows;
}

async function loadSites(currentSiteId: number): Promise<SiteOption[]> {
  const { rows } = await query<SiteOption>(
    `SELECT id, name, domain FROM sites WHERE id != $1 AND is_active = true ORDER BY name`,
    [currentSiteId],
  );
  return rows;
}


export default async function OrganiserThemesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') redirect('/login');

  const siteId = await getSiteId();
  const [themes, sites] = await Promise.all([loadThemes(siteId), loadSites(siteId)]);

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-white">Manage Themes</h1>
          <p className="mt-1 text-white/50">
            Add, edit or hide the themes shown on the public <code className="text-gold/70">/themes</code> page.
            Set a <strong className="text-white/70">Linked Site</strong> to make categories under this theme
            appear on another site&apos;s <code className="text-gold/70">/categories</code> page.
          </p>
        </div>

        <ManageThemesClient initial={themes} sites={sites} />
      </div>
    </div>
  );
}
