import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { JudgeProfileDropdown } from '@/components/judge/JudgeProfileDropdown';

export const runtime = 'nodejs';

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'judge') redirect(user.role === 'organiser' ? '/organiser' : '/account');

  const siteId = await getSiteId();

  // Try to get first name from judges table for a friendlier display
  let displayName = user.email.split('@')[0];
  try {
    const { rows } = await query<{ first_name: string; last_name: string }>(
      `SELECT first_name, last_name FROM judges WHERE user_id = $1 AND site_id = $2 LIMIT 1`,
      [user.sub, siteId],
    );
    if (rows[0]?.first_name) {
      displayName = `${rows[0].first_name} ${rows[0].last_name ?? ''}`.trim();
    }
  } catch { /* table may not exist yet */ }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-white/5 bg-ink/80 px-5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          {/* Logo / brand */}
          <Link href="/judge" className="flex items-center gap-2 font-display text-sm font-bold text-gold/90 tracking-wide">
            <Trophy className="h-4 w-4 text-gold" />
            <span className="hidden sm:inline">Judge Panel</span>
          </Link>

          {/* Profile dropdown with all 7 menu items */}
          <JudgeProfileDropdown name={displayName} email={user.email} />
        </div>
      </header>
      {children}
    </>
  );
}
