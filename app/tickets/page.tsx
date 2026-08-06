import type { Metadata } from 'next';
import { Check, CreditCard, Landmark, Receipt } from 'lucide-react';
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
    title: 'Tickets',
    description: `Tickets and tables for the ${site.name} ${site.year} awards ceremony — individual seats, tables of ten and hospitality packages.`,
  };
}

const OPTIONS = [
  {
    name: 'Individual Seat',
    lede: 'One place at a shared table.',
    features: [
      'Drinks reception on arrival',
      'Three-course dinner',
      'Full awards presentation',
      'Post-ceremony networking',
    ],
    featured: false,
  },
  {
    name: 'Table of Ten',
    lede: 'Your own table for the team or clients.',
    features: [
      'Ten seats together, named',
      'Table branding with your business name',
      'Priority seating in the room',
      'Drinks reception, dinner and networking',
      'Winners photography included',
    ],
    featured: true,
  },
  {
    name: 'Hospitality Package',
    lede: 'A table plus visibility across the day.',
    features: [
      'Everything in Table of Ten',
      'Logo on the event programme',
      'Mention from the stage',
      'Photography and content pack afterwards',
    ],
    featured: false,
  },
];

const PAYMENT_METHODS = [
  { icon: Landmark, title: 'Bank transfer', body: 'Invoice raised on confirmation, payable by BACS.' },
  { icon: CreditCard, title: 'Card payment', body: 'A secure payment link is issued with your invoice.' },
  { icon: Receipt, title: 'VAT receipt', body: 'A receipted VAT invoice follows every completed booking.' },
];

export default async function TicketsPage() {
  const site = await getSite();

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            Ticket <span className="text-gold-gradient">options</span>
          </>
        }
        subtitle={`Seats and tables for the ${site.name} ${site.year} ceremony${
          site.venue_short ? ` at ${site.venue_short}` : ''
        }. Entering is free — attending is optional.`}
        image={IMAGES.galaTable}
      />

      {/* Options */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Ticket Options"
            title={
              <>
                Come alone, or bring <span className="text-gold-gradient">the whole team</span>
              </>
            }
            subtitle="Prices are confirmed with your enquiry — they depend on the final venue package, so we would rather quote you properly than post a number that moves."
          />

          <RevealGroup className="mt-14 grid gap-5 lg:grid-cols-3" stagger={0.08}>
            {OPTIONS.map((o) => (
              <RevealItem key={o.name}>
                <div
                  className={`flex h-full flex-col rounded-3xl p-8 transition-colors duration-300 ${
                    o.featured
                      ? 'glass-gold shadow-gold'
                      : 'glass hover:border-gold/30'
                  }`}
                >
                  {o.featured && (
                    <span className="mb-4 inline-flex w-fit rounded-full bg-ink/40 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-luxe text-gold">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-semibold text-white">{o.name}</h3>
                  <p className="mt-2 text-sm text-white/55">{o.lede}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {o.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-gradient">
                          <Check className="h-3 w-3 text-ink" />
                        </span>
                        <span className="text-sm leading-relaxed text-white/70">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <PrimaryButton href="/contact" size="md" className="w-full">
                      Enquire
                    </PrimaryButton>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Payment */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Setup payment with"
            title={
              <>
                Simple, <span className="text-gold-gradient">invoiced</span> booking
              </>
            }
            subtitle="No card details are taken on this site. Everything runs through an invoice so your finance team has what it needs."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-3" stagger={0.07}>
            {PAYMENT_METHODS.map((p) => (
              <RevealItem key={p.title}>
                <div className="h-full rounded-2xl glass p-7">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <p.icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.15} className="mx-auto mt-12 max-w-2xl text-center">
            <p className="text-sm text-white/50">
              Sponsoring instead of buying a table? Partner packages include seats.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <GhostButton href="/sponsors" size="md">
                Want to become a sponsor?
              </GhostButton>
              <GhostButton href="/venue" size="md">
                Venue &amp; schedule
              </GhostButton>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Enter first — finalists are invited"
        text="Every finalist gets an invitation to the ceremony. Entering costs nothing, so start there before you book a seat."
      />
      <PageCloser />
    </main>
  );
}
