'use client';

// Hides layout chrome on routes that own the whole viewport.
//
// The brochure deck is a fixed-height flipbook (h-[100svh], overflow hidden),
// so a site footer rendered after it would sit below the fold and give the page
// a stray scrollbar that scrolls past the deck. The deck's last slide carries
// the contact details and links instead.

import { usePathname } from 'next/navigation';

export function HideOnPaths({
  paths,
  children,
}: {
  paths: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname && paths.includes(pathname)) return null;
  return <>{children}</>;
}
