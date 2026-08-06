import type { Metadata } from 'next';
import { MessageSquareQuote, ThumbsUp } from 'lucide-react';
import { getSite } from '@/lib/site';
import { buildJourney, IMAGES, WHY_CARDS } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { SelectionProcess } from '@/components/sections/SelectionProcess';
import { PageCloser } from '@/components/sections/PageCloser';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'View Application',
    description: `What an entry to the ${site.name} involves — the sections you complete, how it is judged, and how to gather votes and testimonials in support.`,
  };
}

const SECTIONS = [
  { title: 'About you', body: 'Contact details, the business, and which categories you are entering.' },
  { title: 'Eligibility', body: 'A short set of multiple-choice questions confirming the category fits.' },
  { title: 'Your evidence', body: 'The written answers judges score — four per category, around 400 words each.' },
  { title: 'Supporting material', body: 'Logo, images, and any documents that back up the claims you have made.' },
  { title: 'Trophy details', body: 'The inscription used if you win, so nothing has to be chased later.' },
  { title: 'Review & submit', body: 'A full preview of the entry before anything is sent. You can edit up to the deadline.' },
];

export default async function ViewApplicationPage() {
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
            About the <span className="text-gold-gradient">awards entry</span>
          </>
        }
        subtitle={`Exactly what an entry to the ${site.name} asks for, what happens to it afterwards, and how long it takes. No surprises before you start.`}
        image={IMAGES.analytics}
      />

      {/* What the application contains */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="The Application"
            title={
              <>
                Six sections, about <span className="text-gold-gradient">ten minutes</span>
              </>
            }
            subtitle="You can save and come back at any point — nothing is submitted until you press submit on the final review screen."
          />
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {SECTIONS.map((s, i) => (
              <RevealItem key={s.title}>
                <div className="h-full rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                  <span className="font-display text-2xl font-semibold text-gold-gradient tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{s.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.15} className="mt-10 flex flex-wrap justify-center gap-3">
            <PrimaryButton href="/register-interest" size="md">
              Start your free entry
            </PrimaryButton>
            <GhostButton href="/nomination-guideline" size="md">
              Read the nomination guideline
            </GhostButton>
          </Reveal>
        </div>
      </section>

      <SelectionProcess
        eyebrow="Our Process"
        title="A rigorous & independent selection"
        subtitle="Once submitted, your entry leaves your hands entirely. Here is what happens to it."
      />

      {/* Our process — the six-step journey */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="What Happens Next"
            title={
              <>
                From submission to <span className="text-gold-gradient">the stage</span>
              </>
            }
          />
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
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

      {/* Why enter */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Why enter?"
            title={
              <>
                What an entry is <span className="text-gold-gradient">actually worth</span>
              </>
            }
            subtitle="Even an entry that does not win leaves you with a written, evidenced account of your best work — useful long after the day."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
            {WHY_CARDS.map((c) => (
              <RevealItem key={c.title}>
                <div className="h-full rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <Icon name={c.icon as IconName} className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{c.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Votes & testimonials */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl glass p-8">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                  <ThumbsUp className="h-5 w-5 text-ink" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold text-white">
                  Application vote request
                </h3>
                <p className="mt-3 leading-relaxed text-white/60">
                  Once your entry is in, you can share a public vote link with clients and
                  colleagues. Votes are a measure of visible support — they sit alongside the
                  judges&apos; scores and never replace them.
                </p>
                <p className="mt-4 text-sm text-white/45">
                  Vote links are generated from your account after you submit.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="h-full rounded-3xl glass p-8">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                  <MessageSquareQuote className="h-5 w-5 text-ink" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold text-white">
                  Application testimonial request
                </h3>
                <p className="mt-3 leading-relaxed text-white/60">
                  Ask a client to write a short testimonial directly against your entry. A named,
                  specific client quote is some of the strongest evidence you can attach — judges
                  weight it under Evidence Quality.
                </p>
                <p className="mt-4 text-sm text-white/45">
                  Testimonial requests are sent from your account after you submit.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBand
        title="Submit a nomination"
        text="Entering is free and takes about ten minutes. You can edit anything you submit right up to the deadline."
      />
      <PageCloser />
    </main>
  );
}
