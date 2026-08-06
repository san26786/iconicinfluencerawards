'use client';

import { useEffect, useRef, useState } from 'react';

// Count-up animation using IntersectionObserver + requestAnimationFrame (no animation library).
export function Counter({
  value,
  suffix = '',
  className,
  duration = 1.6,
}: {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce || typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !done.current) {
            done.current = true;
            io.disconnect();
            const startTime = performance.now();
            const total = duration * 1000;
            const step = (now: number) => {
              const t = Math.min(1, (now - startTime) / total);
              const eased = 1 - Math.pow(1 - t, 3);
              setDisplay(Math.round(value * eased));
              if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${value}${suffix}`}>
      {display.toLocaleString('en-GB')}
      {suffix}
    </span>
  );
}
