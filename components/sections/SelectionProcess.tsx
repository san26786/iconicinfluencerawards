import { JUDGING_PILLARS } from '@/lib/content';
import { SectionHeading } from '../ui/SectionHeading';
import { Icon, type IconName } from '../ui/Icon';
import { RevealGroup, RevealItem } from '../ui/Reveal';

/**
 * "A rigorous and independent selection" — the process explainer that sits
 * under every stage listing (shortlist, semifinalists, finalists, winners).
 * Same four pillars as the homepage judging section, with the heading swapped
 * per page so each one reads as if written for that stage.
 */
export function SelectionProcess({
  eyebrow = 'Our Process',
  title = 'A rigorous & independent selection',
  subtitle = 'No pay-to-win, no shortcuts. Every name on this page got here the same way — scored on evidence by judges with nothing to gain from the outcome.',
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="relative bg-slate950 py-20 lg:py-28">
      <div className="container-luxe section-pad">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
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
      </div>
    </section>
  );
}
