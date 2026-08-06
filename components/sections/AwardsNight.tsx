import Image from 'next/image';
import { CalendarDays, MapPin, Sparkles, Users } from 'lucide-react';
import { CEREMONY_WINDOW, IMG, IMAGES } from '@/lib/content';
import { getSite } from '@/lib/site';
import { Countdown } from '../ui/Countdown';
import { PrimaryButton, GhostButton } from '../ui/Button';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

/**
 * "One day. A career-defining moment." — the ceremony section. The ceremony is a
 * daytime programme (see CEREMONY_WINDOW), not the evening gala the platform's
 * stock copy assumed.
 *
 * Four fact tiles (when / where / who / what) sit beside a countdown to the
 * ceremony itself. Everything except the two static tiles comes off the site
 * row, so a change of venue or date needs no code edit.
 */
export async function AwardsNight() {
  const site = await getSite();
  const city = site.event_city ?? 'the city';

  const facts = [
    {
      icon: CalendarDays,
      label: site.event_date_long ?? site.event_date ?? 'Date to be announced',
      sub: `Awards ceremony, ${CEREMONY_WINDOW.label}`,
    },
    {
      icon: MapPin,
      label: city,
      sub: site.venue_short ?? 'Venue to be announced',
    },
    {
      icon: Users,
      label: 'Finalists & guests',
      sub: 'Leaders, finalists & partners',
    },
    {
      icon: Sparkles,
      label: 'An unforgettable day',
      sub: 'Recognition & networking',
    },
  ];

  return (
    <section id="night" className="relative overflow-hidden bg-ink">
      {/* Cinematic backdrop */}
      <div className="absolute inset-0">
        <Image
          src={IMG(IMAGES.heroStage, 1280, 55)}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1280px"
          quality={50}
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/85 to-ink" />
      </div>

      <div className="container-luxe section-pad relative py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          {/* LEFT — headline + facts */}
          <Reveal>
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-gold/60" />
              The Awards Ceremony
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] text-white text-balance">
              One day.{' '}
              <span className="text-gold-shimmer">A career-defining moment.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65 text-balance">
              Winners are revealed at an awards ceremony in {city} — a day of
              celebration, high-calibre networking and the kind of recognition you
              remember for a lifetime.
            </p>

            <RevealGroup className="mt-10 grid gap-3 sm:grid-cols-2" stagger={0.06}>
              {facts.map((f) => (
                <RevealItem key={f.sub}>
                  <div className="flex h-full items-start gap-3 rounded-2xl glass px-4 py-4">
                    <f.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                    <div>
                      <p className="text-sm font-semibold leading-snug text-white">{f.label}</p>
                      <p className="mt-0.5 text-xs text-white/45">{f.sub}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Reveal>

          {/* RIGHT — countdown panel */}
          <Reveal delay={0.15}>
            <div className="rounded-3xl glass p-7 sm:p-9">
              {site.event_date_iso ? (
                <Countdown
                  deadline={site.event_date_iso}
                  variant="panel"
                  label="Ceremony begins in"
                  closedLabel="The ceremony has taken place"
                />
              ) : (
                <p className="text-center font-display text-xl font-semibold text-white">
                  Ceremony date announced soon
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <PrimaryButton href="/venue" size="lg" className="w-full">
                  Explore the event
                </PrimaryButton>
                <GhostButton href="/tickets" size="lg" className="w-full">
                  Enquire about a table
                </GhostButton>
              </div>

              <p className="mt-6 text-center text-xs text-white/40">
                <span className="font-semibold text-gold">{site.year}</span> · Inaugural edition
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
