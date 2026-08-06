import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { CreateSiteClient } from '@/components/hub/CreateSiteClient';
import type { QueryResultRow } from 'pg';

// Access is gated by users.hub_admin (see requireHubAdmin below and
// app/hub/layout.tsx) — there is no domain gate on a single-tenant deployment.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hub — Manage Sites' };

type SiteRow = {
  id: number;
  domain: string;
  name: string;
  slug: string;
  year: string;
  email: string | null;
  company: string | null;
  design_variant: string;
  theme_primary: string;
  theme_light: string;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
} & QueryResultRow;

async function requireHubAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`,
    [user.sub],
  );
  return rows[0]?.hub_admin ? user : null;
}

async function loadSites(): Promise<SiteRow[]> {
  const { rows } = await query<SiteRow>(
    `SELECT id, domain, name, slug, year, email, company, design_variant,
            theme_primary, theme_light, is_active, logo_url, created_at
       FROM sites ORDER BY created_at`,
  );
  return rows;
}

export default async function HubSitesPage() {
  const user = await requireHubAdmin();
  if (!user) redirect('/login');

  const sites = await loadSites();

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">

        {/* Header */}
        <div className="mb-10">
          <span className="eyebrow mb-3 flex items-center gap-2">
            <span className="h-px w-5 bg-gold/60" />
            Hub Admin
          </span>
          <h1 className="font-display text-4xl font-semibold text-white">
            Manage <span className="text-gold-gradient">Sites</span>
          </h1>
          <p className="mt-2 text-white/50">
            Create and manage multi-tenant award sites. Each site is served from the same
            codebase — only the domain and database row differ.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { step: "01", title: "Create site", body: "Fill in the form below — domain, name, colour scheme. Takes 30 seconds." },
            { step: "02", title: "Add DNS", body: "Add the domain in Vercel → Domains. Set a CNAME to cname.vercel-dns.com." },
            { step: "03", title: "Configure", body: "Visit /organiser/site-settings on the new domain to set event details, social links, and more." },
          ].map((c) => (
            <div key={c.step} className="rounded-2xl glass p-5">
              <span className="font-display text-xs font-bold text-gold/50">{c.step}</span>
              <h3 className="mt-1 font-display text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/50">{c.body}</p>
            </div>
          ))}
        </div>

        <CreateSiteClient initial={sites} />
      </div>
    </div>
  );
}
