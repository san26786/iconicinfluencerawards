'use client';

// Date-range filter for a campaign's recipient list. Presets (Today is the
// default) plus a custom from/to range, filtering recipients by their sent
// date (UK time). It only rewrites the `range`/`from`/`to` query params and
// resets the page — the existing status filter and sort are preserved.

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

export type RangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'all' | 'custom';

const PRESETS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

export function RecipientDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const range = (params.get('range') ?? 'today') as RangeKey;
  const [cFrom, setCFrom] = useState(params.get('from') ?? '');
  const [cTo, setCTo] = useState(params.get('to') ?? '');

  const navigate = (set: { range: RangeKey; from?: string; to?: string }) => {
    const qs = new URLSearchParams(params.toString());
    // Reset paging and clear any prior date params, then apply the new range.
    qs.delete('page');
    qs.delete('range');
    qs.delete('from');
    qs.delete('to');
    if (set.range !== 'today') qs.set('range', set.range); // today is the default → clean URL
    if (set.range === 'custom') {
      if (set.from) qs.set('from', set.from);
      if (set.to) qs.set('to', set.to);
    }
    const s = qs.toString();
    router.push(`${pathname}${s ? `?${s}` : ''}`);
  };

  const applyCustom = () => {
    if (!cFrom && !cTo) return;
    navigate({ range: 'custom', from: cFrom, to: cTo });
  };

  const base = 'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors';
  const on = 'border-gold/60 bg-gold/[0.12] text-white';
  const off = 'border-white/10 bg-white/[0.03] text-white/65 hover:border-gold/40 hover:text-white';

  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wider text-white/45">
        <CalendarDays className="h-3.5 w-3.5 text-gold" /> Filter recipients by sent date
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => navigate({ range: p.key })}
            className={`${base} ${range === p.key ? on : off}`}
          >
            {p.label}
          </button>
        ))}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <input
            type="date"
            value={cFrom}
            max={cTo || undefined}
            onChange={(e) => setCFrom(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-gold/50 focus:outline-none [color-scheme:dark]"
          />
          <span className="text-xs text-white/40">to</span>
          <input
            type="date"
            value={cTo}
            min={cFrom || undefined}
            onChange={(e) => setCTo(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-gold/50 focus:outline-none [color-scheme:dark]"
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!cFrom && !cTo}
            className={`${base} ${range === 'custom' ? on : off} disabled:opacity-50`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
