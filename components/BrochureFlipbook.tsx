'use client';

// Full-screen "brochure" deck — one section per screen, advanced by clicking
// Next / Prev, the dot rail, the cover's chapter chips, or ← / → .
//
// Scrolling deliberately does NOT change section. Wheel and swipe scroll the
// current section's own content and nothing else: a deck that jumps sections
// under a scroll gesture takes the page away from the reader mid-sentence.
// Moving on is always something the visitor asks for.
//
// Why a transform track rather than scroll-snap:
//   Sections are taller than the viewport on small screens, so each slide needs
//   its OWN scroll container. Snap points on the outer element fight with that
//   inner scrolling; translating a track by -index * 100% does not.
//
// Every slide stays in the DOM (nothing is conditionally rendered), so the full
// brochure is still crawlable and Ctrl+F-able even though one screen shows.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type BrochureSlide = {
  /** Anchor id — links like <a href="#programme"> jump to this slide. */
  id: string;
  /** Short label for the dot rail tooltip and the Next button's aria-label. */
  label: string;
  content: React.ReactNode;
};

export function BrochureFlipbook({ slides }: { slides: BrochureSlide[] }) {
  const [index, setIndex] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const count = slides.length;

  const go = useCallback(
    (next: number, updateHash = true) => {
      const clamped = Math.max(0, Math.min(count - 1, next));
      setIndex(current => {
        if (clamped !== current) {
          // Always land at the top of a section, however the visitor left it.
          slideRefs.current[clamped]?.scrollTo({ top: 0 });
        }
        return clamped;
      });
      if (updateHash && typeof window !== 'undefined') {
        const hash = clamped === 0 ? ' ' : `#${slides[clamped].id}`;
        window.history.replaceState(null, '', clamped === 0 ? window.location.pathname : hash);
      }
    },
    [count, slides],
  );

  // Deep links (/brochure#packages) and in-page anchors both arrive as a hash.
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace('#', '');
      if (!id) return;
      const i = slides.findIndex(s => s.id === id);
      if (i >= 0) go(i, false);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [slides, go]);

  // Keyboard: left/right move between sections, Home/End jump to the ends.
  // Up/Down and the page keys are left alone on purpose — those scroll the
  // section the visitor is reading, exactly as they would on any page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault(); go(index + 1); break;
        case 'ArrowLeft':
          e.preventDefault(); go(index - 1); break;
        case 'Home':
          e.preventDefault(); go(0); break;
        case 'End':
          e.preventDefault(); go(count - 1); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, go]);

  // The site's scroll-reveal uses one shared IntersectionObserver, which is
  // built for a page that scrolls. A slide arriving by transform is not a
  // scroll event anyone should have to rely on, so the incoming slide's reveals
  // are switched on directly — a slide the visitor is looking at must never sit
  // at opacity 0 waiting for an observer.
  useEffect(() => {
    const el = slideRefs.current[index];
    if (!el) return;
    const t = window.setTimeout(() => {
      el.querySelectorAll('.reveal').forEach(n => n.classList.add('reveal-in'));
      el.querySelectorAll('.reveal-stagger').forEach(n => n.parentElement?.classList.add('reveal-in'));
    }, 120);
    return () => window.clearTimeout(t);
  }, [index]);

  // In-deck anchor links (cover chapter chips, cross-references) move the deck
  // instead of asking the browser to scroll to an element it can't reach.
  const onClickCapture = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!href?.startsWith('#')) return;
    const i = slides.findIndex(s => s.id === href.slice(1));
    if (i < 0) return;
    e.preventDefault();
    go(i);
  };

  const progress = ((index + 1) / count) * 100;
  const nextLabel = index < count - 1 ? slides[index + 1].label : null;

  return (
    <div
      className="relative h-[100svh] overflow-hidden"
      onClickCapture={onClickCapture}
    >
      {/* Progress bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 bg-white/10">
        <div
          className="h-full bg-gold-gradient transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Track */}
      <div
        className="h-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            id={slide.id}
            ref={el => { slideRefs.current[i] = el; }}
            data-slide={i}
            aria-roledescription="slide"
            aria-label={`${slide.label} — ${i + 1} of ${count}`}
            // Off-screen slides must not be reachable by Tab, or focus jumps to
            // a section the visitor cannot see. inert also hides them from AT.
            inert={i !== index}
            className="h-full overflow-y-auto overscroll-contain"
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* Dot rail (desktop) */}
      <div className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => go(i)}
            aria-label={slide.label}
            aria-current={i === index ? 'true' : undefined}
            title={slide.label}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === index ? 'h-7 w-2.5 bg-gold-gradient' : 'w-2.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Prev / counter / Next */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 sm:bottom-7 sm:gap-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous section"
          className="grid h-11 w-11 place-items-center rounded-full glass text-white transition hover:border-gold/40 hover:text-gold disabled:opacity-35 disabled:hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="rounded-full glass px-4 py-2 text-xs font-semibold tabular-nums text-white/60">
          {index + 1} / {count}
        </span>

        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label={nextLabel ? `Next section: ${nextLabel}` : 'Next section'}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-gold-gradient px-5 text-sm font-bold uppercase tracking-wider text-ink shadow-gold transition hover:-translate-y-0.5 disabled:opacity-35 disabled:hover:translate-y-0"
        >
          Next
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
