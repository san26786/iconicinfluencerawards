'use client';

// Header account UI. `useSessionUser` fetches the current user from
// /api/auth/me (re-running on route change so the header stays in sync after
// login/logout). `UserMenu` is the desktop initials-avatar dropdown;
// `MobileAccount` is the equivalent block inside the mobile menu panel.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  ChevronDown,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  UserCircle,
  Users,
} from 'lucide-react';

export type MeUser = {
  id: number;
  email: string;
  role: 'visitor' | 'organiser' | 'judge';
  firstName: string | null;
  lastName: string | null;
};

// undefined = still loading, null = signed out, object = signed in
export function useSessionUser() {
  const pathname = usePathname();
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      setUser((data.user as MeUser) ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  return { user, setUser, refresh };
}

function initials(u: MeUser): string {
  const f = u.firstName?.trim()?.[0];
  const l = u.lastName?.trim()?.[0];
  if (f || l) return `${f ?? ''}${l ?? ''}`.toUpperCase();
  return (u.email?.[0] ?? '?').toUpperCase();
}

function displayName(u: MeUser): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return name || u.email;
}

function Avatar({ u, className = '' }: { u: MeUser; className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-gold-gradient text-xs font-semibold text-ink ${className}`}
    >
      {initials(u)}
    </span>
  );
}

// Role-aware account navigation shared by the desktop dropdown and mobile panel.
function accountLinks(role: MeUser['role']) {
  if (role === 'organiser') {
    return [{ href: '/organiser', label: 'Dashboard', icon: LayoutDashboard }];
  }
  if (role === 'judge') {
    return [
      { href: '/judge',              label: 'Dashboard',        icon: LayoutDashboard },
      { href: '/judge/profile',      label: 'My Profile',       icon: UserCircle },
      { href: '#',                   label: 'My Schedule',      icon: Calendar },
      { href: '#',                   label: 'My Connections',   icon: Users },
      { href: '#',                   label: 'Messages',         icon: MessageSquare },
    ];
  }
  return [
    { href: '/account/profile',    label: 'My Awards Profile', icon: UserCircle },
    { href: '/account/nominations', label: 'My Nominations',   icon: ClipboardList },
  ];
}

/* ── Desktop ──────────────────────────────────────────────────────────── */

export function UserMenu({ user, onSignOut }: { user: MeUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full glass py-1 pl-1 pr-2.5 transition-colors hover:border-gold/40"
      >
        <Avatar u={user} className="h-8 w-8" />
        <ChevronDown
          className={`h-4 w-4 text-white/55 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-ink/95 shadow-glass backdrop-blur-md"
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <Avatar u={user} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName(user)}</p>
              <p className="truncate text-xs text-white/50">
                {user.role === 'organiser' ? 'Organiser' : user.role === 'judge' ? 'Judge' : 'Visitor'}
              </p>
            </div>
          </div>
          {accountLinks(user.role).map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <Icon className="h-4 w-4 text-gold" />
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/account/change-password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-t border-white/10 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <KeyRound className="h-4 w-4 text-gold" />
            Change password
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2.5 border-t border-white/10 px-4 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut className="h-4 w-4 text-gold" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Mobile ───────────────────────────────────────────────────────────── */

export function MobileAccount({
  user,
  onSignOut,
  onNavigate,
}: {
  user: MeUser;
  onSignOut: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-3">
        <Avatar u={user} className="h-10 w-10 text-sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{displayName(user)}</p>
          <p className="truncate text-xs text-white/50">
            {user.role === 'organiser' ? 'Organiser' : user.role === 'judge' ? 'Judge' : 'Visitor'}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {accountLinks(user.role).map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/80 transition-colors hover:border-gold/40 hover:text-white"
            >
              <Icon className="h-4 w-4 text-gold" />
              {l.label}
            </Link>
          );
        })}
        <Link
          href="/account/change-password"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/80 transition-colors hover:border-gold/40 hover:text-white"
        >
          <KeyRound className="h-4 w-4 text-gold" />
          Change password
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            onSignOut();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-white/80 transition-colors hover:border-gold/40 hover:text-white"
        >
          <LogOut className="h-4 w-4 text-gold" />
          Sign out
        </button>
      </div>
    </div>
  );
}
