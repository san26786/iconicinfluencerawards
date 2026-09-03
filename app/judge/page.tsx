import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId, getSite } from '@/lib/site';
import Link from 'next/link';
import {
  ListChecks, Star, ClipboardList, CheckCircle, ShoppingBag,
  UserCircle, LayoutDashboard, UserCog, UtensilsCrossed, Users,
  UserPlus, KeyRound, Trophy, ArrowRight, BookOpen,
} from 'lucide-react';
import { LogoutButton } from '@/components/auth/AuthForms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Judge Dashboard' };

const JUDGE_BUTTONS = [
  { label: 'View My Nomination',       icon: ClipboardList,   href: '/account/nominations', highlight: false },
  { label: 'Check My Eligibility',     icon: CheckCircle,     href: '/check-eligibility',   highlight: false },
  { label: 'My Orders',                icon: ShoppingBag,     href: '#',                    highlight: false },
  { label: 'Update My Awards Profile', icon: UserCircle,      href: '/judge/profile',       highlight: false },
  { label: 'View Judging Board',       icon: LayoutDashboard, href: '/judge/board',         highlight: true },
  { label: 'Update Judge Profile',     icon: UserCog,         href: '/judge/profile',       highlight: true },
  { label: 'Book a Table Now',         icon: UtensilsCrossed, href: '#',                    highlight: false },
  { label: 'Manage My Guest List',     icon: Users,           href: '#',                    highlight: false },
  { label: 'Add New Guest',            icon: UserPlus,        href: '#',                    highlight: false },
  // Highlighted: a judge who cannot work out the scoring panel needs this more
  // than any of the grey buttons above it.
  { label: 'Judge Guide',              icon: BookOpen,       href: '/judges/guide',        highlight: true },
];

