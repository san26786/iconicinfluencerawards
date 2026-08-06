import { WHY_CARDS } from '@/lib/content';
import { Icon, type IconName } from '../ui/Icon';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

// `band-light` makes this one of the cream bands in the page's dark/light
// rhythm — see the .band-light rules in globals.css.
export function WhyWin() {
  return (
    <section id="why" className="band-light relative py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-rule" />
      <div className="container-luxe section-pad">
        <SectionHeading
          eyebrow="Why enter"
          title={
            <>
              Recognition that <span className="text-gold-gradient">works</span> for your business
            </>
          }
          subtitle="An award is more than a trophy. It is independent proof of excellence that compounds across brand, sales, talent and growth."
        />

        <Reveal className="mx-auto mt-6 max-w-3xl text-center">
          <p className="text-base leading-relaxed text-white/55 text-balance">
            Every firm in this industry has a story worth telling — the instruction nobody else
            could win, the site nobody else would touch, the team that stayed when it would have
            been easier to leave. Whether you are an emerging agency, an established developer or
            a specialist nobody outside the trade has heard of yet, this is your opportunity to
            gain the recognition your work deserves.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {WHY_CARDS.map((card) => (
            <RevealItem key={card.title}>
              <WhyCard {...card} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function WhyCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl glass p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/30">
      {/* hover glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 hidden sm:block" />

      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        <Icon name={icon as IconName} className="h-6 w-6 text-ink" />
      </span>

      <h3 className="relative mt-6 font-display text-xl font-semibold text-white">{title}</h3>
      <p className="relative mt-3 text-sm leading-relaxed text-white/55">{body}</p>

      <div className="relative mt-6 h-px w-full bg-white/5">
        <div className="h-px w-0 bg-gold-gradient transition-all duration-500 group-hover:w-full" />
      </div>
    </div>
  );
}
