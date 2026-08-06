// Server component — no state, refs or browser APIs. The Reveal children
// remain client-side islands; this wrapper stays static markup.
import { Award, Eye, HeartHandshake } from 'lucide-react';
import { SITE } from '@/lib/content';
import { getSite } from '@/lib/site';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';
import { PrimaryButton } from '../ui/Button';

// Built per request — two of these lines name the awards and the city, so they
// can't be a module-level constant on a multi-tenant site.
const buildPerks = (siteName: string, eventCity: string) => [
  {
    icon: Award,
    title: 'Founding Partner Status',
    body: `Be recognised as one of the organisations that launched ${siteName} — a legacy that stays with your brand.`,
  },
  {
    icon: Eye,
    title: 'Premier Visibility',
    body: 'Year-round exposure across the campaign, the gala and our press and social reach, in front of the agencies, developers and specialists shaping the industry.',
  },
  {
    icon: HeartHandshake,
    title: 'Champion Local Business',
    body: eventCity
      ? `Show the community you back the people and businesses that make ${eventCity} thrive.`
      : 'Show the community you back the people and businesses that make the region thrive.',
  },
];

export async function Sponsors() {
  const site = await getSite();
  const PERKS = buildPerks(site.name, site.event_city ?? '');
  return (
    <section id="sponsors" className="relative overflow-hidden bg-slate950 py-24 lg:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[140px] hidden sm:block" />
      <div className="container-luxe section-pad relative">
        <SectionHeading
          eyebrow="Founding Partners"
          title={
            <>
              Help launch the <span className="text-gold-gradient">first chapter</span>
            </>
          }
          subtitle={
            site.event_city
              ? `Our inaugural year is an open invitation. Founding partners will be remembered as the organisations that helped create ${site.event_city}’s defining celebration of business.`
              : 'Our inaugural year is an open invitation. Founding partners will be remembered as the organisations that helped create the region’s defining celebration of business.'
          }
        />

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {PERKS.map((p) => (
            <RevealItem key={p.title}>
              <div className="group h-full rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                  <p.icon className="h-6 w-6 text-ink" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-white/55">
            Align your brand with prestige, reach and community impact from the very beginning.
          </p>
          <PrimaryButton href={SITE.partnerUrl}>Become a Founding Partner</PrimaryButton>
        </Reveal>
      </div>
    </section>
  );
}
