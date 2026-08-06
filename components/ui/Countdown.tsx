'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

type Parts = { d: number; h: number; m: number; s: number; done: boolean };

function diff(deadline: string): Parts {
  let ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0 || Number.isNaN(ms)) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const d = Math.floor(ms / 86_400_000);
  ms -= d * 86_400_000;
  const h = Math.floor(ms / 3_600_000);
  ms -= h * 3_600_000;
  const m = Math.floor(ms / 60_000);
  ms -= m * 60_000;
  const s = Math.floor(ms / 1000);
  return { d, h, m, s, done: false };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function Countdown({
  deadline,
  variant = 'pill',
  label = 'Nominations close in',
  closedLabel = 'Nominations now closed',
  className = '',
}: {
  deadline: string;
  variant?: 'pill' | 'panel';
  label?: string;
  closedLabel?: string;
  className?: string;
}) {
  // null until mounted so server and first client render match (no hydration mismatch).
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(diff(deadline));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full glass-gold px-4 py-2 text-[0.68rem] sm:text-xs font-semibold uppercase tracking-luxe text-gold ${className}`}
      >
        <Clock className="h-3.5 w-3.5" />
        {!parts ? (
          <span>{label}</span>
        ) : parts.done ? (
          <span>{closedLabel}</span>
        ) : (
          <span className="tabular-nums">
            {label} {parts.d}d {pad(parts.h)}h {pad(parts.m)}m {pad(parts.s)}s
          </span>
        )}
      </span>
    );
  }

  if (parts?.done) {
    return (
      <p className={`text-center font-display text-2xl font-semibold text-white ${className}`}>
        {closedLabel}
      </p>
    );
  }

  const cells = [
    { v: parts?.d, l: 'Days' },
    { v: parts?.h, l: 'Hrs' },
    { v: parts?.m, l: 'Min' },
    { v: parts?.s, l: 'Sec' },
  ];

  return (
    <div className={className}>
      <p className="mb-3 text-center text-[0.62rem] font-semibold uppercase tracking-wider text-white/55 break-words">
        {label}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {cells.map((c) => (
          <div key={c.l} className="rounded-2xl glass-gold px-1 py-3 text-center">
            <div className="font-display text-xl font-semibold text-gold-gradient tabular-nums">
              {c.v === undefined ? '—' : c.l === 'Days' ? String(c.v) : pad(c.v)}
            </div>
            <div className="mt-1 text-[0.6rem] sm:text-[0.65rem] uppercase tracking-wider text-white/50">
              {c.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
