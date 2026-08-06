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
    title: 'Shortlists',
    description: `The shortlisted entries for the ${site.name} ${site.year} — the first stage of an independent, evidence-led judging process.`,
  };
}

export default async function ShortlistsPage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);
  const nominees = await nomineesAtStage(siteId, 'shortlisted');

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            The <span className="text-gold-gradient">Shortlist</span>
          </>
        }
        subtitle={`Every entry to the ${site.name} ${site.year} is read and scored. These are the entries that made the first cut.`}
        image={IMAGES.venueSeats}
      />

      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <NomineeGrid
            nominees={nominees}
            emptyTitle="The shortlist is not out yet"
            emptyBody="Judging opens once entries close. The shortlisted entries are published here first — and there is still time to be on it."
          />
        </div>
      </section>

      <SelectionProcess />
      <PageCloser />
    </main>
  );
}
