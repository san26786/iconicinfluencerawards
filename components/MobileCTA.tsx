'use client';

// Floating "Start Your Free Entry" bar that appears on mobile after the
// user has scrolled past the fold.
//
// Why it exists:
//   On a long-scroll marketing page the hero CTA goes off-screen quickly,
//   so we anchor a one-tap shortcut to the bottom for thumb reach.
//
// Why it isn't simply always on:
//   - It MUST NOT show on the page the CTA itself links to (visitor is
//     already there — tapping just jumps to the top of the same page).
//   - It MUST NOT show on form/utility/legal pages where it would float
//     OVER form fields and a serious form distraction.
//   - At tablet widths (>=768px) the sticky bar is gratuitous: the chrome
//     nav is reachable and the bar covers ~80px of content. Phone-only.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SITE } from '@/lib/content';

/**
 * Page paths the bar should never appear on. Exact matches; the home page
 * '/' is allowed by omission. Any future route that's part of the
 * conversion funnel itself (i.e. links lead INTO it) should be added here.
 */
const SUPPRESS_ON: ReadonlySet<string> = new Set([
  '/register-interest',
  '/find-my-award',
  '/contact',
  '/partner',
  '/nomination-guideline',
  // Full-viewport deck with its own fixed Prev/Next controls at the bottom.
  '/brochure',
  '/privacy',
  '/terms',
  '/cookies',
]);

export function MobileCTA() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  // Bail before any scroll listener runs if we're on a suppressed route.
  // usePathname can return null briefly on first render — treat as suppress
  // so the bar doesn't flash on disallowed pages.
  const suppressed = !pathname || SUPPRESS_ON.has(pathname);

  useEffect(() => {
    if (suppressed) {
      setShow(false);
      return;
    }
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [suppressed]);

  if (suppressed) return null;

  return (
    <div
      // md:hidden, not lg:hidden — at tablet widths the bar wastes space.
      // pb-safe-area-inset honours iOS home-indicator gesture area.
      className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 md:hidden ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-32 opacity-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="m-3 rounded-2xl border border-gold/30 bg-ink/95 p-2.5 shadow-glass">
        <a
          href={SITE.nominateUrl}
          className="flex items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3.5 text-sm font-semibold text-ink"
        >
          <Sparkles className="h-4 w-4" />
          Start Your Free Entry
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
