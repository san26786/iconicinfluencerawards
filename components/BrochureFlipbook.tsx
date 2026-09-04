'use client';

// Full-screen "brochure" deck — one section per screen, advanced by the side
// arrows, the progress rail at the foot, the cover's chapter chips, or ← / → .
//
// Every deck on the site wears the same chrome: a bar naming the pack with one
// call to action, Save as PDF and a counter, big side arrows, and a segmented
// progress rail. The brochure once had chrome of its own — a dot rail and a
// Next button — which meant the same content read as two different documents
// depending on which link the reader had been sent.
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

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';

/**
 * How far a slide may be shrunk before shrinking stops being a kindness.
 *
 * Below this the type is too small to read, and a scrollbar is the better of
 * two bad answers.
 *
 * The number depends on the screen because the reader does. A deck on a laptop
 * or a projector is read from a metre away on a wide screen, and half size
 * there is still comfortably legible — so anything a laptop shows gets fitted,
 * with room to spare for the short viewports a browser's own chrome leaves
 * behind. A phone is read at arm's length in a column a third as wide: its
 * heaviest slide is nearly three screens tall, and fitting that would set the
 * body text at about 2mm. So the phone keeps the higher floor, and the few
 * slides below it keep scrolling.
 */
const FIT_FLOOR_WIDE = 0.45;
const FIT_FLOOR_PHONE = 0.62;
/** Tailwind's `sm` — the width the deck's own layouts change at. */
const PHONE_MAX_WIDTH = 640;

const fitFloor = () =>
  window.innerWidth < PHONE_MAX_WIDTH ? FIT_FLOOR_PHONE : FIT_FLOOR_WIDE;

/**
 * A measured height past this is not a tall slide, it is a bug.
 *
 * Twenty thousand pixels is roughly twenty-five screens of content — far more
 * than any slide here, and far less than a runaway measurement reaches. Acting
 * on one would bake the mistake into the layout, so it is ignored instead.
 */
const MAX_SLIDE_HEIGHT = 20_000;

type Fit = { height: number; scale: number };

/**
 * Fits one slide's content to the screen, so a deck reads like a deck.
 *
 * Slides were free to be taller than the viewport and scrolled inside
 * themselves when they were. That is fine for a brochure being browsed and
 * wrong for a pack being presented: at 1366×768 — an ordinary laptop, and most
 * of what a projector reports — seven of the thirteen slides overflowed, and
 * the two heaviest were two-thirds taller than the screen. Nobody scrolls a
 * slide in front of a room.
 *
 * The content is measured at its natural size and scaled down to fit. Scaling
 * rather than restyling is deliberate: every slide keeps its own proportions,
 * and a slide that already fits is left completely alone.
 *
 * The inner element always carries a definite pixel height, which is what lets
 * the `min-h-full` centring inside each slide keep resolving exactly as it did
 * before this wrapper existed.
 */
