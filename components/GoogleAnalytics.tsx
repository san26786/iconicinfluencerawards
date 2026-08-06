'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function GAPageTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag === 'undefined') return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', gaId, { page_path: url });
  }, [pathname, searchParams, gaId]);

  return null;
}

export function GoogleAnalytics({ gaId }: { gaId?: string }) {
  if (!gaId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <GAPageTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
