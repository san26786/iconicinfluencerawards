import Image from 'next/image';
import { ChevronDown, CalendarDays, MapPin, Building2, Layers, Zap } from 'lucide-react';
import { IMG } from '@/lib/content';
import { getSite } from '@/lib/site';
import { PrimaryButton, GhostButton } from '../ui/Button';
import { Counter } from '../ui/Counter';
import { Countdown } from '../ui/Countdown';
import { Reveal } from '../ui/Reveal';

// Mirrors STATS in lib/content.ts — no attendance figure, because the
// inaugural ceremony has no confirmed venue and therefore no known capacity.
const STATS = [
  { value: 6,   suffix: '',  label: 'Themes'     },
  { value: 60,  suffix: '+', label: 'Categories' },
  { value: 100, suffix: '%', label: 'Free Entry' },
  { value: 1,   suffix: '',  label: 'Big Night'  },
];

export async function HeroSport() {
  const site = await getSite();
  const heroImageId = site.hero_image_id ?? 'photo-1470229722913-7c0e2dbbafd3';
  const heroSrc = IMG(heroImageId, 1920);

  return (
    <section
      id="top"
      data-always-dark
      className="relative min-h-[100svh] overflow-hidden bg-ink"
    >
      {/* Full-bleed background */}
      <div className="absolute inset-0">
        {site.hero_video_url ? (
          <video
            src={site.hero_video_url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : heroSrc.startsWith('data:') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt={`${site.name} award ceremony`}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <Image
            src={heroSrc}
            alt={`${site.name} award ceremony`}
            fill priority sizes="100vw" quality={75}
            className="object-cover object-center"
          />
        )}
        {/* Dark base */}
        <div className="absolute inset-0 bg-ink/75" />
        {/* Strong left-to-right directional gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20" />
        {/* Diagonal accent slice using brand colour */}
        <div
          className="absolute inset-y-0 right-0 w-1/3"
          style={{
            background: `linear-gradient(135deg, transparent 40%, rgb(var(--c-primary) / 0.08) 100%)`,
          }}
        />
      </div>

      {/* Decorative year watermark */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 select-none font-display text-[20rem] font-black leading-none text-white/[0.025] sm:text-[28rem]"
        aria-hidden="true"
      >
        {site.year}
      </div>

      {/* Vertical accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ background: `linear-gradient(to bottom, transparent, rgb(var(--c-primary)), transparent)` }}
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="container-luxe section-pad relative z-10 flex min-h-[100svh] items-center py-24">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">

          {/* LEFT — headline block */}
          <div>
            {/* Eyebrow — bold uppercase, no rounded pill */}
            <Reveal>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="h-0.5 w-8"
                  style={{ background: `rgb(var(--c-primary))` }}
                />
                <span className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-gold">
                  <Zap className="mr-1 inline h-3 w-3 fill-gold" />
                  {site.venue_short} · {site.event_city} · Award Ceremony
                </span>
              </div>
            </Reveal>

            {/* Main heading — bold, large, left-heavy */}
            <Reveal delay={0.08}>
              <h1 className="font-display text-[3.2rem] font-black leading-[0.95] sm:text-6xl lg:text-[4.5rem] xl:text-[5.2rem]">
                <span className="block text-white">{site.name}</span>
                <span
                  className="mt-2 block"
                  style={{ color: `rgb(var(--c-primary))` }}
                >
                  {site.year}
                </span>
              </h1>
            </Reveal>

            {/* Tagline */}
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-white/65">
                {site.tagline}
              </p>
            </Reveal>

            {/* Event detail pills — angular style */}
            <Reveal delay={0.22}>
              <div className="mt-8 flex flex-wrap gap-2">
                {site.event_date_long && (
                  <div className="flex items-center gap-2 rounded-md border-l-2 border-gold bg-white/[0.05] px-3 py-2 text-sm text-white/80">
                    <CalendarDays className="h-3.5 w-3.5 text-gold" />
                    {site.event_date_long}
                  </div>
                )}
                {site.venue_short && (
                  <div className="flex items-center gap-2 rounded-md border-l-2 border-gold bg-white/[0.05] px-3 py-2 text-sm text-white/80">
                    <MapPin className="h-3.5 w-3.5 text-gold" />
                    {site.venue_short}
                  </div>
                )}
              </div>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.28} className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton href="/register-interest">Start Your Free Entry</PrimaryButton>
              <GhostButton href="/pre-launch">Join Pre-Launch</GhostButton>
            </Reveal>

            {/* Stats strip */}
            <Reveal delay={0.36}>
              <div className="mt-10 flex flex-wrap items-center divide-x divide-white/10">
                {STATS.map((s) => (
                  <div key={s.label} className="px-5 first:pl-0">
                    <div className="font-display text-2xl font-black text-white">
                      <Counter value={s.value} suffix={s.suffix} />
                    </div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/40">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* RIGHT — info panel (angular, no glass morphism) */}
          <Reveal delay={0.18}>
            <div
              className="rounded-2xl border border-white/10 p-6"
              style={{ background: `linear-gradient(135deg, rgb(var(--c-bg-warm) / 0.9), rgb(var(--c-bg) / 0.95))` }}
            >
              {/* Tiles */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: CalendarDays, label: 'Ceremony',     value: site.event_date_long ?? site.event_date ?? '—' },
                  { icon: Building2,    label: 'Venue',        value: site.venue_short ?? '—'                        },
                  { icon: MapPin,       label: 'Location',     value: site.event_city ?? '—'                         },
                  { icon: Layers,       label: 'Award Themes', value: String(site.ceremonies_count)                  },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
                  >
                    <div className="mb-2 flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-gold">
                      <t.icon className="h-3 w-3" />
                      {t.label}
                    </div>
                    <div className="font-display text-[1rem] font-bold leading-tight text-white">
                      {t.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Countdown */}
              {site.event_date_iso && (
                <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <Countdown
                    deadline={site.event_date_iso}
                    variant="panel"
                    label="Counting down to the Award Ceremony"
                    closedLabel="The Awards Ceremony is here 🏆"
                  />
                </div>
              )}

              {/* Quick links */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.65rem] font-semibold text-white/45">
                {[
                  { href: '/themes',     label: 'Themes'     },
                  { href: '/#why',       label: 'Why Enter'  },
                  { href: '/categories', label: 'Categories' },
                  { href: '/#sponsors',  label: 'Sponsors'   },
                  { href: '/contact',    label: 'Contact'    },
                ].map((l, i, arr) => (
                  <span key={l.label} className="inline-flex items-center gap-x-3">
                    <a href={l.href} className="transition-colors hover:text-gold">{l.label}</a>
                    {i < arr.length - 1 && <span className="text-white/15">|</span>}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#why"
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/40 transition-colors hover:text-gold sm:flex"
        aria-label="Scroll to explore"
      >
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.3em]">Discover</span>
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}
