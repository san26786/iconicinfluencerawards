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
              Recognition that <span className="text-gold-gradient">works</span> for your career
            </>
          }
          subtitle="An award is more than a trophy. It is independent proof of excellence that compounds across brand, sales, talent and growth."
        />

        <Reveal className="mx-auto mt-6 max-w-3xl text-center">
          <p className="text-base leading-relaxed text-white/55 text-balance">
            Every creator has a story worth telling — the video nobody else could make, the
            community nobody else could build, the collaboration that changed everything. Whether
            you are an emerging creator, an established personality or a specialist nobody outside
            your niche has discovered yet, this is your opportunity to gain the recognition your
            work deserves.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2" stagger={0.08}>
          {WHY_CARDS.map((card, i) => (
            <RevealItem key={card.title}>
              <WhyCard {...card} index={i} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function WhyCard({
  icon,
  title,
  body,
  index,
}: {
  icon: string;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <div className="group relative flex items-start gap-5 overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30">
      {/* hover glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 hidden sm:block" />

      <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        <Icon name={icon as IconName} className="h-5 w-5 text-ink" />
      </span>

      <div className="relative">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xs font-semibold text-gold/40">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
      </div>
    </div>
  );
}
