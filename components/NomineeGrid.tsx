import { Trophy } from 'lucide-react';
import type { PublicNominee } from '@/lib/nominees';
import { PrimaryButton, GhostButton } from './ui/Button';
import { Reveal, RevealGroup, RevealItem } from './ui/Reveal';

/**
 * Shared listing for the shortlist / semifinalist / finalist / winner pages.
 *
 * All four are empty until judging runs, so the empty state is the case that
 * matters most: it says when the list appears and keeps the entry route open
 * rather than showing a bare "no results".
 */
export function NomineeGrid({
  nominees,
  emptyTitle,
  emptyBody,
}: {
  nominees: PublicNominee[];
  emptyTitle: string;
  emptyBody: string;
}) {
  if (nominees.length === 0) {
    return (
      <Reveal className="mx-auto max-w-2xl">
        <div className="rounded-3xl glass p-10 text-center lg:p-14">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glass-gold">
            <Trophy className="h-7 w-7 text-gold" />
          </span>
          <h3 className="font-display text-2xl font-semibold text-white">{emptyTitle}</h3>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-white/60">{emptyBody}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton href="/register-interest" size="md">
              Start Your Free Entry
            </PrimaryButton>
            <GhostButton href="/categories" size="md">
              Explore the categories
            </GhostButton>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
      {nominees.map((n) => (
        <RevealItem key={n.id}>
          <article className="h-full rounded-2xl glass p-6 transition-colors duration-300 hover:border-gold/30">
            <h3 className="font-display text-lg font-semibold leading-snug text-white">
              {n.name}
            </h3>
            {n.business && n.business !== n.name && (
              <p className="mt-1 text-sm text-white/55">{n.business}</p>
            )}
            {n.categories.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {n.categories.map((c) => (
                  <li
                    key={c}
                    className="rounded-full glass-gold px-3 py-1 text-[0.68rem] font-medium text-gold"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
