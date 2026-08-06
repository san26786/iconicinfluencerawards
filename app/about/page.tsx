import type { Metadata } from 'next';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { IMG, IMAGES, STATS } from '@/lib/content';
import { getSite } from '@/lib/site';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Counter';
import { Icon, type IconName } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About the Property Excellence Awards — an independent, judge-led celebration of the agencies, developers, specialists and people setting the standard across the property industry.',
};

const PILLARS = [
  { icon: 'Trophy', title: 'Property Excellence', body: 'Honouring the firms setting the standard across agency, development and property services.' },
  { icon: 'Lightbulb', title: 'Innovation', body: 'Championing the PropTech, products and thinking that move a traditional industry forward.' },
  { icon: 'Star', title: 'Leadership', body: 'Celebrating the entrepreneurs, agents and leaders with the vision to raise the bar.' },
  { icon: 'HeartHandshake', title: 'Community Impact', body: 'Recognising the schemes and programmes that visibly strengthen the places they touch.' },
  { icon: 'Megaphone', title: 'Publicity & Profile', body: 'Putting deserving firms in the spotlight through trade media and award promotion.' },
  { icon: 'TrendingUp', title: 'Growth', body: 'Creating the connections and credibility that open doors to new instructions and investment.' },
];

export default async function AboutPage() {
  const site = await getSite();

  // The venue line names the real ceremony location, so it is built from the
  // site row rather than hardcoded alongside the other commitments.
  const commitments = [
    'Free to enter, with a category for every kind of property business',
    'Independent, impartial judging of every entry',
    site.venue
      ? `A gala celebration at ${site.venue}`
      : 'A gala celebration — venue announced soon',
    'Year-round recognition that builds lasting credibility',
  ];

  return (
    <main id="main">
      <PageHero
        eyebrow="About The Awards"
        title={
          <>
            Championing the businesses that{' '}
            <span className="text-gold-gradient">shape the property industry</span>
          </>
        }
        subtitle={`The ${site.name} exist to recognise, reward and celebrate the agencies, developers, specialists and people raising the standard across property.`}
        image={IMAGES.stageSpeaker}
      />

      {/* Mission split */}
      <section className="relative overflow-hidden bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={IMG(IMAGES.networking, 1100, 80)}
                alt="Business leaders connecting at the awards"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -right-4 hidden glass-gold rounded-2xl px-6 py-5 shadow-gold sm:block lg:-right-8">
              <p className="font-display text-3xl font-semibold text-gold-gradient">2026</p>
              <p className="text-[0.65rem] uppercase tracking-wider text-white/60">A new class of winners</p>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <span className="eyebrow mb-4">
                <span className="h-px w-6 bg-gold/60" />
                Our Purpose
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-white text-balance">
                Recognition that firms are <span className="text-gold-gradient">proud to earn</span>
              </h2>
              <div className="mt-5 space-y-4 text-white/65 leading-relaxed">
                <p>
                  Property is an industry of long hours and hard-won results — the negotiator who
                  saves a chain, the developer who unlocks a difficult site, the team that turns a
                  neglected building into somewhere people want to be. Too often, that work goes
                  uncelebrated.
                </p>
                <p>
                  The {site.name} change that. We bring the industry together to recognise
                  excellence, share what good actually looks like, and give hard-working teams a
                  moment they will never forget.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="mt-8 space-y-3">
              {commitments.map((c) => (
                <div key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-gradient">
                    <Check className="h-3.5 w-3.5 text-ink" />
                  </span>
                  <span className="text-white/75">{c}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* What we celebrate */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="What We Celebrate"
            title={
              <>
                Six pillars of <span className="text-gold-gradient">property excellence</span>
              </>
            }
            subtitle="Every award is built around the qualities that define a truly outstanding property business."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
            {PILLARS.map((p) => (
              <RevealItem key={p.title}>
                <div className="group h-full rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <Icon name={p.icon as IconName} className="h-6 w-6 text-ink" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Stats band */}
      <section className="relative overflow-hidden bg-ink py-16 lg:py-20">
        <div className="container-luxe section-pad">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl glass lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/[0.015] p-7 text-center">
                <div className="font-display text-4xl font-semibold text-gold-gradient">
                  <Counter value={s.value} suffix={s.suffix} />
                </div>
                <p className="mt-2 text-xs uppercase tracking-wider text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-white/45">
            The inaugural celebration, live at {site.venue}.
          </p>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
