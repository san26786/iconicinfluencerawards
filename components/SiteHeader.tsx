'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, User, Briefcase, Scale, Users, LayoutDashboard, UserCircle, Calendar, MessageSquare } from 'lucide-react';
import { HEADER_NAV, type HeaderNavItem } from '@/lib/content';
import { PrimaryButton } from './ui/Button';
import { Wordmark } from './ui/Wordmark';
import { useSessionUser, MobileAccount } from './auth/UserMenu';
import { GoogleTranslate } from './ui/GoogleTranslate';
import { ThemeToggle } from './ui/ThemeToggle';

/** Routes where the header is solid from the top, not only once scrolled. */
const ALWAYS_SOLID: ReadonlySet<string> = new Set(['/brochure']);

// Portals shown in dropdown — Judge first, then Partner, then Organiser
const PORTALS = [
  { label: 'Judge',      icon: Scale,     href: '/judge',     role: 'judge'     },
  { label: 'My Account', icon: User,      href: '/account',   role: 'visitor'   },
  { label: 'Partner',    icon: Users,     href: '/account',   role: 'partner'   },
  { label: 'Organiser',  icon: Briefcase, href: '/organiser', role: 'organiser' },
] as const;

const JUDGE_MENU = [
  { label: 'Dashboard',      icon: LayoutDashboard, href: '/judge' },
  { label: 'My Profile',     icon: UserCircle,      href: '/judge/profile' },
  { label: 'My Schedule',    icon: Calendar,        href: '#' },
  { label: 'My Connections', icon: Users,           href: '#' },
  { label: 'Messages',       icon: MessageSquare,   href: '#' },
];