export default async function JudgeDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'judge') redirect('/login');

  const siteId = await getSiteId();
  const site = await getSite();

  // Self-heal tables
  await Promise.all([
    query(`CREATE TABLE IF NOT EXISTS judge_applicants (
      id SERIAL PRIMARY KEY, judge_id INTEGER NOT NULL, nomination_id INTEGER NOT NULL,
      allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (judge_id, nomination_id)
    )`).catch(() => {}),
    query(`CREATE TABLE IF NOT EXISTS judge_scores (
      id SERIAL PRIMARY KEY, judge_id INTEGER NOT NULL, nomination_id INTEGER NOT NULL,
      score INTEGER, notes TEXT, marked_first BOOLEAN, marked_semifinalist BOOLEAN,
      marked_finalist BOOLEAN, scored_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (judge_id, nomination_id)
    )`).catch(() => {}),
  ]);

  // Find judge record
  const { rows: judgeRows } = await query<{ id: number; first_name: string; last_name: string }>(
    `SELECT id, first_name, last_name FROM judges WHERE user_id = $1 AND site_id = $2 LIMIT 1`,
    [user.sub, siteId],
  );
  const judge = judgeRows[0];

  let stats = { allocated: 0, scored: 0, unscored: 0 };
  let assignedNominations: { id: number; category: string; applicant: string; scored: boolean }[] = [];

  if (judge) {
    const { rows: statRows } = await query<{ allocated: string; scored: string }>(
      `SELECT COUNT(ja.id)::text AS allocated, COUNT(js.id)::text AS scored
       FROM judge_applicants ja
       LEFT JOIN judge_scores js ON js.judge_id = ja.judge_id AND js.nomination_id = ja.nomination_id
       WHERE ja.judge_id = $1`,
      [judge.id],
    );
    if (statRows[0]) {
      const allocated = Number(statRows[0].allocated);
      const scored = Number(statRows[0].scored);
      stats = { allocated, scored, unscored: allocated - scored };
    }

    // Fetch assigned nominations
    const { rows: nomRows } = await query<{
      nomination_id: number; category: string; first_name: string; last_name: string; scored: boolean;
    }>(
      `SELECT ja.nomination_id,
              COALESCE(n.category_name, 'Uncategorised') AS category,
              COALESCE(n.first_name, '') AS first_name,
              COALESCE(n.last_name, '') AS last_name,
              (js.id IS NOT NULL) AS scored
       FROM judge_applicants ja
       JOIN nominations n ON n.id = ja.nomination_id
       LEFT JOIN judge_scores js ON js.judge_id = ja.judge_id AND js.nomination_id = ja.nomination_id
       WHERE ja.judge_id = $1
       ORDER BY scored, ja.allocated_at DESC
       LIMIT 20`,
      [judge.id],
    ).catch(() => ({ rows: [] }));

    assignedNominations = nomRows.map(r => ({
      id: r.nomination_id,
      category: r.category,
      applicant: `${r.first_name} ${r.last_name}`.trim() || 'Applicant',
      scored: Boolean(r.scored),
    }));
  }

  const firstName = judge?.first_name ?? user.email.split('@')[0];

  return (
    <main className="min-h-screen pb-24 pt-28">
      <div className="mx-auto max-w-4xl px-5">

        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-luxe text-gold">Judge Dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
          Welcome to the {site.name}!
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
          Thank you for being part of our independent judging panel. Your expertise ensures a rigorous and fair
          selection process. Please review your assigned applications and submit your scores before the deadline.
        </p>
        <p className="mt-3 text-sm text-white/40">
          Hello, <span className="text-white/70">{firstName}</span>
          <span className="ml-2 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">Judge</span>
        </p>

        {/* Action buttons 3×3 grid */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {JUDGE_BUTTONS.map(({ label, icon: Icon, href, highlight }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${
                highlight
                  ? 'border-gold/40 bg-gold/[0.08] text-gold hover:bg-gold/15'
                  : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-gold/30 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-gold/70" />
              {label}
            </Link>
          ))}
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Applications Assigned', value: stats.allocated, icon: ClipboardList, colour: 'text-white/70' },
            { label: 'Applications Scored',   value: stats.scored,    icon: Star,          colour: 'text-green-400' },
            { label: 'Pending Review',         value: stats.unscored,  icon: ListChecks,    colour: 'text-gold' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/5 ${s.colour}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/45">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Judging Dashboard */}
        <div className="mt-10">
          <h2 className="text-center font-display text-2xl font-bold uppercase tracking-widest text-white">
            Judging Dashboard
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-16 bg-gold/60" />
        </div>

        {/* Assigned applications */}
        <div className="mt-8">
          {assignedNominations.length === 0 ? (
            <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] px-6 py-6 text-center">
              <p className="text-sm text-gold/80">
                No applications assigned yet. The organiser will allocate entries to you shortly.
              </p>
              <Link
                href="/judge/board"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
              >
                Go to My Board <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedNominations.map((nom, i) => (
                <div
                  key={nom.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4"
                >
                  <span className="text-xs font-semibold text-white/25 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{nom.category}</p>
                    <p className="text-xs text-white/40 mt-0.5">{nom.applicant}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    nom.scored
                      ? 'border border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border border-gold/30 bg-gold/10 text-gold'
                  }`}>
                    {nom.scored ? 'Scored' : 'Pending'}
                  </span>
                  <Link
                    href={`/judge/board`}
                    className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/50 hover:border-gold/30 hover:text-gold transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))}

              <div className="pt-2 text-center">
                <Link
                  href="/judge/board"
                  className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-bold text-ink shadow-gold transition hover:opacity-90"
                >
                  <ListChecks className="h-4 w-4" /> Go to My Judging Board
                </Link>
              </div>
            </div>
          )}
        </div>

        {stats.unscored === 0 && stats.allocated > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4">
            <Trophy className="h-5 w-5 flex-shrink-0 text-green-400" />
            <p className="text-sm text-green-200">
              All {stats.allocated} applications scored — great work!
            </p>
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/account/change-password"
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-gold/40"
          >
            <KeyRound className="h-4 w-4 text-gold" />
            Change Password
          </Link>
          <LogoutButton />
        </div>

      </div>
    </main>
  );
}
