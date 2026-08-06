import type { Metadata } from 'next';
import { Award, Scale, Sparkles } from 'lucide-react';
import { getSite, getSiteId } from '@/lib/site';
import { nomineesAtStage } from '@/lib/nominees';
import { IMAGES } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { NomineeGrid } from '@/components/NomineeGrid';
import { SelectionProcess } from '@/components/sections/SelectionProcess';
import { PageCloser } from '@/components/sections/PageCloser';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Finalists',
    description: `The finalists for the ${site.name} ${site.year} — the highest-scoring entries, announced ahead of the ceremony.`,
  };
}

const FINALIST_JOURNEY = [
  {
    icon: Scale,
    title: 'Scored, then scored again',
    body: 'Reaching the final means two independent judges rated your evidence highly and a moderator agreed with both of them.',
  },
  {
    icon: Award,
    title: 'A mark you keep',
    body: 'Finalist status is yours whatever happens on the day — including the digital mark and a place in the published list.',
  },
  {
    icon: Sparkles,
    title: 'An invitation to the ceremony',
    body: 'Every finalist is invited to the ceremony, where the winner in each category is revealed live.',
  },
];

export default async function FinalistsPage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);
  const nominees = await nomineesAtStage(siteId, 'finalist');

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            The <span className="text-gold-gradient">Finalists</span>
          </>
        }
        subtitle={`The highest-scoring entries across every category of the ${site.name} ${site.year}.`}
        image={IMAGES.confetti}
      />

      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <NomineeGrid
            nominees={nominees}
            emptyTitle="Finalists are still to be announced"
            emptyBody="Finalists are revealed once judging is complete, ahead of the ceremony. Entries are still open — this list is not closed yet."
          />
        </div>
      </section>

      {/* The finalist journey */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="The Finalist Journey"
            title={
              <>
                A mark of <span className="text-gold-gradient">excellence</span>
              </>
            }
            subtitle="Being named a finalist is not a consolation for not winning. It is a scored, independent verdict that your work stands with the best in the industry."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-3" stagger={0.08}>
            {FINALIST_JOURNEY.map((s) => (
              <RevealItem key={s.title}>
                <div className="h-full rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <s.icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{s.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <SelectionProcess
        eyebrow="Our Finalist Judging Process"
        title="How a finalist is chosen"
        subtitle="The same framework applies at every stage — what changes is how many judges have looked at the entry and how closely the scores are moderated."
      />
      <PageCloser />
    </main>
  );
}