function SlideFit({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const b = box.current;
      const c = inner.current;
      if (!b || !c) return;

      // The slide's own scroll container is the one with the real height; this
      // wrapper's height is whatever the last measurement gave it.
      const avail = b.parentElement?.clientHeight ?? 0;
      if (!avail) return;

      // Measure against the SCREEN's height, never against the height the last
      // pass produced. Slides are built out of `min-h-full` sections, so a
      // wrapper left at its own measured height becomes the thing those
      // percentages resolve against: each pass then measures the previous one
      // and adds to it. The full media pack doubled its way to 26 million
      // pixels in a handful of frames before this basis was pinned.
      const height = c.style.height;
      const transform = c.style.transform;
      c.style.height = `${avail}px`;
      c.style.transform = 'none';
      const natural = c.scrollHeight;
      c.style.height = height;
      c.style.transform = transform;

      // Nothing sane to act on — leave the slide exactly as it is.
      if (!natural || natural > MAX_SLIDE_HEIGHT) return;
      if (natural <= avail + 1) { setFit({ height: avail, scale: 1 }); return; }

      const scale = avail / natural;
      // Too much to shrink honestly: keep the slide at full size and let it
      // scroll, which is what it did before.
      setFit({ height: natural, scale: scale < fitFloor() ? 1 : scale });
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (box.current?.parentElement) observer.observe(box.current.parentElement);
    window.addEventListener('resize', measure);
    // Web fonts land after first paint and change every measurement with them.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const scaled = !!fit && fit.scale < 1;

  return (
    <div
      ref={box}
      className={`slide-fit ${scaled ? 'flex h-full items-center justify-center overflow-hidden' : 'min-h-full'}`}
    >
      <div
        ref={inner}
        className="slide-fit-inner w-full"
        style={fit ? { height: fit.height, transform: `scale(${fit.scale})`, transformOrigin: 'center center' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export type BrochureSlide = {
  /** Anchor id — links like <a href="#programme"> jump to this slide. */
  id: string;
  /** Short label for the progress rail's tooltip and the Next arrow's aria-label. */
  label: string;
  content: React.ReactNode;
};

export function BrochureFlipbook({
  slides,
  title,
  label,
  action,
}: {
  slides: BrochureSlide[];
  /** The name shown at top left, linking home. */
  title: string;
  /** The small caps qualifier beside it, e.g. "Media Pack". */
  label?: string;
  /**
   * One call to action kept in the bar on every slide, so a deck that argues
   * for entering is never more than one click from doing it.
   */
  action?: { label: string; href: string };
}) {
  const [index, setIndex] = useState(0);
  const [pdfMenu, setPdfMenu] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchX = useRef<number | null>(null);

  const count = slides.length;
  const pad = (n: number) => String(n).padStart(2, '0');

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
        case 'Escape':
          setPdfMenu(false); break;
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

  /**
   * Print the deck at a chosen orientation.
   *
   * A slide is composed wide, so portrait leaves half the sheet empty — but a
   * deck read alongside a portrait document should still be able to match it.
   * The choice is made at the moment of saving rather than set once somewhere,
   * because it belongs to the copy being produced, not to the deck.
   */
  const printDeck = (orientation: 'landscape' | 'portrait') => {
    setPdfMenu(false);
    const id = 'deck-print-orientation';
    document.getElementById(id)?.remove();
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@page { size: A4 ${orientation}; margin: 8mm; }`;
    document.head.appendChild(style);
    const cleanup = () => {
      document.getElementById(id)?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const progress = ((index + 1) / count) * 100;
  const nextLabel = index < count - 1 ? slides[index + 1].label : null;

  // Horizontal swipe, deck chrome only. The threshold and the axis check matter:
  // slides scroll vertically inside themselves, so a gesture only counts as
  // "next slide" when it is decisively sideways.
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
  };

  const track = (
    <div
      className="brochure-track h-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
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
          <SlideFit>{slide.content}</SlideFit>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="brochure-deck flex h-[100svh] flex-col overflow-clip bg-ink [print-color-adjust:exact]"
      onClickCapture={onClickCapture}
    >
      {/* Top bar */}
      <div className="deck-chrome relative z-20 flex items-center justify-between gap-2 border-b border-white/10 bg-ink/80 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-gold"
        >
          <span className="truncate font-display text-gold-gradient">{title}</span>
          {label && (
            <>
              <span className="hidden text-white/30 sm:inline">·</span>
              <span className="hidden text-[0.7rem] uppercase tracking-luxe text-white/45 sm:inline">
                {label}
              </span>
            </>
          )}
        </Link>
        <div className="flex items-center gap-3">
          {action && (
            <Link
              href={action.href}
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-gold-gradient px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink shadow-gold transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-1.5 sm:text-[0.72rem] sm:tracking-luxe"
            >
              {action.label}
            </Link>
          )}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setPdfMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={pdfMenu}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[0.72rem] font-semibold text-white/75 transition-colors hover:border-gold/40 hover:text-gold sm:px-3.5 sm:py-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save as PDF</span>
            </button>
            {pdfMenu && (
              <>
                {/* Click-away. A button rather than a div so it is reachable
                    by keyboard and closes on Escape like the rest of the bar. */}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setPdfMenu(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-xl border border-white/12 bg-ink/95 shadow-xl backdrop-blur-md"
                >
                  <p className="px-3 pb-1 pt-2.5 text-[0.6rem] font-semibold uppercase tracking-luxe text-white/40">
                    Page layout
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => printDeck('landscape')}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.06] hover:text-gold"
                  >
                    <span className="h-3 w-4 shrink-0 rounded-[2px] border border-current" />
                    Landscape
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => printDeck('portrait')}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.06] hover:text-gold"
                  >
                    <span className="h-4 w-3 shrink-0 rounded-[2px] border border-current" />
                    Portrait
                  </button>
                </div>
              </>
            )}
          </div>
          <span className="whitespace-nowrap tabular-nums text-xs font-semibold text-white/50">
            {pad(index + 1)} / {pad(count)}
          </span>
        </div>
      </div>

      {/* Stage */}
      <div
        // min-h-0 is load-bearing, not tidiness. A flex item's automatic
        // minimum size is its content, and `overflow: hidden` used to zero
        // that as a side effect; `clip` does not. Without it the stage grows
        // to whatever the tallest slide measures, the slides grow with it,
        // and the next measurement measures that — the full pack reached
        // twenty-nine thousand pixels a slide.
        className="deck-stage relative min-h-0 flex-1 overflow-clip"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Arrows are desktop-only: at a phone width they sit on top of the
            slide text. A phone advances the deck by swiping, or by tapping a
            segment of the progress rail below. */}
        {track}

        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous slide"
          className="deck-chrome absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 sm:flex items-center justify-center rounded-full border border-white/15 bg-ink/70 text-white backdrop-blur-md transition-all hover:border-gold/50 hover:text-gold disabled:pointer-events-none disabled:opacity-25 sm:left-5 sm:h-14 sm:w-14"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label={nextLabel ? `Next slide: ${nextLabel}` : 'Next slide'}
          className="deck-chrome absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 sm:flex items-center justify-center rounded-full border border-white/15 bg-ink/70 text-white backdrop-blur-md transition-all hover:border-gold/50 hover:text-gold disabled:pointer-events-none disabled:opacity-25 sm:right-5 sm:h-14 sm:w-14"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Bottom progress — one segment per slide, and each is a jump target. */}
      <div className="deck-chrome relative z-20 flex items-center gap-4 border-t border-white/10 bg-ink/80 px-4 py-3.5 backdrop-blur-md sm:px-6">
        <div className="flex flex-1 items-center gap-1" role="tablist" aria-label="Slides">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-label={slide.label}
              aria-selected={i === index}
              onClick={() => go(i)}
              className="group h-2 flex-1 overflow-hidden rounded-full bg-white/10"
            >
              <span
                className={`block h-full rounded-full transition-all duration-300 ${
                  i < index
                    ? 'w-full bg-gold/40'
                    : i === index
                      ? 'w-full bg-gold-gradient'
                      : 'w-0 bg-gold-gradient group-hover:w-1/3'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="tabular-nums text-xs font-semibold text-white/60">
          {pad(index + 1)} / {pad(count)}
        </span>
      </div>
    </div>
  );
}
