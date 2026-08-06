'use client';

// Interactive readiness checklist. Extracted from FromSparkToSpotlight so
// the surrounding section markup (eyebrow, heading, the 5-step grid) can
// ship as static RSC. Only this widget — the only piece that owns state —
// hydrates on the client.

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Reveal } from '../ui/Reveal';

const CHECKS = [
  { key: 'fit', label: 'I know which award fits me' },
  { key: 'category', label: 'I have chosen my category' },
  { key: 'story', label: 'I have my achievements ready' },
  { key: 'submit', label: 'I am ready to nominate' },
];

function readinessMsg(pct: number) {
  if (pct === 0) return 'Tick items as you go — we will track your momentum.';
  if (pct < 50) return 'Great start. Each tick builds your readiness.';
  if (pct < 100) return 'Almost there — you are on the path to the spotlight.';
  return 'You are ready. Time to put a name forward.';
}

export function ReadinessChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  const ticked = CHECKS.filter((c) => done[c.key]).length;
  const pct = Math.round((ticked / CHECKS.length) * 100);

  const toggle = (k: string) =>
    setDone((s) => ({ ...s, [k]: !s[k] }));

  return (
    <Reveal delay={0.2} className="mx-auto mt-12 max-w-2xl">
      <div className="rounded-3xl glass p-7 sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">Your readiness</h3>
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">
            {pct}% ready
          </span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gold-gradient transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="mt-5 space-y-2.5">
          {CHECKS.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => toggle(c.key)}
                aria-pressed={!!done[c.key]}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                  done[c.key]
                    ? 'border-gold/50 bg-gold/[0.08] text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:text-white'
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                    done[c.key]
                      ? 'border-transparent bg-gold-gradient'
                      : 'border-white/30'
                  }`}
                >
                  {done[c.key] && <Check className="h-3.5 w-3.5 text-ink" strokeWidth={3} />}
                </span>
                {c.label}
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-center text-xs italic text-white/55">{readinessMsg(pct)}</p>
      </div>
    </Reveal>
  );
}
