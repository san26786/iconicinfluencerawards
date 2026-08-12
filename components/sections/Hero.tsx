import Image from 'next/image';
import {
  Sparkles,
  ChevronDown,
  CalendarDays,
  MapPin,
  Ticket,
  Layers,
  Instagram,
  Youtube,
  Twitch,
  Twitter,
  Music2,
  Podcast,
} from 'lucide-react';
import { STATS, REASSURE, IMG, CATEGORY_COUNT } from '@/lib/content';
import { getSite } from '@/lib/site';
import { PrimaryButton, GhostButton } from '../ui/Button';
import { Counter } from '../ui/Counter';
import { Countdown } from '../ui/Countdown';
import { Reveal } from '../ui/Reveal';

const PLATFORMS = [
  { icon: Instagram, label: 'Instagram' },
  { icon: Music2, label: 'TikTok' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Twitch, label: 'Twitch' },
  { icon: Twitter, label: 'X' },
  { icon: Podcast, label: 'Podcasts' },
];

export async function Hero() {
  const site = await getSite();

  const heroImageId = site.hero_image_id ?? 'photo-1470229722913-7c0e2dbbafd3';
  const heroSrc = IMG(heroImageId, 1920);

  return (
    <section
      id="top"
      data-always-dark
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink grain"
    >
      {/* Cinematic background */}
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
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-center"
          />
        )}
      </div>

      {/* Layered overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" />
      {/* Brand colour grade — warms the photo to match the site palette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 25% 50%, rgb(var(--c-deep) / 0.45) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 75% 30%, rgb(var(--c-light) / 0.25) 0%, transparent 65%)',
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[40rem] w-[40rem] rounded-full bg-gold/25 blur-[140px] hidden sm:block" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[34rem] w-[34rem] rounded-full bg-gold-light/10 blur-[130px] hidden sm:block" />

      {/* Content */}
      <div className="container-luxe section-pad relative z-10 pt-36 pb-24 lg:pt-40">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12 xl:grid-cols-[1fr_24rem]">
          {/* LEFT — narrative */}
          <div>
            <Reveal className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2.5 rounded-full glass-gold px-4 py-2 text-[0.68rem] sm:text-xs font-semibold uppercase tracking-luxe text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Inaugural Award Ceremony · {site.year}
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-[2.7rem] leading-[0.98] sm:text-6xl lg:text-[3.6rem] xl:text-6xl font-semibold text-white text-balance">
                {site.name}
                <span className="block text-gold-shimmer">{site.year}</span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-lg sm:text-xl font-light leading-relaxed text-white/80 text-balance">
                {site.tagline}
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-white/55">
                This time next year, a creator will walk on stage to a standing ovation — their
                community cheering them on, their name in lights. There is no reason that story
                can&apos;t be yours.
              </p>
            </Reveal>

            <Reveal
              delay={0.32}
              className="mt-9 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4"
            >
              <PrimaryButton href="/register-interest">Start Your Free Entry</PrimaryButton>
              <GhostButton href="/pre-launch">Join Pre-Launch</GhostButton>
              <GhostButton href="/register-interest#enter-in-under-two-minutes">
                Nominate a Creator You Love
              </GhostButton>
              <GhostButton href="/#find-my-award">Find My Awards</GhostButton>
              <GhostButton href="/#your-awards-journey">Your Awards Journey</GhostButton>
            </Reveal>

            <Reveal
              delay={0.42}
              className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45"
            >
              <span>{REASSURE}</span>
              <a
                href="/categories"
                className="font-medium text-gold/80 underline-offset-4 transition-colors hover:text-gold hover:underline"
              >
                Explore the categories →
              </a>
            </Reveal>

            <Reveal
              delay={0.5}
              className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <span className="text-[0.6rem] font-semibold uppercase tracking-luxe text-white/35">
                Celebrating creators across
              </span>
              <div className="flex items-center gap-3 text-white/40">
                {PLATFORMS.map((p) => (
                  <p.icon key={p.label} className="h-4 w-4 transition-colors hover:text-gold" aria-label={p.label} />
                ))}
              </div>
            </Reveal>
          </div>

          {/* RIGHT — event panel */}
          <Reveal delay={0.2}>
            <HeroInfoPanel site={site} />
          </Reveal>
        </div>

        {/* Trust metrics */}
        <Reveal
          delay={0.5}
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass lg:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-white/[0.015] p-5 sm:p-6 text-center sm:text-left">
              <div className="font-display text-3xl sm:text-4xl font-semibold text-gold-gradient">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-1.5 text-[0.7rem] sm:text-xs uppercase tracking-wider text-white/50">
                {s.label}
              </p>
            </div>
          ))}
        </Reveal>
      </div>

      {/* Scroll cue */}
      <a
        href="#why"
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/40 transition-colors hover:text-gold sm:flex"
        aria-label="Scroll to explore"
      >
        <span className="text-[0.62rem] uppercase tracking-luxe">Discover</span>
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}

function HeroInfoPanel({ site }: { site: Awaited<ReturnType<typeof getSite>> }) {
  const TILES = [
    { icon: CalendarDays, label: 'Ceremony', value: site.event_date_long ?? site.event_date ?? 'Announced Soon' },
    { icon: MapPin,       label: 'Location', value: site.event_city ?? 'Worldwide' },
    { icon: Ticket,       label: 'Entry',    value: 'Completely Free' },
    { icon: Layers,       label: 'Categories', value: `${CATEGORY_COUNT}+ Awards` },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink/75 p-5 sm:p-6 shadow-glass backdrop-blur-md">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl hidden sm:block" />

      <div className="relative grid grid-cols-2 gap-3">
        {TILES.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-4 transition-colors duration-300 hover:border-gold/35"
          >
            <div className="flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold">
              <t.icon className="h-3 w-3" />
              {t.label}
            </div>
            <div className="mt-2 font-display text-[1.05rem] font-semibold leading-tight text-white">
              {t.value}
            </div>
          </div>
        ))}
      </div>

      {/* Live countdown */}
      {site.event_date_iso && (
        <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <Countdown
            deadline={site.event_date_iso}
            variant="panel"
            label="Counting Down to Award Night"
            closedLabel="The Awards Ceremony is here ✨"
          />
        </div>
      )}

      {/* Footer quick links */}
      <div className="relative mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.7rem] font-medium text-white/55">
        {[
          { href: '/themes',     label: 'Themes' },
          { href: '/#why',       label: 'Why Enter' },
          { href: '/categories', label: 'Categories' },
          { href: '/#sponsors',  label: 'Sponsors' },
          { href: '/contact',    label: 'Contact' },
        ].map((l, i, arr) => (
          <span key={l.label} className="inline-flex items-center gap-x-3">
            <a href={l.href} className="transition-colors hover:text-gold">
              {l.label}
            </a>
            {i < arr.length - 1 && <span className="text-white/20">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
