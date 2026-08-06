import type { Metadata } from 'next';
import { getSite } from '@/lib/site';
import { PreLaunchSection } from '@/components/sections/PreLaunchSection';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Join the Pre-Launch',
    description: `Register your interest in the ${site.name} Pre-Launch. Be among the first to secure your place at ${site.venue_short ?? site.name}.`,
  };
}

export default function PreLaunchPage() {
  return (
    <main id="main" className="pt-20">
      <PreLaunchSection />
    </main>
  );
}
