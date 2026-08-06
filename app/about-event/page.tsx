import type { Metadata } from 'next';
import { CalendarDays, Check, CreditCard, MapPin, Target, Ticket } from 'lucide-react';
import { getSite } from '@/lib/site';
import { buildJourney, IMAGES } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { PageCloser } from '@/components/sections/PageCloser';
import { PreLaunchSection } from '@/components/sections/PreLaunchSection';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'About Event',
    description: `What the ${site.name} ${site.year} is, who it is for, how to book, and how the awards process works from entry to ceremony.`,
  };
}

const REQUIREMENTS = [
  'Entries may be submitted directly by the business or by a third party acting on its behalf.',
  'Nominees must confirm they wish to proceed before an entry is judged.',
  'Evidence should relate to the last 24 months unless a category states otherwise.',
  'Entrants may enter as many categories as genuinely apply, at no cost.',
  'Anything commercially sensitive can be marked confidential and is seen only by the panel.',
  'Judges declare conflicts of interest and are recused from scoring connected entries.',
];

const BOOKING = [
  { icon: Ticket, title: 'Finalists are invited', body: 'Every finalist receives an invitation to the ceremony automatically.' },
  { icon: CalendarDays, title: 'Tables open next', body: 'Full tables of ten are released to entrants and partners once finalists are set.' },
  { icon: CreditCard, title: 'Invoiced, not carted', body: 'Bookings are invoiced on confirmation — no card details are taken on this site.' },
];

export default async function AboutEventPage() {
  const site = await getSite();
  const journey = buildJourney(
    site.venue_short ?? site.venue ?? '',
    site.event_date_long ?? '',
  );

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            Welcome to the{' '}
            <span className="text-gold-gradient">{site.name}</span>
          </>
        }
        subtitle={site.tagline ?? undefined}
        image={IMAGES.conferenceCrowd}
      />

      {/* Pre-launch sign-up sits above The Mission here, not in PageCloser at
          the foot of the page — the places are limited, so the ask comes before
          the background rather than after it. PageCloser is told to skip it
          below so it isn't rendered twice. */}
      <PreLaunchSection />

      {/* The mission */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <span className="eyebrow mb-4">
                <span className="h-px w-6 bg-gold/60" />
                The Mission
              </span>
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">
                An epicentre of <span className="text-gold-gradient">property excellence</span>
              </h2>
              <div className="mt-5 space-y-4 leading-relaxed text-white/60">
                <p>
                  Property is judged in public and rewarded in private. Deals close, schemes
                  complete, tenants move in — and the people who made it happen go straight on to
                  the next one without anyone marking the moment.
                </p>
                <p>
                  The {site.name} exist to mark it. One day a year where the standard is set
                  out loud, in front of the people whose opinion actually counts: your peers,
                  your clients and your competitors.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl glass p-6">
                  <CalendarDays className="h-5 w-5 text-gold" />
                  <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                    When
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">
                    {site.event_date_long ?? site.event_date ?? 'To be announced'}
                  </p>
                </div>
                <div className="rounded-2xl glass p-6">
                  <MapPin className="h-5 w-5 text-gold" />
                  <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                    Where
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">
                    {site.venue_short ?? 'To be announced'}
                  </p>
                </div>
                <div className="rounded-2xl glass p-6">
                  <Target className="h-5 w-5 text-gold" />
                  <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                    Entry fee
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">Free</p>
                </div>
                <div className="rounded-2xl glass p-6">
                  <Ticket className="h-5 w-5 text-gold" />
                  <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                    Deadline
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">
                    {site.event_deadline_label ?? 'To be announced'}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Booking tickets & payment options */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Booking Tickets"
            title={
              <>
                How to be <span className="text-gold-gradient">in the room</span>
              </>
            }
            subtitle="Entering and attending are separate decisions. You can do either, both, or enter and decide later."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-3" stagger={0.07}>
            {BOOKING.map((b) => (
              <RevealItem key={b.title}>
                <div className="h-full rounded-2xl glass p-7">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <b.icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{b.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.15} className="mt-10 flex flex-wrap justify-center gap-3">
            <PrimaryButton href="/tickets" size="md">
              Ticket options
            </PrimaryButton>
            <GhostButton href="/venue" size="md">
              Venue &amp; schedule
            </GhostButton>
          </Reveal>
        </div>
      </section>

      {/* Key requirements */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Key Requirements"
            title={
              <>
                What we ask of <span className="text-gold-gradient">every entry</span>
              </>
            }
            subtitle="Short list, no small print. These apply across all categories."
          />
          <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
            <ul className="grid gap-4 sm:grid-cols-2">
              {REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-start gap-3 rounded-2xl glass p-5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-gradient">
                    <Check className="h-3 w-3 text-ink" />
                  </span>
                  <span className="text-sm leading-relaxed text-white/70">{r}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Our process */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Our Process"
            title={
              <>
                Six steps from <span className="text-gold-gradient">entry to ovation</span>
              </>
            }
            subtitle="The same path for everyone, whether you enter on the first day or the last."
          />
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
            {journey.map((s) => (
              <RevealItem key={s.step}>
                <div className="h-full rounded-2xl glass p-7">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-semibold text-gold-gradient tabular-nums">
                      {s.step}
                    </span>
                    <Icon name={s.icon as IconName} className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{s.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <CtaBand />
      <PageCloser withPreLaunch={false} />
    </main>
  );
}
