'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
        We hit an unexpected error
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
        Our team has been notified. You can try refreshing the page or return to the home page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-ink shadow-gold"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
