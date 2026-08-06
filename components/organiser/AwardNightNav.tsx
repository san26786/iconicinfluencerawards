'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutList, HelpCircle, ClipboardList, UserCheck, Users2,
  BookMarked, Star, Award, Trophy, Clock, FileText,
} from 'lucide-react';

const TABS = [
  { href: '/organiser/award-night/categories',    label: 'Manage Categories',             icon: LayoutList,    color: 'red' },
  { href: '/organiser/award-night/questions',     label: 'Manage Questions',              icon: HelpCircle,    color: 'green' },
  { href: '/organiser/award-night',               label: 'Manage Nominations',            icon: ClipboardList, color: 'teal',   exact: true },
  { href: '/organiser/award-night/judges',        label: 'Manage Category Judges',        icon: UserCheck,     color: 'orange' },
  { href: '/organiser/award-night/applications',  label: 'Manage Applicants',             icon: FileText,      color: 'blue' },
  { href: '/organiser/award-night/shortlists',    label: 'Manage Shortlists',             icon: BookMarked,    color: 'sky' },
  { href: '/organiser/award-night/semifinalists', label: 'Manage Semi Finalist',          icon: Star,          color: 'purple' },
  { href: '/organiser/award-night/finalists',     label: 'Manage Finalist',               icon: Award,         color: 'emerald' },
  { href: '/organiser/award-night/winners',       label: 'Manage Winners',                icon: Trophy,        color: 'gold' },
  { href: '/organiser/award-night/inprogress',    label: 'Manage Inprogress Applicants',  icon: Clock,         color: 'rose' },
];

const COLOR_ACTIVE: Record<string, string> = {
  red:     'bg-red-500 text-white shadow-sm shadow-red-500/30',
  green:   'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
  teal:    'bg-teal-500 text-white shadow-sm shadow-teal-500/30',
  orange:  'bg-orange-500 text-white shadow-sm shadow-orange-500/30',
  blue:    'bg-blue-500 text-white shadow-sm shadow-blue-500/30',
  sky:     'bg-sky-400 text-white shadow-sm shadow-sky-400/30',
  purple:  'bg-purple-500 text-white shadow-sm shadow-purple-500/30',
  emerald: 'bg-green-500 text-white shadow-sm shadow-green-500/30',
  gold:    'bg-gold-gradient text-ink shadow-gold-sm',
  rose:    'bg-rose-500 text-white shadow-sm shadow-rose-500/30',
};

const COLOR_ICON: Record<string, string> = {
  red:     'text-red-400',
  green:   'text-emerald-400',
  teal:    'text-teal-400',
  orange:  'text-orange-400',
  blue:    'text-blue-400',
  sky:     'text-sky-400',
  purple:  'text-purple-400',
  emerald: 'text-green-400',
  gold:    'text-gold',
  rose:    'text-rose-400',
};

export function AwardNightNav() {
  const pathname = usePathname();
  return (
    <div className="mt-4 mb-6 flex flex-wrap gap-2">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              active
                ? COLOR_ACTIVE[t.color]
                : `glass text-white/60 hover:text-white`
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? '' : COLOR_ICON[t.color]}`} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
