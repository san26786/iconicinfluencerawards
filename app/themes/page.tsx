import type { Metadata } from 'next';
import { ArrowUpRight, Compass, HeartHandshake, Layers } from 'lucide-react';
import { THEMES, THEMES_VISION, IMAGES } from '@/lib/content';
import { getSite, getSiteId } from '@/lib/site';
import { query } from '@/lib/db';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Themes',
    description: `One vision, distinct themes. Explore the areas of ${site.name} and engage with what matters most to you.`,
  };
}

const UNITY = [
  { icon: Compass, title: 'One Vision', body: 'Every theme points the same way — recognising and elevating the people shaping our future.' },
  { icon: Layers, title: 'One Environment', body: 'Distinct areas of focus, one connected platform — easy to explore, easy to belong to.' },
  { icon: HeartHandshake, title: 'One Community', body: 'Distinct purposes, shared values — and a place for you within the wider ecosystem.' },
];

type ThemeRow = {
  id: number;
  name: string;
  theme: string | null;
  tagline: string | null;
  description: string | null;
  icon: string;
  logo_url: string | null;
  href: string | null;
  display_order: number;
};

async function getThemes(siteId: number): Promise<ThemeRow[]> {
  try {
    const { rows } = await query<ThemeRow>(
      `SELECT id, name, theme, tagline, description, icon, logo_url, href, display_order
         FROM themes
        WHERE is_hidden = false
          AND (
            site_id = $1
            OR linked_site_id = $1
            OR $1 = ANY(COALESCE(linked_site_ids, '{}'::integer[]))
          )
        ORDER BY display_order, id`,
      [siteId],
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function ThemesPage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);
  const dbThemes = await getThemes(siteId);

  // Use DB themes if seeded, otherwise fall back to hardcoded
  const themes = dbThemes.length > 0
    ? dbThemes.map((t) => ({
        icon: t.icon,
        logo_url: t.logo_url ?? null,
        theme: t.theme ?? '',
        name: t.name,
        tagline: t.tagline ?? '',
        desc: t.description ?? '',
        href: t.href ?? '#',
      }))
    : THEMES.map((t) => ({ ...t, desc: t.desc, logo_url: null }));

  return (
    <main id="main">
      <PageHero
        eyebrow="Our Themes · One Vision"
        title={
          <>
            Engage with what matters <span className="text-gold-gradient">most to you</span>
          </>
        }
        subtitle="Distinct themes, one shared vision, one environment. Each is a different way to be seen and celebrated — find the one that aligns with your values, ambitions and goals."
        image={IMAGES.stageSpeaker}
      />

      {/* Themes grid */}
      <section className="relative overflow-hidden bg-slate950 py-16 lg:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-gold/[0.07] blur-[140px] hidden sm:block" />
        <div className="container-luxe section-pad relative">
          <RevealGroup className="grid gap-5 md:grid-cols-2" stagger={0.08}>
            {themes.map((t, i) => (
              <RevealItem key={t.name}>
                <ThemeCard
                  index={i}
                  icon={t.icon}
                  logo_url={t.logo_url}
                  theme={t.theme}
                  name={t.name}
                  tagline={t.tagline}
                  desc={t.desc}
                  href={t.href}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* One vision / one environment */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-rule" />
        <div className="container-luxe section-pad">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              United by Purpose
            </span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-white text-balance sm:text-4xl">
              Different paths, <span className="text-gold-gradient">one community</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/65 text-balance">
              {THEMES_VISION} Each theme serves a unique purpose, but all are connected by a shared
              mission — to recognise, celebrate and connect the people driving {site.name} forward.
            </p>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3" stagger={0.08}>
            {UNITY.map((u) => (
              <RevealItem key={u.title}>
                <div className="h-full rounded-2xl glass p-7 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <u.icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{u.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{u.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}

function ThemeCard({
  icon,
  logo_url,
  theme,
  name,
  tagline,
  desc,
  href,
  index,
}: {
  icon: string;
  logo_url: string | null;
  theme: string;
  name: string;
  tagline: string;
  desc: string;
  href: string;
  index: number;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl glass p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40"
    >
      <div className="pointer-events-none absolute inset-0 bg-gold-gradient opacity-0 transition-opacity duration-500 group-hover:opacity-[0.06]" />

      <div className="relative flex items-start justify-between">
        {logo_url ? (
          <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-gold/25 bg-white/5 p-1.5 transition-all duration-300 group-hover:border-gold/50">
            <img src={logo_url} alt={name} className="h-full w-full object-contain" />
          </span>
        ) : (
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold transition-all duration-300 group-hover:bg-gold-gradient group-hover:text-ink">
            <Icon name={icon as IconName} className="h-6 w-6" />
          </span>
        )}
        <span className="font-display text-sm font-semibold text-white/15">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <p className="relative mt-6 text-xs font-semibold uppercase tracking-luxe text-gold">{theme}</p>
      <h3 className="relative mt-1 font-display text-2xl font-semibold text-white">{name}</h3>
      <p className="relative mt-1.5 text-sm font-medium text-gold/70">{tagline}</p>
      <p className="relative mt-4 flex-1 leading-relaxed text-white/55">{desc}</p>

      <span className="relative mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold/70 transition-colors duration-300 group-hover:text-gold">
        Explore this theme
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </a>
  );
}
