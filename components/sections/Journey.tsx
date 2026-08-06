import { buildJourney } from '@/lib/content';
import { getSite } from '@/lib/site';
import { Icon, type IconName } from '../ui/Icon';
import { SectionHeading } from '../ui/SectionHeading';
import { RevealGroup, RevealItem } from '../ui/Reveal';

export async function Journey() {
  const site = await getSite();
  const JOURNEY = buildJourney(site.venue_short ?? site.venue ?? '', site.event_date_long ?? '');
  return (
    <section id="your-awards-journey" className="relative overflow-hidden bg-slate950 py-24 lg:py-32">
      <div className="container-luxe section-pad relative">
        <SectionHeading
          eyebrow="Your awards journey"
          title={
            <>
              Six steps from <span className="text-gold-gradient">entry to ovation</span>
            </>
          }
          subtitle="A clear, considered path — designed so the only hard part is deciding to enter."
        />

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Track */}
          <div className="absolute left-6 top-0 h-full w-px bg-white/10 lg:left-1/2 lg:-translate-x-1/2" />
          <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-gold-light via-gold to-gold-deep opacity-70 lg:left-1/2 lg:-translate-x-1/2" />

          <RevealGroup className="space-y-10 lg:space-y-16" stagger={0.08}>
            {JOURNEY.map((s, i) => (
              <RevealItem key={s.step} className="relative pl-20 lg:pl-0">
                <Step {...s} index={i} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

function Step({
  step,
  icon,
  title,
  body,
  index,
}: {
  step: string;
  icon: string;
  title: string;
  body: string;
  index: number;
}) {
  const isRight = index % 2 === 1;
  return (
    <>
      {/* Node */}
      <span className="absolute left-6 top-1 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-gold/40 bg-ink shadow-gold-sm lg:left-1/2">
        <Icon name={icon as IconName} className="h-5 w-5 text-gold" />
      </span>

      <div
        className={`lg:w-[calc(50%-3rem)] ${
          isRight ? 'lg:ml-auto lg:pl-4' : 'lg:pr-4 lg:text-right'
        }`}
      >
        <div className="rounded-2xl glass p-6 transition-colors duration-300 hover:border-gold/30">
          <div className={`flex items-center gap-3 ${isRight ? '' : 'lg:flex-row-reverse'}`}>
            <span className="font-display text-3xl font-semibold text-gold/40">{step}</span>
            <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
        </div>
      </div>
    </>
  );
}
