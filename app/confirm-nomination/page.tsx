import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { NominationWizard } from '@/components/NominationWizard';
import { getSite } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Complete Your Nomination',
  robots: { index: false, follow: false },
};

export default async function ConfirmNominationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, site] = await Promise.all([searchParams, getSite()]);
  const pf = typeof params.pf === 'string' ? params.pf : undefined;

  return (
    <main id="main">
      <section className="relative min-h-screen overflow-hidden bg-slate950 py-16 lg:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-gold/8 blur-[180px] hidden sm:block" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-gold/5 blur-[120px]" />

        <div className="container-luxe section-pad relative mx-auto max-w-2xl">
          <div className="mb-10 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              {site.name} {site.year} · Free Entry
            </span>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 shadow-2xl backdrop-blur-sm sm:p-10">
            <NominationWizard pfToken={pf} siteName={`${site.name} ${site.year}`} />
          </div>

          {site.email && (
            <p className="mt-8 text-center text-xs text-white/30 leading-relaxed">
              Questions? Email us at{' '}
              <a href={`mailto:${site.email}`} className="text-gold/60 hover:text-gold transition-colors">
                {site.email}
              </a>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
