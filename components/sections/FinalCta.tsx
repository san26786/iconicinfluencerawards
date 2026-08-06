import Image from 'next/image';
import { Sparkles, Clock, CalendarDays } from 'lucide-react';
import { IMG, IMAGES, REASSURE } from '@/lib/content';
import { getSite } from '@/lib/site';
import { PrimaryButton, GhostButton } from '../ui/Button';
import { TrophyMark } from '../ui/Trophy';
import { Reveal } from '../ui/Reveal';

export async function FinalCta() {
  const site = await getSite();
  return (
    <section id="nominate" className="relative overflow-hidden bg-ink py-24 lg:py-36">
      {/* Background imagery */}
      <div className="absolute inset-0">
        <Image
          src={IMG(IMAGES.heroPrimary, 1280, 55)}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1280px"
          quality={50}
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-transparent to-ink/90" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/20 blur-[150px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl glass-gold shadow-gold animate-float">
            <TrophyMark className="h-12 w-12" />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full glass-gold px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-luxe text-gold">
            <Clock className="h-3.5 w-3.5" />
            Nominations for {site.year} are open · Free to enter
          </span>

          <h2 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.04] text-white text-balance">
            Ready to gain the recognition{' '}
            <span className="text-gold-shimmer">you deserve?</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 text-balance">
            Join the organisations turning independent recognition into real momentum. Your
            strongest year starts with a single entry.
          </p>

          <div className="mt-10 inline-flex items-center gap-2.5 rounded-full glass-gold px-5 py-3 text-sm font-semibold text-gold shadow-gold-sm">
            <CalendarDays className="h-4 w-4" />
            Save the date · {site.event_date}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton href="/register-interest">Start Your Free Entry</PrimaryButton>
            <GhostButton href="/register-interest?mode=nominate">Nominate a Business You Love</GhostButton>
          </div>

          <p className="mt-5 text-sm font-medium text-white/55">{REASSURE}</p>

          <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/45">
            <Sparkles className="h-4 w-4 text-gold" />
            Be one of the first businesses ever recognised at {site.venue_short ?? site.name}.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
