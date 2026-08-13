import Image from 'next/image';
import { Star, CalendarDays, MapPin, ArrowRight, Compass } from 'lucide-react';
import { IMG, REASSURE, STATS, CATEGORY_COUNT } from '@/lib/content';
import { getSite } from '@/lib/site';
import { Counter } from '../ui/Counter';
import { Reveal } from '../ui/Reveal';

export async function HeroCorporate() {
  const site = await getSite();
  const heroImageId = site.hero_image_id ?? 'photo-1486406146926-c627a92ad1ab';
  const heroSrc = IMG(heroImageId, 1920);

  return (
    <section
      id="top"
      data-always-dark
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-ink"
    >
      {/* Background */}
      <div className="absolute inset-0">
        {site.hero_video_url ? (
          <video
            src={site.hero_video_url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover object-center opacity-25"
          />
        ) : heroSrc.startsWith('data:') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt={`${site.name} award ceremony`}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-25"
          />
        ) : (
          <Image
            src={heroSrc}
            alt={`${site.name} award ceremony`}
            fill priority sizes="100vw" quality={60}
            className="object-cover object-center opacity-25"
          />
        )}
      </div>
      {/* Clean dark overlay — no grain, flat gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/60 to-ink" />
      {/* Ambient glow from the brand colour */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[70rem] -translate-x-1/2 rounded-full blur-[160px]"
        style={{ background: `rgb(var(--c-primary) / 0.15)` }}
      />

      {/* ── Centred content ─────────────────────────────────────────────── */}
      <div className="container-luxe section-pad relative z-10 flex flex-col items-center py-36 text-center">

        {/* Star badge */}
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-gold text-gold" />
            ))}
          </div>
        </Reveal>

        {/* Eyebrow — venue, city and the nature of the event */}
        <Reveal delay={0.05}>
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.35em] text-white/50">
            {[site.venue_short, site.event_city].filter(Boolean).join(' · ')} · Award Ceremony
          </p>
        </Reveal>

        {/* Heading */}
        <Reveal delay={0.1}>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-[5rem]">
            Recognising{' '}
            <span className="text-gold-shimmer">Iconic Influence</span>
          </h1>
        </Reveal>

        {/* Gold rule */}
        <Reveal delay={0.18}>
          <div className="my-8 flex items-center gap-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-gold/60" />
            <Star className="h-4 w-4 fill-gold text-gold" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-gold/60" />
          </div>
        </Reveal>

        {/* Tagline */}
        <Reveal delay={0.22}>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60">
            This time next year, someone in this industry will walk on stage to a
            standing ovation — their team on their feet, their name in lights.
            There is no reason that story can&apos;t be yours.
          </p>
        </Reveal>

        {/* Event meta pills */}
        <Reveal delay={0.28}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {site.event_date_long && (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80">
                <CalendarDays className="h-4 w-4 text-gold" />
                {site.event_date_long}
              </div>
            )}
            {site.venue_short && (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80">
                <MapPin className="h-4 w-4 text-gold" />
                {site.venue_short}
              </div>
            )}
          </div>
        </Reveal>

        {/* CTAs — enter for yourself, nominate someone else, or find your fit */}
        <Reveal delay={0.34}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/register-interest"
              className="group inline-flex items-center gap-2 rounded-lg bg-gold-gradient px-8 py-3.5 text-sm font-bold tracking-wide text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
            >
              Start Your Free Entry
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="/register-interest?mode=nominate"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/80 transition-all duration-300 hover:border-gold/40 hover:text-white"
            >
              Nominate a Business You Love
            </a>
            <a
              href="#find-my-award"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/80 transition-all duration-300 hover:border-gold/40 hover:text-white"
            >
              <Compass className="h-4 w-4 text-gold" />
              Find My Award
            </a>
          </div>
        </Reveal>

        {/* Reassurance + category count */}
        <Reveal delay={0.38}>
          <p className="mt-5 text-xs text-white/45">
            {REASSURE} ·{' '}
            <a href="/categories" className="text-gold underline-offset-4 hover:underline">
              Explore the {CATEGORY_COUNT} categories
            </a>
          </p>
        </Reveal>

        {/* No countdown here: CountdownBand, the section directly below, owns the
            clock. Two of them stacked on one screen read as a mistake, and the
            hero's job is the headline and the CTAs. */}

        {/* Stats row */}
        <Reveal delay={0.52}>
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/[0.025] px-6 py-5 text-center">
                <div className="font-display text-3xl font-bold text-gold">
                  <Counter value={s.value} suffix={s.suffix} />
                </div>
                <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  );
}
