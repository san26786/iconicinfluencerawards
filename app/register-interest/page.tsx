import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { getSite } from '@/lib/site';
import { NominationWizard } from '@/components/NominationWizard';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Complete Your Nomination',
    description: `Complete your ${site.name} ${site.year} nomination in just a few steps. Free to enter — it only takes a few minutes.`,
    robots: { index: false, follow: false },
  };
}

export default async function RegisterInterestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, site] = await Promise.all([searchParams, getSite()]);
  const pf = typeof params.pf === 'string' ? params.pf : undefined;

  return (
    <main id="main">
      <section className="relative min-h-screen overflow-hidden bg-slate950 py-16 lg:py-24">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-gold/8 blur-[180px] hidden sm:block" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-gold/5 blur-[120px]" />

        <div className="container-luxe section-pad relative mx-auto max-w-2xl">
          {/* Top badge */}
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              {site.name} {site.year} · Free Entry
            </span>
          </div>

          {/* Nomination Guidelines banner */}
          <Link
            href="/nomination-guideline"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-gold/[0.06] px-5 py-4 transition-colors hover:border-gold/40 hover:bg-gold/[0.10]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold/15">
                <BookOpen className="h-4 w-4 text-gold" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Nomination Guidelines</p>
                <p className="text-xs text-white/50">Read before you submit — eligibility, criteria &amp; process</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-gold/60" />
          </Link>

          {/* Wizard card */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 shadow-2xl backdrop-blur-sm sm:p-10">
            <NominationWizard pfToken={pf} siteName={`${site.name} ${site.year}`} />
          </div>

          {/* Footer note */}
          {site.email && (
            <p className="mt-8 text-center text-xs text-white/30 leading-relaxed">
              Questions? Email us at{' '}
              <a
                href={`mailto:${site.email}`}
                className="text-gold/60 hover:text-gold transition-colors"
              >
                {site.email}
              </a>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
