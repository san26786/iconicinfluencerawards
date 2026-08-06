import type { Metadata } from 'next';
import Link from 'next/link';
import { Megaphone, Users, HeartHandshake, BarChart3 } from 'lucide-react';
import { IMAGES, SITE } from '@/lib/content';
import { getSite } from '@/lib/site';
import { PageHero } from '@/components/PageHero';
import { SponsorForm } from '@/components/SponsorForm';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Partner & Sponsor',
  description:
    'Partner with the Property Excellence Awards. Put your brand centre stage in front of the industry’s most ambitious agencies, developers and specialists through sponsorship, hospitality and media.',
};

const REASONS = [
  {
    icon: Users,
    title: 'Reach Decision-Makers',
    body: 'Connect with founders, leaders and investors from across the industry in one unforgettable day.',
  },
  {
    icon: Megaphone,
    title: 'Brand Visibility',
    body: 'Year-round exposure across the campaign, the gala and our press and social reach.',
  },
  {
    icon: HeartHandshake,
    title: 'Community Leadership',
    body: 'Show your commitment to the businesses and people that make the property industry thrive.',
  },
  {
    icon: BarChart3,
    title: 'Measurable Impact',
    body: 'Hospitality, lead generation and association with excellence that drives real return.',
  },
];

export default async function PartnerPage() {
  const site = await getSite();
  return (
    <main id="main">
      <PageHero
        eyebrow="Partnership 2026"
        title={
          <>
            Put your brand <span className="text-gold-gradient">centre stage</span>
          </>
        }
        subtitle="Align your name with the region’s most prestigious celebration of business. Sponsorship, hospitality, media and partnership opportunities to suit every ambition."
        image={IMAGES.conferenceCrowd}
      />

      {/* Why partner */}
      <section className="relative bg-ink py-16 lg:py-20">
        <div className="container-luxe section-pad">
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
            {REASONS.map((r) => (
              <RevealItem key={r.title}>
                <div className="h-full rounded-2xl glass p-6 transition-colors duration-300 hover:border-gold/30">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <r.icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{r.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{r.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Form */}
      <section className="relative overflow-hidden bg-slate950 py-16 lg:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[150px] hidden sm:block" />
        <div className="container-luxe section-pad relative mx-auto max-w-3xl">
          <Reveal className="text-center">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              Partnership Enquiry
            </span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-white text-balance sm:text-4xl">
              Let us build the right package <span className="text-gold-gradient">together</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/65 text-balance">
              Share a few details and our partnerships team will prepare a tailored proposal aligned
              to your goals and budget.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <SponsorForm siteName={site.name} />
          </Reveal>

          <p className="mt-6 text-center text-sm text-white/50">
            Here to enter the awards instead?{' '}
            <Link href={SITE.nominateUrl} className="font-medium text-gold transition-colors hover:underline">
              Start your free entry →
            </Link>
          </p>
        </div>
      </section>

      {/* Reassurance */}
      <section className="relative bg-ink py-20 lg:py-24">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Founding Year"
            title={
              <>
                Shape the <span className="text-gold-gradient">inaugural year</span>
              </>
            }
            subtitle={`Be one of the founding partners bringing ${site.name} to life at ${site.venue}.`}
          />
        </div>
      </section>
    </main>
  );
}
