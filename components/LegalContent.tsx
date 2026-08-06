import Link from 'next/link';
import { getSite } from '@/lib/site';
import { Reveal } from './ui/Reveal';

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export async function LegalContent({
  updated,
  intro,
  sections,
}: {
  updated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  // Shared by Privacy, Terms and Cookies — the contact address in the footer
  // block below must be the tenant's own, not a hardcoded one.
  const site = await getSite();
  return (
    <section className="bg-ink py-16 lg:py-24">
      <div className="container-luxe section-pad">
        <Reveal className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-luxe text-gold">
            Last updated: {updated}
          </p>
          {intro && <p className="mt-5 text-lg leading-relaxed text-white/70">{intro}</p>}

          <div className="mt-10 space-y-10">
            {sections.map((s, i) => (
              <div key={s.heading}>
                <h2 className="font-display text-2xl font-semibold text-white">
                  <span className="mr-2 text-gold/50">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </h2>
                {s.paragraphs?.map((p, j) => (
                  <p key={j} className="mt-3 leading-relaxed text-white/65">
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="mt-4 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-white/65">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl glass-gold p-6">
            <p className="text-white/75">
              Questions about this policy?{' '}
              {site.email ? (
                <>
                  Email{' '}
                  <a href={`mailto:${site.email}`} className="font-semibold text-gold hover:text-gold-light">
                    {site.email}
                  </a>{' '}
                  or visit our{' '}
                </>
              ) : (
                <>Visit our{' '}</>
              )}
              <Link href="/contact" className="font-semibold text-gold hover:text-gold-light">
                contact page
              </Link>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