// Desktop nav dropdown for grouped items (e.g. "Get Involved").
function NavDropdown({ item }: { item: HeaderNavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 whitespace-nowrap text-sm text-white/70 transition-colors hover:text-white"
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* "The Gala & Pre-Launch" carries a dozen children — one column would
          run off the bottom of most laptop screens, so menus longer than six
          items wrap into two. */}
      {open && (() => {
        const children = item.children!;
        const twoCol = children.length > 6;
        return (
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 ${twoCol ? 'w-[30rem]' : 'w-52'}`}
          >
            <div
              className={`rounded-2xl border border-white/10 bg-ink/95 p-2 shadow-2xl backdrop-blur-md ${
                twoCol ? 'grid grid-cols-2 gap-x-1' : ''
              }`}
            >
              {children.map(child => (
                <a
                  key={child.href}
                  href={child.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {child.label}
                </a>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function SignInDropdown({ user, onSignOut }: { user: { email: string; firstName?: string | null; role: string } | null | undefined; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // undefined = auth still loading — show a neutral placeholder so we don't
  // flash "Sign in" before flipping to the real account state.
  if (user === undefined) {
    return <div className="h-4 w-16 animate-pulse rounded-full bg-white/10" aria-hidden />;
  }

  // Signed out: a plain link, no menu.
  //
  // This used to open a "Login as — Judge / Partner / Organiser" dropdown whose
  // three entries all pointed at /login. Three doors, one room: it asked visitors
  // to pick a role before signing in when the role comes from their account, and
  // it contradicted the sign-in page's own "one account, every role" message.
  if (!user) {
    return (
      <Link
        href="/login"
        className="whitespace-nowrap text-sm text-white/70 transition-colors hover:text-white"
      >
        Sign in
      </Link>
    );
  }

  const label = user.firstName || user.email.split('@')[0];
  const isJudge = user.role === 'judge';

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 whitespace-nowrap text-sm text-white/70 transition-colors hover:text-white"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full w-60 pt-2 z-50">
          <div className="rounded-2xl border border-white/10 bg-ink/95 py-2 shadow-2xl backdrop-blur-md">

            {/* Signed-in user header */}
            {(
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs font-bold text-white uppercase tracking-wide truncate">
                  {user.firstName || user.email.split('@')[0]}
                </p>
                <p className="text-[11px] text-white/40 truncate mt-0.5">{user.email}</p>
              </div>
            )}

            {/* Judge sub-menu (only when signed in as judge) */}
            {isJudge && (
              <div className="border-b border-white/10 pb-1 mb-1">
                {JUDGE_MENU.map(({ label: lbl, icon: Icon, href }) => (
                  <Link
                    key={lbl}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-white/65 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-gold/60" />
                    {lbl}
                  </Link>
                ))}
              </div>
            )}

            {/* Only the portal this account actually has.
                The other roles used to be listed here as "… Login" links pointing
                at /login, which for someone already signed in just bounced them
                back to where they came from. */}
            <div className="pt-1">
              {PORTALS.filter(p => p.role === user.role).map(p => {
                const Icon = p.icon;
                return (
                  <Link
                    key={p.role}
                    href={p.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gold hover:text-gold/80 hover:bg-white/5 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    {p.label} Portal
                  </Link>
                );
              })}
            </div>

            {/* Sign out */}
            {(
              <div className="border-t border-white/10 mt-1 pt-1">
                <button
                  onClick={() => { setOpen(false); onSignOut(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

interface SiteHeaderProps {
  /** Required — the requesting site's name. See the note on the component. */
  siteName: string;
  nominateUrl?: string;
  logoSrc?: string;
  /** Optional variant shown instead of logoSrc when the site is in light mode
   *  (e.g. a logo whose text/colours only read well on a white background). */
  logoSrcLight?: string;
  logoAlt?: string;
  logoSize?: 'sm' | 'md' | 'lg';
  logoClassName?: string;
}

export function SiteHeader({
  // No brand default: app/layout.tsx always passes the real site's values, and a
  // default here would let a future caller silently ship one tenant's name.
  siteName,
  nominateUrl = '/register-interest',
  // Empty by default so an unset logo falls through to the wordmark rather
  // than to a file that may not exist.
  logoSrc = '',
  logoSrcLight,
  logoAlt,
  logoSize = 'md',
  logoClassName = '',
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, setUser } = useSessionUser();
  const router = useRouter();
  const pathname = usePathname();

  // Routes whose content sits directly under the bar from the first pixel — the
  // brochure deck starts mid-section rather than with a hero to see through, so
  // a transparent bar there is just headings colliding with nav links.
  const solid = scrolled || (!!pathname && ALWAYS_SOLID.has(pathname));

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/');
      router.refresh();
    }
  };

  useEffect(() => {
    // The header goes solid as soon as anything has scrolled under it. On most
    // pages that is the window; on the brochure deck the page itself never
    // moves and each section scrolls inside its own container, which left the
    // bar transparent while text slid underneath it.
    //
    // scroll events don't bubble, but a capturing listener on window still sees
    // them from any scrolling element, so both cases run through here.
    const onScroll = (e?: Event) => {
      const target = e?.target;
      const inner = target instanceof HTMLElement ? target.scrollTop : 0;
      setScrolled(window.scrollY > 24 || inner > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid
            ? 'border-b border-white/10 bg-ink/95 py-3 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent py-5'
        }`}
      >
        <nav className="container-luxe section-pad flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center"
            aria-label={siteName}
          >
            {(() => {
              // No uploaded logo — fall back to the typographic wordmark rather
              // than a stock file that could belong to another brand.
              if (!logoSrc) {
                return (
                  <Wordmark
                    siteName={siteName}
                    size={logoSize}
                    className="transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                );
              }

              const sizeCls = logoSize === 'sm' ? 'h-8' : logoSize === 'md' ? 'h-10' : 'h-16';
              const cls = `${sizeCls} w-auto transition-transform duration-300 group-hover:scale-[1.02] ${logoClassName}`;
              const renderLogo = (src: string, extraCls: string) =>
                src.startsWith('data:') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={logoAlt ?? siteName} className={`${cls} ${extraCls}`} />
                ) : (
                  <Image src={src} alt={logoAlt ?? siteName} width={260} height={182} priority
                    className={`${cls} ${extraCls}`} />
                );

              if (!logoSrcLight) return renderLogo(logoSrc, '');
              // Both variants render; CSS (theme-logo-dark/light in globals.css)
              // shows only the one matching the current html[data-theme].
              return (
                <>
                  {renderLogo(logoSrc, 'theme-logo-dark')}
                  {renderLogo(logoSrcLight, 'theme-logo-light')}
                </>
              );
            })()}
          </Link>

          <ul className="hidden lg:flex items-center gap-6">
            {HEADER_NAV.map((link) => (
              <li key={link.label}>
                {link.children ? (
                  <NavDropdown item={link} />
                ) : (
                  <a
                    href={link.href}
                    className="relative whitespace-nowrap text-sm text-white/70 transition-colors hover:text-white after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <GoogleTranslate />
            <SignInDropdown user={user} onSignOut={signOut} />
            {/* "The Experience" used to sit here as a second button. It lives in
                the Gala & Pre-Launch dropdown now — it pointed at /about-event,
                the same page that menu already listed, so the bar was carrying a
                duplicate of a link one level down. */}
            <PrimaryButton href={nominateUrl} size="md" className="whitespace-nowrap">
              Submit Nomination
            </PrimaryButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full glass text-white"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* overflow-y-auto matters: the gala menu alone is twelve links, so on a
          phone the drawer is taller than the viewport. */}
      {open && (
        <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-ink/95 pb-12 lg:hidden">
          <div className="flex items-center justify-between section-pad py-5">
            <span className="font-display text-lg font-semibold text-white">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full glass text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="flex flex-col gap-1 section-pad pt-6">
            {HEADER_NAV.map((link) => (
              <li key={link.label}>
                {link.children ? (
                  <div className="border-b border-white/10 py-4">
                    <p className="font-display text-xl text-white/80">{link.label}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 pl-3">
                      {link.children.map(child => (
                        <a
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="block py-2 text-sm text-white/60 hover:text-gold transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/10 py-3.5 font-display text-xl text-white/80 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="section-pad pt-8 space-y-3">
            {user ? (
              <MobileAccount user={user} onSignOut={signOut} onNavigate={() => setOpen(false)} />
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block w-full rounded-full glass py-3 text-center text-sm font-semibold text-white transition-colors hover:border-gold/40"
              >
                Sign in
              </Link>
            )}
            <PrimaryButton href={nominateUrl} className="w-full" size="lg">
              Submit Nomination
            </PrimaryButton>
          </div>
        </div>
      )}
    </>
  );
}
