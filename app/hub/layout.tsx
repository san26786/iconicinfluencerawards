import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import Link from 'next/link';
import { LayoutGrid, Settings, Users, Globe } from 'lucide-react';

// The Hub used to be gated to one specific domain, because the multi-tenant
// deployment it came from served a dozen brands off this codebase and the
// superadmin area belonged to only one of them. This repo serves a single site,
// so the users.hub_admin flag below is the whole authorisation story.
export const dynamic = 'force-dynamic';

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`, [user.sub],
  );
  if (!rows[0]?.hub_admin) redirect('/organiser');

  const NAV = [
    { href: '/hub/sites',   label: 'Sites',    icon: Globe },
    { href: '/hub/users',   label: 'Users',    icon: Users },
    { href: '/hub/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-ink grain">
      {/* Top bar */}
      <div className="fixed top-[64px] left-0 right-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-md">
        <div className="flex items-center gap-6 px-6 py-3">
          <Link href="/hub/sites" className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-gold" />
            <span className="font-display text-sm font-bold text-white">Superadmin Hub</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-28">
        {children}
      </div>
    </div>
  );
}
