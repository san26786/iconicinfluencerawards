// Server component. The interactive readiness checklist (its own client
// island) is the only stateful part; the surrounding section chrome ships
// as static HTML.

import { SectionHeading } from '../ui/SectionHeading';
import { RevealGroup, RevealItem } from '../ui/Reveal';
import { ReadinessChecklist } from './ReadinessChecklist';

const STEPS = [
  { num: '1', title: 'Discover your award', body: 'Browse categories or take the quick quiz to find your fit.' },
  { num: '2', title: 'Check eligibility', body: 'Confirm the criteria for your shortlist of categories.' },
  { num: '3', title: 'Prepare your story', body: 'Gather a few achievements, numbers and supporting words.' },
  { num: '4', title: 'Submit your nomination', body: 'Enter free in minutes. No payment ever required.' },
  { num: '5', title: 'Step into the spotlight', body: 'Join us on the day to celebrate the finalists and winners.' },
];

export function FromSparkToSpotlight() {
  return (
    <section
      id="your-awards-journey"
      className="relative overflow-hidden bg-ink py-20 lg:py-28 scroll-mt-24"
    >
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[34rem] w-[34rem] rounded-full bg-gold/10 blur-[140px] hidden sm:block" />
      <div className="container-luxe section-pad relative">
        <SectionHeading
          eyebrow="Your Awards Journey"
          title={
            <>
              From spark to <span className="text-gold-gradient">spotlight</span>
            </>
          }
          subtitle="A clear, five-step path from discovering your award to standing on the stage."
        />

        {/* Five steps */}
        <RevealGroup
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          stagger={0.07}
        >
          {STEPS.map((s) => (
            <RevealItem key={s.num}>
              <div className="group relative h-full rounded-2xl glass p-6 transition-colors duration-300 hover:border-gold/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient font-display text-lg font-semibold text-ink shadow-gold-sm">
                  {s.num}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{s.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Readiness checklist — client island, hydrates separately */}
        <ReadinessChecklist />
      </div>
    </section>
  );
}
