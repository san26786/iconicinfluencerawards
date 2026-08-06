import type { Metadata } from 'next';
import { CalendarDays, CreditCard, MapPin, Ticket } from 'lucide-react';
import { getSite } from '@/lib/site';
import { IMAGES } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { PageCloser } from '@/components/sections/PageCloser';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Venue & Event Schedule',
    description: `Where and when the ${site.name} ${site.year} takes place — venue, running order and how to secure your seat.`,
  };
}

// Running order across the day. The ceremony runs 10:00–16:30 (CEREMONY_WINDOW)
// — a daytime programme, not an evening gala, so there is no dinner service or
// after-party here. The start and finish are confirmed; the beats in between are
// the standard shape and are settled with the venue nearer the date. Date and
// venue come off the site row.
const SCHEDULE = [
  { time: '10:00am', title: 'Doors & registration', body: 'Arrival, badge collection and welcome refreshments.' },
  { time: '10:30am', title: 'Welcome & opening address', body: 'The host opens the day and introduces the programme.' },
  { time: '11:00am', title: 'Awards presentation — first half', body: 'The opening categories announced live, one by one.' },
  { time: '12:30pm', title: 'Lunch & networking', body: 'Served lunch, with time to meet the room.' },
  { time: '1:30pm', title: 'Awards presentation — second half', body: 'The remaining categories, through to the headline award.' },
  { time: '3:00pm', title: 'Overall winner & photography', body: 'The headline award, then winners photography.' },
  { time: '3:30pm', title: 'Networking', body: 'Connections, press and the part everyone remembers.' },
  { time: '4:30pm', title: 'Close', body: 'Carriages.' },
];

const PAYMENT = [
  'Tables and individual seats are invoiced on confirmation.',
  'Payment by bank transfer or card; a receipted VAT invoice is issued for every booking.',
  'Names for each seat can be supplied any time up to two weeks before the ceremony.',
  'Dietary and accessibility requirements are collected with your guest names.',
];

export default async function VenuePage() {
  const site = await getSite();

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            The venue &amp; <span className="text-gold-gradient">event schedule</span>
          </>
        }
        subtitle={`Everything you need to plan the day — where the ${site.name} ${site.year} happens, how the day runs, and how to secure your place.`}
        image={IMAGES.venueSeats}
      />

      {/* The venue */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="The Venue"
            // With no venue named yet, "Venue, London" reads like a placeholder
            // that slipped through — so the city carries the heading on its own
            // until there is a venue to put in front of it.
            title={
              site.venue_short ? (
                <>
                  {site.venue_short}
                  {site.event_city ? (
                    <>
                      , <span className="text-gold-gradient">{site.event_city}</span>
                    </>
                  ) : null}
                </>
              ) : site.event_city ? (
                <span className="text-gold-gradient">{site.event_city}</span>
              ) : (
                'Venue to be announced'
              )
            }
            subtitle={site.venue ?? 'The venue for the inaugural ceremony is confirmed shortly.'}
          />

          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-3" stagger={0.07}>
            <RevealItem>
              <div className="h-full rounded-2xl glass p-6">
                <CalendarDays className="h-5 w-5 text-gold" />
                <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                  Date
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-white">
                  {site.event_date_long ?? site.event_date ?? 'To be announced'}
                </p>
              </div>
            </RevealItem>
            <RevealItem>
              <div className="h-full rounded-2xl glass p-6">
                <MapPin className="h-5 w-5 text-gold" />
                <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                  Address
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">
                  {site.venue ?? 'To be announced'}
                </p>
              </div>
            </RevealItem>
            <RevealItem>
              <div className="h-full rounded-2xl glass p-6">
                <Ticket className="h-5 w-5 text-gold" />
                <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                  Dress code
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-white">Black tie</p>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* Event schedule */}
      <section id="schedule" className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Event Schedule"
            title={
              <>
                How the <span className="text-gold-gradient">day runs</span>
              </>
            }
            subtitle="An indicative running order. Final timings are confirmed with your booking a fortnight before the ceremony."
          />

          <div className="mx-auto mt-14 max-w-3xl">
            <RevealGroup className="space-y-3" stagger={0.05}>
              {SCHEDULE.map((s) => (
                <RevealItem key={s.time}>
                  <div className="flex flex-col gap-2 rounded-2xl glass p-5 sm:flex-row sm:items-baseline sm:gap-6">
                    <span className="w-24 flex-shrink-0 font-display text-lg font-semibold text-gold tabular-nums">
                      {s.time}
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{s.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/55">{s.body}</span>
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Secure your presence + payment */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <span className="eyebrow mb-4">
                <span className="h-px w-6 bg-gold/60" />
                Secure Your Presence
              </span>
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">
                Seats go to <span className="text-gold-gradient">finalists first</span>
              </h2>
              <p className="mt-5 leading-relaxed text-white/60">
                Every finalist is invited. Remaining seats and full tables are released to
                entrants, partners and guests in that order — the room is smaller than the
                industry, so it does fill.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton href="/tickets" size="md">
                  Ticket options
                </PrimaryButton>
                <GhostButton href="/sponsors" size="md">
                  Become a sponsor
                </GhostButton>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="rounded-3xl glass p-7 sm:p-8">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gold" />
                  <h3 className="font-display text-xl font-semibold text-white">
                    Payment &amp; registration
                  </h3>
                </div>
                <ul className="mt-6 space-y-4">
                  {PAYMENT.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
                      <span className="text-sm leading-relaxed text-white/70">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBand
        title="Secure your seat at the table"
        text="Enter first — finalists are invited automatically. If you would rather come as a guest or bring a team, the ticket page has the options."
      />
      <PageCloser />
    </main>
  );
}
