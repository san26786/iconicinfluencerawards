import type { Metadata } from 'next';
import { getSite, getSiteId } from '@/lib/site';
import { nomineesAtStage } from '@/lib/nominees';
import { IMAGES } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { NomineeGrid } from '@/components/NomineeGrid';
import { SelectionProcess } from '@/components/sections/SelectionProcess';
import { PageCloser } from '@/components/sections/PageCloser';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Semifinalists',
    description: `The semifinalists for the ${site.name} ${site.year} — the entries that came through moderation and into the second round of judging.`,
  };
}

export default async function SemifinalistsPage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);
  const nominees = await nomineesAtStage(siteId, 'semifinalist');

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            The <span className="text-gold-gradient">Semifinalists</span>
          </>
        }
        subtitle={`Shortlisted entries are re-scored and moderated across the panel. These are the ${site.name} entries that came through that second round.`}
        image={IMAGES.conferenceCrowd}
      />

      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <NomineeGrid
            nominees={nominees}
            emptyTitle="Semifinalists are still to be announced"
            emptyBody="The semifinalists are drawn from the shortlist once the panel has moderated its scores. They will be published here as soon as that round closes."
          />
        </div>
      </section>

      <SelectionProcess
        subtitle="Semifinalists are chosen by score, not by reputation. Each shortlisted entry is reviewed a second time by a different judge, and the two scores are moderated before anyone progresses."
      />
      <PageCloser />
    </main>
  );
}
