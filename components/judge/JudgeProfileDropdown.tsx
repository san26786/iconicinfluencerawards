'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, User, Calendar, Users, ClipboardList,
  FileText, MessageSquare, ChevronDown, LogOut,
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Dashboard',               icon: LayoutDashboard, href: '/judge' },
  { label: 'My Profile',              icon: User,            href: '/judge/profile' },
  { label: 'My Schedule',             icon: Calendar,        href: '#' },
  { label: 'My Connections',          icon: Users,           href: '#' },
  { label: 'My Allocated Users',      icon: ClipboardList,   href: '/judge/board' },
  { label: 'Request For Registration',icon: FileText,        href: '/judges' },
  { label: 'Messages',                icon: MessageSquare,   href: '#' },
];

export function JudgeProfileDropdown({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:border-gold/30 hover:text-white"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold uppercase">
          {name.charAt(0)}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate">{name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-ink/95 shadow-xl backdrop-blur-sm z-50 overflow-hidden">
          {/* User info header */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-bold text-white uppercase tracking-wide">{name}</p>
            <p className="mt-0.5 text-[11px] text-white/40 truncate">{email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {MENU_ITEMS.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <Icon className="h-4 w-4 shrink-0 text-gold/60" />
                {label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-white/10 py-1">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/45 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
