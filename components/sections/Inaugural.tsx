// Server component — pure render, no client-side state. Reveal children
// remain client islands; this wrapper ships as static markup.
import { Crown, Target, Flag } from 'lucide-react';
import { SITE, REASSURE } from '@/lib/content';
import { getSite } from '@/lib/site';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';
import { PrimaryButton } from '../ui/Button';

// Built per request — the first line names the awards, so it can't be a
// module-level constant on a multi-tenant site.
const buildPoints = (siteName: string) => [
  {
    icon: Crown,
    title: 'Founding-Year Prestige',
    body: `Be remembered as a winner of the very first ${siteName} — a distinction no one who comes after can ever claim.`,
  },
  {
    icon: Target,
    title: 'Set the Standard',
    body: 'As an inaugural winner, your business becomes the benchmark every future entrant aspires to match.',
  },
  {
    icon: Flag,
    title: 'Only Ever One First',
    body: 'There is just one inaugural edition. Once it has been held it can never be entered again — this moment does not come back.',
  },
];

export async function Inaugural() {
  const site = await getSite();
  const POINTS = buildPoints(site.name);
  return (
    <section id="inaugural" className="relative overflow-hidden bg-ink py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-rule" />
      <div className="pointer-events-none absolute -right-20 top-10 h-[30rem] w-[30rem] rounded-full bg-gold/10 blur-[150px] hidden sm:block" />
      <div className="container-luxe section-pad relative">
        <SectionHeading
          eyebrow={`The Inaugural Edition · ${site.year}`}
          title={
            <>
              Be among the <span className="text-gold-gradient">very first</span>
            </>
          }
          subtitle={`This is our first celebration of property excellence — and the rarest edition there will ever be. The founding class of ${site.year} won’t be following a benchmark. They’ll be the benchmark.`}
        />

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {POINTS.map((p) => (
            <RevealItem key={p.title}>
              <article className="group relative h-full overflow-hidden rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 hidden sm:block" />
                <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <p.icon className="h-6 w-6 text-ink" />
                </span>
                <h3 className="relative mt-6 font-display text-xl font-semibold text-white">{p.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-white/55">{p.body}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-12 flex flex-col items-center gap-3 text-center">
          <PrimaryButton href={SITE.nominateUrl}>Claim Your Place in Year One</PrimaryButton>
          <p className="text-xs text-white/45">{REASSURE}</p>
        </Reveal>
      </div>
    </section>
  );
}
