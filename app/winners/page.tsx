import type { Metadata } from 'next';
import { EyeOff, FileCheck2, Lock } from 'lucide-react';
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
    title: 'Winners',
    description: `The winners of the ${site.name} ${site.year}, revealed live at the awards ceremony.`,
  };
}

const INTEGRITY = [
  {
    icon: Lock,
    title: 'Sealed until the ceremony',
    body: 'Results are locked once moderation closes. Nobody outside the judging panel sees them before they are read out.',
  },
  {
    icon: EyeOff,
    title: 'Declared conflicts',
    body: 'Judges declare any commercial or personal connection to an entrant and are recused from scoring it.',
  },
  {
    icon: FileCheck2,
    title: 'Evidence on the record',
    body: 'Every result traces back to a scored entry against published criteria. There is no discretionary override.',
  },
];

export default async function WinnersPage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);
  const nominees = await nomineesAtStage(siteId, 'winner');

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            The <span className="text-gold-gradient">Winners</span>
          </>
        }
        subtitle={`Winners of the ${site.name} ${site.year} are revealed live at the ceremony and published here immediately afterwards.`}
        image={IMAGES.galaTable}
      />

      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <NomineeGrid
            nominees={nominees}
            emptyTitle="Winners are revealed on the day"
            emptyBody={`Results stay sealed until they are read out at the ceremony${
              site.event_date ? ` on ${site.event_date}` : ''
            }. This page fills in the moment they are announced.`}
          />
        </div>
      </section>

      {/* The integrity of the result */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="The Integrity of the Result"
            title={
              <>
                A result that <span className="text-gold-gradient">holds up</span>
              </>
            }
            subtitle="An award is only worth what stands behind it. Here is exactly what stands behind ours."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-3" stagger={0.08}>
            {INTEGRITY.map((s) => (
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

      <SelectionProcess />
      <PageCloser />
    </main>
  );
}
