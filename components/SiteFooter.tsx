import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';
import { FOOTER_EXTRA_LINKS } from '@/lib/content';
import { getSite } from '@/lib/site';
import { PrimaryButton } from './ui/Button';
import { SocialLinks } from './ui/Social';
import { Wordmark } from './ui/Wordmark';

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink pb-24 md:pb-0">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px] hidden sm:block" />
      <div className="container-luxe section-pad relative py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1.5fr_1fr]">
          <div>
            <div>
              {(() => {
                // No uploaded logo — show the wordmark rather than a stand-in
                // image that could belong to another brand.
                if (!site.logo_url) {
                  return <Wordmark siteName={site.name} size="lg" />;
                }
                const src = site.logo_url;
                const cls = 'h-16 w-auto';
                if (!site.logo_url_light) {
                  return <Image src={src} alt={site.name} width={260} height={182} className={cls} />;
                }
                // Footer sits on a light-ish panel in light mode too — swap to the
                // light-background variant the same way SiteHeader does.
                return (
                  <>
                    <Image src={src} alt={site.name} width={260} height={182} className={`${cls} theme-logo-dark`} />
                    <Image src={site.logo_url_light} alt={site.name} width={260} height={182} className={`${cls} theme-logo-light`} />
                  </>
                );
              })()}
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              {site.tagline}
            </p>
            <SocialLinks
              className="mt-6"
              facebook={site.social_facebook ?? undefined}
              instagram={site.social_instagram ?? undefined}
              linkedin={site.social_linkedin ?? undefined}
              x={site.social_x ?? undefined}
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-luxe text-gold">Explore</h3>
            {/* Every page in the header, gala sub-items included — sixteen links,
                so they run in two columns rather than one very long list. */}
            <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
              {FOOTER_EXTRA_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-white/60 transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-luxe text-gold">Get In Touch</h3>
            <ul className="mt-5 space-y-4 text-sm text-white/60">
              {site.phone_href && (
                <li>
                  <a
                    href={site.phone_href}
                    className="flex items-start gap-3 transition-colors hover:text-white"
                  >
                    <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                    {site.phone_display}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="flex items-start gap-3 break-all transition-colors hover:text-white"
                  >
                    <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                    {site.email}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-3 leading-relaxed">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                <span>
                  <span className="font-semibold text-white/80">{site.name}</span>
                  <br />
                  <span className="text-white/55">A brand of {site.company}</span>
                  {site.address && (
                    <>
                      <br />
                      <span className="mt-1 block text-white/55">{site.address}</span>
                    </>
                  )}
                </span>
              </li>
            </ul>
            <div className="mt-6">
              <PrimaryButton href="/register-interest" size="md">
                Nominate Now
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="mt-14 gold-rule" />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-white/60 sm:flex-row">
          <p className="text-center sm:text-left">{site.legal}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
