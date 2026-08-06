// Read-only list of nominations connected to a user — used on the visitor's
// "My Nominations" page and inside the organiser's per-user view. Pure render
// (server component); the page does the querying.

import Link from 'next/link';
import { Award, CalendarDays, Pencil, Sparkles } from 'lucide-react';

export type MyNomination = {
  id: number;
  nominee: string;
  categories: string[];
  selfNominate: boolean;
  submitted: string;
  relation: 'You nominated' | 'You were nominated';
};

export function NominationsList({
  items,
  viewHref,
  editHref,
}: {
  items: MyNomination[];
  viewHref?: (id: number) => string;
  editHref?: (id: number) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl glass px-6 py-16 text-center">
        <Sparkles className="h-8 w-8 text-gold" />
        <p className="mt-4 text-sm text-white/60">No nominations yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((n) => (
        <li key={n.id} className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-gold">
                {n.relation}
                {n.selfNominate ? ' · Self-nomination' : ''}
              </p>
              <h3 className="mt-1 flex items-center gap-2 font-display text-lg font-semibold text-white">
                <Award className="h-4 w-4 text-gold" />
                {n.nominee || 'Nomination'}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                <CalendarDays className="h-3.5 w-3.5" />
                Submitted {n.submitted}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {editHref && (
                <Link
                  href={editHref(n.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              )}
              {viewHref && (
                <Link
                  href={viewHref(n.id)}
                  className="inline-flex items-center justify-center rounded-full glass px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-gold/40"
                >
                  View
                </Link>
              )}
            </div>
          </div>
          {n.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {n.categories.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full border border-gold/30 bg-gold/[0.07] px-3 py-1 text-xs text-white/80"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
