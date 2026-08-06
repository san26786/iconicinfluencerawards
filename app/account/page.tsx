import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ClipboardList, CheckCircle, ShoppingBag, Calendar,
  UserCircle, Scale, UtensilsCrossed, Users, UserPlus, KeyRound, LayoutDashboard, UserCog
} from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { nominationsForUser } from '@/lib/nominations';
import { getSite, getSiteId } from '@/lib/site';
import { query } from '@/lib/db';
import { LogoutButton } from '@/components/auth/AuthForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Dashboard' };

const APPLICANT_BUTTONS = [
  { label: 'View My Nominations',      icon: ClipboardList,    href: '/account/nominations' },
  { label: 'Check My Eligibility',     icon: CheckCircle,      href: '/check-eligibility' },
  { label: 'My Orders',                icon: ShoppingBag,      href: '#' },
  { label: 'My Schedule',              icon: Calendar,         href: '#' },
  { label: 'Update My Awards Profile', icon: UserCircle,       href: '/account/profile' },
  { label: 'Become a Judge',           icon: Scale,            href: '/judges' },
  { label: 'Book My Table Now',        icon: UtensilsCrossed,  href: '#' },
  { label: 'Manage My Guest List',     icon: Users,            href: '#' },
  { label: 'Add New Guest',            icon: UserPlus,         href: '#' },
];

const JUDGE_BUTTONS = [
  { label: 'View My Nomination',       icon: ClipboardList,    href: '/account/nominations' },
  { label: 'Check My Eligibility',     icon: CheckCircle,      href: '/check-eligibility' },
  { label: 'My Orders',                icon: ShoppingBag,      href: '#' },
  { label: 'Update My Awards Profile', icon: UserCircle,       href: '/account/profile' },
  { label: 'View Judging Board',       icon: LayoutDashboard,  href: '/judge/board' },
  { label: 'Update Judge Profile',     icon: UserCog,          href: '/judge/profile' },
  { label: 'Book a Table Now',         icon: UtensilsCrossed,  href: '#' },
  { label: 'Manage My Guest List',     icon: Users,            href: '#' },
  { label: 'Add New Guest',            icon: UserPlus,         href: '#' },
];

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role === 'organiser') redirect('/organiser');

  const isJudge = user.role === 'judge';
  const buttons = isJudge ? JUDGE_BUTTONS : APPLICANT_BUTTONS;

  const [nominations, site] = await Promise.all([
    nominationsForUser(user.sub, user.email),
    getSite(),
  ]);

  // For judges: fetch their assigned applications count.
  // judge_applicants/judge_scores.judge_id references judges.id — NOT users.id —
  // so we resolve the judge record from the session user first.
  let judgeAssignedCount = 0;
  let judgeScoredCount = 0;
  if (isJudge) {
    const siteId = await getSiteId();
    const judgeRow = await query<{ id: number }>(
      `SELECT id FROM judges WHERE user_id = $1 AND site_id = $2 LIMIT 1`,
      [user.sub, siteId],
    ).catch(() => ({ rows: [] as { id: number }[] }));
    const judgeId = judgeRow.rows[0]?.id;
    if (judgeId != null) {
      const assigned = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM judge_applicants WHERE judge_id = $1`,
        [judgeId],
      ).catch(() => ({ rows: [{ count: '0' }] }));
      const scored = await query<{ count: string }>(
        `SELECT COUNT(DISTINCT nomination_id) as count FROM judge_scores WHERE judge_id = $1`,
        [judgeId],
      ).catch(() => ({ rows: [{ count: '0' }] }));
      judgeAssignedCount = Number(assigned.rows[0]?.count ?? 0);
      judgeScoredCount = Number(scored.rows[0]?.count ?? 0);
    }
  }

  return (
    <main id="main" className="min-h-screen pb-24 pt-28 sm:pt-36">
      <div className="mx-auto max-w-4xl px-5">

        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-luxe text-gold">
          {isJudge ? 'Judge Dashboard' : 'Your Account'}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
          Welcome to the {site.name}!
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
          {isJudge
            ? 'Thank you for being part of our judging panel. Your expertise and fair assessment help us recognise truly outstanding achievements. Please review your assigned applications and submit your scores.'
            : "Greatness isn't just about what you've achieved — it's about the lives you've touched along the way. Through your application, you're not just seeking recognition; you're sharing a story that can empower others to dream bigger."}
        </p>
        <p className="mt-3 text-sm text-white/40">
          Signed in as <span className="text-white/70">{user.email}</span>
          {isJudge && <span className="ml-2 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">Judge</span>}
        </p>

        {/* Action buttons grid */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {buttons.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${
                (label === 'View Judging Board' || label === 'Update Judge Profile')
                  ? 'border-gold/30 bg-gold/[0.06] text-gold hover:bg-gold/10'
                  : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-gold/30 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-gold/70" />
              {label}
            </Link>
          ))}
        </div>

        {/* Judge stats */}
        {isJudge && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
              <p className="text-3xl font-bold text-gold">{judgeAssignedCount}</p>
              <p className="mt-1 text-xs text-white/40">Applications Assigned</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
              <p className="text-3xl font-bold text-gold">{judgeScoredCount}</p>
              <p className="mt-1 text-xs text-white/40">Applications Scored</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
              <p className="text-3xl font-bold text-gold">{judgeAssignedCount - judgeScoredCount}</p>
              <p className="mt-1 text-xs text-white/40">Pending Review</p>
            </div>
          </div>
        )}

        {/* Awards Entry Dashboard */}
        <div className="mt-10">
          <h2 className="text-center font-display text-2xl font-bold uppercase tracking-widest text-white">
            {isJudge ? 'Judging Dashboard' : 'Awards Entry Dashboard'}
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-16 bg-gold/60" />
        </div>

        {isJudge ? (
          /* Judge CTA */
          <div className="mt-8 rounded-2xl border border-gold/20 bg-gold/[0.05] px-6 py-5">
            <p className="flex items-start gap-2 text-sm font-medium text-gold">
              <span className="mt-0.5">✦</span>
              You have <strong>{judgeAssignedCount - judgeScoredCount}</strong> application{judgeAssignedCount - judgeScoredCount !== 1 ? 's' : ''} awaiting your score.
            </p>
            <Link
              href="/judge/board"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
            >
              Go to Judging Board →
            </Link>
          </div>
        ) : (
          /* Applicant eligibility banner */
          <div className="mt-8 rounded-2xl border border-gold/20 bg-gold/[0.05] px-6 py-5">
            <p className="flex items-start gap-2 text-sm font-medium text-gold">
              <span className="mt-0.5">✦</span>
              You haven&apos;t checked your eligibility yet — you might be eligible for more categories.
            </p>
            <Link
              href="/check-eligibility"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
            >
              Click here to check your eligibility →
            </Link>
          </div>
        )}

        {/* Nominations list for applicants */}
        {!isJudge && nominations.length > 0 && (
          <p className="mt-5 text-xs text-white/30">
            {nominations.length} nomination{nominations.length !== 1 ? 's' : ''} · 0 orders
          </p>
        )}

        {/* Bottom actions */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/account/change-password"
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-gold/40"
          >
            <KeyRound className="h-4 w-4 text-gold" />
            Change password
          </Link>
          <LogoutButton />
        </div>

      </div>
    </main>
  );
}
