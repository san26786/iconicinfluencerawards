"use client";

// Shared sub-navigation across the organiser area.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Mail,
  Workflow,
  Send,
  Ban,
  Settings2,
  Scale,
  Trophy,
  CalendarDays,
  Gavel,
  Palette,
  Building2,
  UsersRound,
  ShoppingBag,
  Layers,
  BookOpen,
} from "lucide-react";

// These links used to be filtered by hostname, because the multi-tenant
// deployment this came from only exposed the superadmin area on one brand's
// domain. On a single-tenant site every organiser link is shown; /hub/* is
// still gated server-side by users.hub_admin (see app/hub/layout.tsx), so a
// non-admin following the link is simply redirected back.
const LINKS: { href: string; label: string; icon: React.ElementType; exact?: boolean }[] = [
  {
    href: "/organiser",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/organiser/site-settings", label: "Site Settings", icon: Settings2 },
  { href: "/organiser/themes", label: "Themes", icon: Palette },
  { href: "/organiser/roles", label: "Roles", icon: UsersRound },
  { href: "/organiser/products", label: "Products & Services", icon: ShoppingBag },
  {
    href: "/organiser/potential-users",
    label: "Potential Users",
    icon: UserPlus,
  },
  { href: "/organiser/events", label: "Manage Event", icon: CalendarDays },
  { href: "/organiser/industries", label: "Industries", icon: Layers },
  { href: "/organiser/manage-judge",   label: "Manage Judges",  icon: Scale },
  { href: "/organiser/judging-panel",  label: "Judging Panel",  icon: Gavel },
  { href: "/organiser/award-night",    label: "Award Night",    icon: Trophy },
  { href: "/organiser/email-templates", label: "Email Templates", icon: Mail },
  { href: "/organiser/email-flows", label: "Email Flows", icon: Workflow },
  { href: "/organiser/email-jobs", label: "Send Queue", icon: Send },
  { href: "/organiser/unsubscribes", label: "Unsubscribes", icon: Ban },
  { href: "/organiser/question-library", label: "Question Library", icon: BookOpen },
  { href: "/hub/sites", label: "Hub — Sites", icon: Building2 },
];

export function OrganiserNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {LINKS.map((l) => {
        const Icon = l.icon;
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-gold-gradient text-ink shadow-gold-sm"
                : "glass text-white/75 hover:border-gold/40 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
