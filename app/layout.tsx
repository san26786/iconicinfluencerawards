import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter, Pacifico, Cormorant_Garamond, Lora, Nunito } from 'next/font/google';
import './globals.css';
import { CEREMONY_WINDOW, IMG } from '@/lib/content';
import { getSite } from '@/lib/site';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCTA } from '@/components/MobileCTA';
import { HideOnPaths } from '@/components/HideOnPaths';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const pacifico = Pacifico({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-script',
  weight: '400',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
});

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
  weight: ['400', '500', '600', '700'],
});

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700'],
});

// generateMetadata is called per-request so each domain gets its own title/OG tags.
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();

  const title = `${site.name} ${site.year}`;
  const description =
    site.tagline ??
    `The ${site.name}. Nominations are free — enter today.`;
  const rawUrl = site.official_site || `https://${site.domain}`;
  let metadataBaseUrl: URL;
  try {
    metadataBaseUrl = new URL(rawUrl);
  } catch {
    metadataBaseUrl = new URL(`https://${site.domain}`);
  }
  const url = metadataBaseUrl.href;

  // Social share image: the site's own hero, then its logo. The old '/hero.jpg'
  // tail is gone — that file no longer exists in public/, so it would have been
  // a broken image in every share card that reached it.
  const shareImage = site.hero_image_id ? IMG(site.hero_image_id, 1200) : site.logo_url;

  return {
    metadataBase: metadataBaseUrl,
    title: { default: title, template: `%s | ${site.name}` },
    description,
    keywords: [
      site.name,
      `awards ${site.year}`,
      site.event_city ? `${site.event_city} awards` : null,
      'nominate a business',
    ].filter(Boolean) as string[],
    authors: [{ name: site.name }],
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url,
      siteName: site.name,
      title,
      description,
      ...(shareImage && {
        images: [{ url: shareImage, alt: `${site.name} award ceremony` }],
      }),
    },
    // No `icons` key on purpose. The logo is a 2364x568 wordmark, and pointing
    // the favicon at it made browsers squash the whole lock-up into a 16px
    // sliver. Next's file convention picks up app/icon.png instead — the trophy
    // alone, cropped square, which is legible at favicon size.
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(shareImage && { images: [shareImage] }),
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    alternates: { canonical: url },
  };
}

// Browser chrome colour follows the site's own background token rather than a
// hardcoded hex, so it stays in step with the palette.
export async function generateViewport(): Promise<Viewport> {
  const site = await getSite();
  return {
    themeColor: site.theme_bg ? `rgb(${site.theme_bg})` : '#0E1424',
    width: 'device-width',
    initialScale: 1,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSite();

  // Build schema.org Event JSON-LD from the site record
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${site.name} ${site.year}`,
    description: site.tagline,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    // endDate matters for a single-day event: without it search engines treat
    // the ceremony as a point in time rather than a 10:00–16:30 programme.
    // Derived from the start plus CEREMONY_WINDOW.durationHours, so the two
    // cannot drift apart.
    ...(site.event_date_iso && {
      startDate: site.event_date_iso,
      endDate: new Date(
        new Date(site.event_date_iso).getTime() +
          CEREMONY_WINDOW.durationHours * 3_600_000,
      ).toISOString(),
    }),
    location: {
      '@type': 'Place',
      name: site.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.event_city,
        addressCountry: 'GB',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: site.name,
      legalName: site.company,
      url: site.official_site,
      email: site.email,
      telephone: site.phone_display,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
      availability: 'https://schema.org/InStock',
      description: 'Free to enter — nominate your property business across as many categories as you like.',
    },
  };

  // CSS custom property values come from the DB; they are injected on the
  // <html> element so they act as :root variables without needing a <style>
  // tag.  TypeScript doesn't know about custom properties in CSSProperties,
  // hence the cast.
  const cssVars = {
    '--c-primary':     site.theme_primary,
    '--c-light':       site.theme_light,
    '--c-deep':        site.theme_deep,
    '--c-50':          site.theme_50,
    '--c-bg':          site.theme_bg,
    '--c-bg-slate':    site.theme_bg_slate,
    '--c-bg-warm':     site.theme_bg_warm,
    '--c-bg-darkest':  site.theme_bg_darkest,
  } as unknown as React.CSSProperties;

  return (
    <html
      lang="en-GB"
      data-site={site.slug}
      data-font-display={site.font_display ?? 'playfair'}
      data-font-body={site.font_body ?? 'inter'}
      className={`${playfair.variable} ${inter.variable} ${pacifico.variable} ${cormorant.variable} ${lora.variable} ${nunito.variable}`}
      style={cssVars}
    >
      <body className="font-sans antialiased bg-ink text-cream">
        {/* Apply theme before paint to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';var d=t==='dark'||(t==='system'&&!window.matchMedia('(prefers-color-scheme: light)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <GoogleAnalytics gaId={site.ga_id ?? undefined} />
        {/* The deck's own bar carries the site name, a link home and the entry
            call to action, so the site header on top of it is a second bar over
            the same slide — and the two together took a fifth of a laptop screen
            off the thing they were framing. */}
        <HideOnPaths paths={['/brochure', '/media-pack']}>
          <SiteHeader
            siteName={site.name}
            nominateUrl="/register-interest"
            // Empty when no logo has been uploaded — SiteHeader then renders the
            // typographic wordmark instead of a stand-in image.
            logoSrc={site.logo_url ?? ''}
            logoSrcLight={site.logo_url_light ?? undefined}
            logoAlt={site.name}
            logoSize="lg"
          />
        </HideOnPaths>
        {children}
        {/* The brochure deck owns the full viewport and ends with its own
            contact slide — a footer under it would only add a stray scroll. */}
        <HideOnPaths paths={['/brochure']}>
          <SiteFooter />
        </HideOnPaths>
        <MobileCTA />
      </body>
    </html>
  );
}
