import Link from 'next/link';
import { Trophy, BadgeCheck, HeartHandshake, Building2 } from 'lucide-react';

/**
 * "One account, every role" panel beside the sign-in form.
 *
 * Modelled on the reference login page's role grid, with one deliberate
 * difference: those chips sign you straight in as a shared demo user. That is
 * fine for a product tour and wrong here — this platform holds real nominations,
 * judging scores and organiser controls, so a credential-less way in would be a
 * hole, not a feature. These chips route to the right starting point instead.
 *
 * The copy is also careful not to promise accounts that don't exist yet: only
 * entrants self-register today. Judges apply and are approved, and partner and
 * organiser access is arranged by the team.
 */
const ROLES = [
  {
    icon: Trophy,
    label: 'Entrant',
    body: 'Enter the awards or nominate a business you rate.',
    href: '/register',
    cta: 'Create an account',
  },
  {
    icon: BadgeCheck,
    label: 'Judge',
    body: 'Apply to join the judging panel. Approved judges get an account.',
    href: '/apply-judge',
    cta: 'Apply to judge',
  },
  {
    icon: HeartHandshake,
    label: 'Partner',
    body: 'Sponsorship, hospitality and media partnerships.',
    href: '/partner',
    cta: 'Enquire',
  },
  {
    icon: Building2,
    label: 'Organiser',
    body: 'Run a programme on this platform. Access is set up by our team.',
    href: '/for-organisers',
    cta: 'Learn more',
  },
];

export function RoleSignposts({ siteName }: { siteName: string }) {
  return (
    <div className="rounded-3xl glass p-7 sm:p-8">
      <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
        One account, every role
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-white">
        Sign in once — we know who you are
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        Entrants, judges, partners and organisers all use the same sign-in above.
        {' '}Your {siteName} account remembers what you registered for and opens the
        right place. Not registered yet? Start here.
      </p>

      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {ROLES.map(({ icon: Icon, label, body, href, cta }) => (
          <li key={label}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-gold/40 hover:bg-gold/[0.05]"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-gold" />
                <span className="text-sm font-semibold text-white">{label}</span>
              </span>
              <span className="mt-1.5 flex-1 text-xs leading-relaxed text-white/50">{body}</span>
              <span className="mt-2.5 text-xs font-semibold text-gold/80 transition group-hover:text-gold">
                {cta} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
