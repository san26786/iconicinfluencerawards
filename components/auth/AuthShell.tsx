import Link from 'next/link';
import type { ReactNode } from 'react';

// Presentational wrapper shared by the login / register / password pages.
// Sits below the fixed SiteHeader (hence the top padding) and centres a
// glass card on the dark ink background, matching the rest of the site.

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Optional companion panel shown beside the form on desktop and below it on
   * mobile. Used by the login page for the "one account, every role" panel; the
   * register and password pages pass nothing and keep the original narrow card.
   */
  aside?: ReactNode;
}) {
  return (
    <main id="main" className="relative min-h-screen overflow-hidden px-5 pb-20 pt-32 sm:pt-40">
      {/* Soft gold glow behind the card, consistent with the homepage hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />
      <div
        className={`relative mx-auto w-full ${
          aside ? 'max-w-4xl lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-8' : 'max-w-md'
        }`}
      >
        <div>
          <div className="rounded-3xl glass p-7 sm:p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">{eyebrow}</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-[2rem]">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-white/55">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-white/55">{footer}</div>}
        </div>

        {aside && <div className="mt-8 lg:mt-0">{aside}</div>}
      </div>
    </main>
  );
}

/** Inline text link styled in the site's gold accent. */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-gold underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
