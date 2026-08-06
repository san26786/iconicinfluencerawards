import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { FindMyAward } from '@/components/sections/FindMyAward';
import { CtaBand } from '@/components/CtaBand';
import { getSite } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Which Award Fits You?',
    description: `Answer a few quick questions and we will match you to the ${site.name} categories most likely to fit your nomination.`,
  };
}

export default function FindMyAwardPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Find My Award"
        title={
          <>
            Not sure which award{' '}
            <span className="text-gold-gradient">fits you?</span>
          </>
        }
        subtitle="Answer a few quick questions and we’ll match you to the categories most likely to fit your nomination. Takes under a minute."
      />
      {/* The matcher section, identical to the one featured on the home page. */}
      <FindMyAward />
      <CtaBand />
    </main>
  );
}
