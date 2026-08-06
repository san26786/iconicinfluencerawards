import type { Metadata } from 'next';
import { getSite } from '@/lib/site';
import { IMAGES } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { Sponsors } from '@/components/sections/Sponsors';
import { SponsorForm } from '@/components/SponsorForm';
import { PageCloser } from '@/components/sections/PageCloser';
import { Reveal } from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Sponsors',
    description: `Sponsor the ${site.name} ${site.year}. Put your brand in front of the agencies, developers, investors and property professionals shaping the industry.`,
  };
}

export default async function SponsorsPage() {
  const site = await getSite();

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            Our distinguished <span className="text-gold-gradient">partners</span>
          </>
        }
        subtitle={`Partners of the ${site.name} are not logos on a banner — they are the organisations that make an independent, free-to-enter awards programme possible.`}
        image={IMAGES.handshake}
      />

      {/* Founding-partner perks — the same band the homepage used to carry */}
      <Sponsors />

      {/* Enquiry form */}
      <section id="become-a-sponsor" className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="eyebrow justify-center mb-4">
              <span className="h-px w-6 bg-gold/60" />
              Become a Sponsor
            </span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">
              Request the <span className="text-gold-gradient">sponsorship pack</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-white/60">
              Tell us what you are hoping to get out of it and we will send the options that
              actually fit — headline, category, hospitality or media.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="mx-auto mt-12 max-w-3xl">
            <div className="rounded-3xl glass p-6 sm:p-8">
              <SponsorForm siteName={site.name} />
            </div>
          </Reveal>
        </div>
      </section>

      <PageCloser />
    </main>
  );
}
