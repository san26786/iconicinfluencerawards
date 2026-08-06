import { JUDGING_PILLARS, SCORING_FRAMEWORK } from '@/lib/content';
import { SectionHeading } from '../ui/SectionHeading';
import { Icon, type IconName } from '../ui/Icon';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

/**
 * "Credibility is earned, not awarded" — the judging section.
 *
 * Four pillars explain how judging works; the panel beside them shows the
 * published 100-point weighting as proportional bars, because a weighting
 * people can see is the whole argument for the section.
 */
export function JudgingProcess() {
  const total = SCORING_FRAMEWORK.reduce((n, c) => n + c.weight, 0);

  return (
    <section id="judging" className="band-light relative overflow-hidden py-24 lg:py-32">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[34rem] w-[34rem] rounded-full bg-gold/10 blur-[150px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <SectionHeading
          eyebrow="The Judging Process"
          title={
            <>
              Credibility is <span className="text-gold-gradient">earned</span>, not awarded
            </>
          }
          subtitle="The value of recognition rests entirely on how it is judged. Ours is independent, transparent and built on merit — so winning genuinely means something."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          {/* Pillars */}
          <RevealGroup className="grid gap-4 sm:grid-cols-2" stagger={0.07}>
            {JUDGING_PILLARS.map((p) => (
              <RevealItem key={p.title}>
                <div className="h-full rounded-2xl glass p-6 transition-colors duration-300 hover:border-gold/30">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <Icon name={p.icon as IconName} className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Scoring framework */}
          <Reveal delay={0.15}>
            <div className="rounded-3xl glass p-7 sm:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl font-semibold text-white">Scoring Framework</h3>
                <span className="font-display text-2xl font-semibold text-gold-gradient tabular-nums">
                  {total} points
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/45">
                An illustrative weighting. Each category publishes its own criteria so you know
                exactly how you will be assessed.
              </p>

              <ul className="mt-7 space-y-5">
                {SCORING_FRAMEWORK.map((c) => (
                  <li key={c.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-white/80">{c.label}</span>
                      <span className="text-sm font-semibold text-gold tabular-nums">{c.weight}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gold-gradient"
                        style={{ width: `${c.weight}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
