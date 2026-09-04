import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Trophy, Users, Mic2, Camera, Handshake,
  Sparkles, Globe, Building2, Star, Crown, Gem, Calendar, Clock,
  MapPin, Mail, Phone, Car, TrainFront, Accessibility, BedDouble,
  ChevronRight, Award, Scale, Newspaper, PartyPopper,
} from 'lucide-react';
import { BrochureFlipbook, type BrochureSlide } from '@/components/BrochureFlipbook';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CEREMONY_WINDOW, THEMES } from '@/lib/content';
import { getSite, getSiteId } from '@/lib/site';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Show Brochure',
    description:
      `Everything about ${site.name} ${site.year} in one place — the programme, themes, award categories, who attends, the venue, partnership packages and how to get involved.`,
  };
}

// ── Static content ───────────────────────────────────────────────────────────

const NETWORKING = [
  'Introductions between finalists, sponsors and buyers',
  'Judge and industry-leader meet-and-greets',
  'Table-hosted networking arranged by sector',
  'Access to press, media partners and civic guests',
];

const PURPOSE = [
  'Showcase the businesses genuinely driving the local economy forward',
  'Give independent, credible recognition that customers and staff trust',
  'Bring founders, funders, corporates and public bodies into one room',
  'Celebrate the people behind the results — teams, not just logos',
  'Build relationships that keep working long after the day ends',
];

const PROGRAMME = [
  { icon: Calendar, title: 'One-day awards programme', body: 'Doors from 10:00am, running through to the close at 4:30pm.' },
  { icon: Mic2, title: 'Opening address & keynote', body: 'The organisers set the scene, followed by a keynote from a leader who has built something worth recognising.' },
  { icon: Scale, title: 'Judging in the open', body: 'A public walkthrough of how entries are scored, so every finalist knows the result was earned.' },
  { icon: Trophy, title: 'Category-by-category ceremony', body: 'Each award presented on stage with the finalists named and the winner announced live.' },
  { icon: Handshake, title: 'Finalists’ reception', body: 'A dedicated networking hour for shortlisted businesses, judges and partners before the ceremony.' },
  { icon: Star, title: 'Partner & sponsor showcase', body: 'Branded spaces where sponsors meet the room properly — not just a logo on a slide.' },
  { icon: Camera, title: 'Press & content studio', body: 'Professional photography, winner interviews and social-ready assets captured on the day.' },
  { icon: PartyPopper, title: 'Lunch & networking', body: 'A served lunch and the part of the day where the real conversations happen.' },
];

// One day, 10:00–16:30 — see CEREMONY_WINDOW. This used to be split across
// DAY_ONE and DAY_TWO, which described a two-day programme this ceremony is not.
// Timings mirror the running order on /venue.
const RUNNING_ORDER = [
  { time: '10:00am', item: 'Registration, welcome refreshments and guest arrivals' },
  { time: '10:30am', item: 'Opening address from the organising team' },
  { time: '11:00am', item: 'Ceremony Part I — theme award presentations' },
  { time: '12:30pm', item: 'Networking lunch, arranged by sector' },
  { time: '1:30pm', item: 'Ceremony Part II — flagship categories' },
  { time: '3:00pm', item: 'Winners’ announcement, trophies and photography' },
  { time: '3:30pm', item: 'Partner showcase, press and open networking' },
  { time: '4:30pm', item: 'Closing remarks' },
];

const WHO_YOU_MEET = [
  'Founders & entrepreneurs',
  'SME owners and directors',
  'Corporate and enterprise leaders',
  'Marketing, brand and comms teams',
  'Investors, funders and lenders',
  'Accountants and financial advisers',
  'Legal and professional advisers',
  'HR and people leaders',
  'Agencies and consultancies',
  'Technology and startup founders',
  'Local authorities and public bodies',
  'Chambers, trade bodies and associations',
  'Press, media and content partners',
  'Charity and community leaders',
];

const WHY_NOW = [
  {
    icon: Globe,
    title: 'A market the world watches',
    body: 'Businesses here compete on an international stage. Recognition earned in this room carries weight well beyond it.',
  },
  {
    icon: Award,
    title: 'Recognition that opens doors',
    body: 'A shortlist or a win is third-party proof — the kind that shortens sales conversations and settles procurement questions.',
  },
  {
    icon: Scale,
    title: 'Independent, transparent judging',
    body: 'An external panel, published criteria and scored entries. Nobody buys a trophy here.',
  },
  {
    icon: Users,
    title: 'Your people deserve the spotlight',
    body: 'Awards nights are the rare moment when the team that did the work stands under the lights and gets thanked publicly.',
  },
  {
    icon: Sparkles,
    title: 'Proof that outlasts advertising',
    body: 'A campaign runs out. A badge on your site, your emails and your bids keeps working all year.',
  },
  {
    icon: Handshake,
    title: 'Partnerships that outlast the day',
    body: 'Finalists, sponsors and judges stay connected through the wider awards community long after the ceremony ends.',
  },
];

const VENUE_POINTS = [
  { icon: Car, title: 'Parking', body: 'On-site and nearby parking available for guests arriving by car.' },
  { icon: TrainFront, title: 'Rail & air', body: 'Well connected by rail and within easy reach of the main airports.' },
  { icon: Accessibility, title: 'Accessible', body: 'Step-free access throughout, with accessible seating on request.' },
  { icon: BedDouble, title: 'Hotels', body: 'Adjoining and nearby hotels for guests travelling in for the ceremony.' },
];

const COUNTRIES = [
  'UAE', 'USA', 'India', 'Canada', 'Australia', 'Singapore', 'Ireland',
  'Portugal', 'Spain', 'Greece', 'Türkiye', 'Germany', 'France',
  'Netherlands', 'Belgium', 'Italy', 'Poland', 'Denmark', 'Austria',
  'Cyprus', 'Malaysia', 'Japan', 'New Zealand', 'South Africa', 'Nigeria',
  'Kuwait', 'Mauritius', 'Brazil',
];

const REACH = ['India', 'UAE', 'Portugal', 'Spain', 'Singapore', 'Canada', 'Australia', 'Greece', 'Türkiye', 'USA'];

const PACKAGES = [
  {
    tier: 'Headline Partner',
    name: 'Palladium',
    icon: Crown,
    accent: 'text-gold',
    border: 'border-gold/30',
    bg: 'from-gold/[0.12] to-gold/[0.02]',
    featured: true,
    before: [
      'Headline billing across all pre-event marketing',
      'Named partner of the flagship award category',
      'Logo lock-up on the site, emails and entry pages',
      'First choice of ceremony table and stand position',
    ],
    during: [
      'Opening keynote or welcome address slot',
      'Present the flagship award on stage',
      'Host the VIP and finalists’ reception',
      'Largest premium stand and full VIP pass allocation',
    ],
    after: [
      'Headline billing in all post-event coverage',
      'Full attendee and engagement insight report',
      'First refusal on the same tier next year',
    ],
  },
  {
    tier: 'Category Partner',
    name: 'Platinum',
    icon: Gem,
    accent: 'text-violet-300',
    border: 'border-violet-400/25',
    bg: 'from-violet-500/[0.12] to-violet-500/[0.02]',
    featured: false,
    before: [
      'Platinum partner status across event marketing',
      'Sponsorship of a named theme or award category',
      'Logo placement on the site and campaign emails',
    ],
    during: [
      'Large stand in a prime position',
      'Speaking slot within the programme',
      'Present your sponsored category on stage',
      'Branding across your sponsored theme',
    ],
    after: [
      'Named in the post-event report and coverage',
      'Attendee overview and engagement summary',
      'Preferential renewal terms for next year',
    ],
  },
  {
    tier: 'Supporting Partner',
    name: 'Diamond',
    icon: Star,
    accent: 'text-cyan-300',
    border: 'border-cyan-400/25',
    bg: 'from-cyan-500/[0.12] to-cyan-500/[0.02]',
    featured: false,
    before: [
      'Partner listing on the official website',
      'Logo placement across selected campaigns',
      'Inclusion in the group partner announcement',
    ],
    during: [
      'Stand in a strong floor position',
      'Branded feature placement at the ceremony',
      'Exhibitor and VIP pass allocation',
    ],
    after: [
      'Listed in the post-event report',
      'Thank-you feature across social channels',
      'Early booking access for next year',
    ],
  },
];

const SPONSOR_BENEFITS = [
  { icon: Trophy, title: 'Elevate your brand', body: 'Align your name with excellence, in front of an audience that already respects the businesses on stage.' },
  { icon: Users, title: 'Exclusive access', body: 'Sit with finalists, judges and decision-makers rather than chasing them afterwards.' },
  { icon: Sparkles, title: 'Showcase what you do', body: 'Demonstrate your product or service to a room that has arrived ready to talk business.' },
  { icon: Newspaper, title: 'Visibility that lasts', body: 'Press coverage, photography and year-round promotion carry your brand well past the day itself.' },
];

const QUICK_LINKS = [
  { label: 'Submit a nomination', href: '/register-interest' },
  { label: 'Browse award categories', href: '/categories' },
  { label: 'Explore the themes', href: '/themes' },
  { label: 'Partner & sponsorship', href: '/partner' },
  { label: 'Apply to judge', href: '/judges' },
  { label: 'Talk to the team', href: '/contact' },
];

// Chapter chips shown on the cover — hrefs match the slide ids below, and the
// flipbook turns those anchor clicks into slide moves.
const SECTION_INDEX = [
  { n: '01', label: 'Key Features', href: '#key-features' },
  { n: '02', label: 'Programme', href: '#programme' },
  { n: '03', label: 'Themes', href: '#themes' },
  { n: '04', label: 'What’s On', href: '#whats-on' },
  { n: '05', label: 'Who You’ll Meet', href: '#who' },
  { n: '06', label: 'Why Now', href: '#why-now' },
  { n: '07', label: 'Make Your Move', href: '#move' },
  { n: '08', label: 'The Venue', href: '#venue' },
  { n: '09', label: 'International', href: '#international' },
  { n: '10', label: 'The Organiser', href: '#organiser' },
  { n: '11', label: 'Partnership', href: '#packages' },
  { n: '12', label: 'Sponsorship', href: '#sponsorship' },
];

// ── Data ─────────────────────────────────────────────────────────────────────

type ThemeRow = {
  name: string;
  theme: string | null;
  tagline: string | null;
  description: string | null;
  icon: string;
};

async function getThemes(siteId: number): Promise<ThemeRow[]> {
  try {
    const { rows } = await query<ThemeRow>(
      `SELECT name, theme, tagline, description, icon
         FROM themes
        WHERE is_hidden = false
          AND (
            site_id = $1
            OR linked_site_id = $1
            OR $1 = ANY(COALESCE(linked_site_ids, '{}'::integer[]))
          )
        ORDER BY display_order, id`,
      [siteId],
    );
    return rows;
  } catch {
    return [];
  }
}

async function countCategories(siteId: number): Promise<number> {
  try {
    const { rows } = await query<{ n: string }>(
      `SELECT COUNT(*)::text AS n
         FROM event_categories ec
         JOIN events e ON e.id = ec.event_id
         JOIN themes t ON t.id = ec.theme_id
        WHERE ec.is_active = true
          AND e.status != 'cancelled'
          AND (
            e.site_id = $1
            OR t.linked_site_id = $1
            OR $1 = ANY(COALESCE(t.linked_site_ids, '{}'::integer[]))
          )`,
      [siteId],
    );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

// ── Slide chrome ─────────────────────────────────────────────────────────────

/**
 * One full-screen page of the brochure. Short sections sit centred; taller ones
 * scroll inside the slide.
 *
 * `safe center` rather than plain `center`: when centred content is taller than
 * the slide, ordinary centring overflows it equally in both directions, and the
 * top half ends up behind the fixed header with no way to scroll back up to it.
 * `safe` drops the alignment back to the start in exactly that case.
 */
function Slide({
  tone = 'ink',
  children,
}: {
  tone?: 'ink' | 'slate';
  children: React.ReactNode;
}) {
  return (
    <section
      // Even padding, and much less of it than there was. The old figures
      // cleared two things that are no longer over the slide: a site header
      // above it and a floating Prev/Next below. The deck chrome now sits in
      // bars of its own, outside the stage, so 192px of the screen was being
      // held back from content that was then shrunk to fit what was left.
      className={`relative flex min-h-full flex-col [justify-content:safe_center] overflow-hidden py-10 sm:py-12 ${
        tone === 'ink' ? 'bg-ink' : 'bg-slate950'
      }`}
    >
      {children}
    </section>
  );
}

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <span className="eyebrow mb-4 justify-center">
      <span className="font-display text-base font-bold text-gold/70">{n}</span>
      <span className="h-px w-6 bg-gold/60" />
      {children}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BrochurePage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);
  const [dbThemes, categoryCount] = await Promise.all([
    getThemes(siteId),
    countCategories(siteId),
  ]);

  const themes: ThemeRow[] = dbThemes.length
    ? dbThemes
    : THEMES.map(t => ({
        name: t.name,
        theme: t.theme,
        tagline: t.tagline,
        description: t.desc,
        icon: t.icon,
      }));

  const city = site.event_city ?? 'the city';
  const venue = site.venue ?? '';
  const venueShort = site.venue_short ?? venue;
  const dateLong = site.event_date_long ?? site.event_date ?? '';
  const company = site.company ?? 'B2B Growth Hub Limited';

  const slides: BrochureSlide[] = [
    // ── Cover ──────────────────────────────────────────────────────────────
    {
      id: 'cover',
      label: 'Cover',
      content: (
        <Slide>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[68rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.09] blur-[150px]" />
          <div className="container-luxe section-pad relative z-10 text-center">
            <Reveal>
              <span className="eyebrow mb-6 justify-center gap-3">
                <span className="h-px w-8 bg-gold/60" />
                Show Brochure · {site.year}
                <span className="h-px w-8 bg-gold/60" />
              </span>
              <h1 className="font-display text-4xl font-bold leading-[1.08] text-white text-balance sm:text-5xl lg:text-6xl">
                {site.name} {site.year}
                <br />
                <span className="text-gold-gradient">Everything, In One Place</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 text-balance sm:text-lg">
                {site.tagline ??
                  'Recognising the businesses, entrepreneurs and leaders shaping the future.'}{' '}
                This is the full picture — the programme, the themes, the room, the venue
                and every way to get involved.
              </p>

              <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                {[
                  { icon: Calendar, label: dateLong || 'Dates to be announced' },
                  { icon: Clock, label: '10:00 AM – late' },
                  { icon: MapPin, label: venueShort || city },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-center gap-2.5 rounded-2xl glass px-4 py-3">
                    <f.icon className="h-4 w-4 shrink-0 text-gold" />
                    <span className="text-sm text-white/75">{f.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register-interest"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-8 py-4 text-sm font-bold uppercase tracking-wider text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
                >
                  Nominate — It&apos;s Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/partner"
                  className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Become a Partner
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Contents — each chip turns the brochure to that section */}
              <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-2">
                {SECTION_INDEX.map(s => (
                  <a
                    key={s.href}
                    href={s.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/55 transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    <span className="font-display font-bold text-gold/60">{s.n}</span>
                    {s.label}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </Slide>
      ),
    },

    // ── 01 Key Features ────────────────────────────────────────────────────
    {
      id: 'key-features',
      label: 'Key Features',
      content: (
        <Slide tone="slate">
          <div className="container-luxe section-pad">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="01">Key Features</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                The whole business community, <span className="text-gold-gradient">under one roof</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                {site.name} is not a dinner with a trophy at the end. It is {site.ceremonies_count ?? 2} ceremonies,
                a full networking programme and a room built deliberately so that the people who should
                meet each other actually do.
              </p>
            </Reveal>

            <div className="grid gap-6 lg:grid-cols-2">
              <Reveal>
                <div className="h-full rounded-2xl glass p-8">
                  <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                    <Handshake className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white">Networking opportunities</h3>
                  <ul className="mt-4 space-y-2.5">
                    {NETWORKING.map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/60">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal>
                <div className="h-full rounded-2xl glass p-8">
                  <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white">What the awards set out to do</h3>
                  <ul className="mt-4 space-y-2.5">
                    {PURPOSE.map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/60">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </Slide>
      ),
    },

    // ── 02 Programme Format ────────────────────────────────────────────────
    {
      id: 'programme',
      label: 'Programme Format',
      content: (
        <Slide>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[45rem] w-[65rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[160px]" />
          <div className="container-luxe section-pad relative">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="02">Programme Format</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Eight ways the day <span className="text-gold-gradient">are put to work</span>
              </h2>
            </Reveal>
            <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
              {PROGRAMME.map(p => (
                <RevealItem key={p.title}>
                  <div className="h-full rounded-2xl border border-white/8 bg-white/[0.025] p-6">
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
                      <p.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-base font-semibold text-white">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{p.body}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Slide>
      ),
    },

    // ── 03 Focused Themes ──────────────────────────────────────────────────
    {
      id: 'themes',
      label: 'Focused Themes',
      content: (
        <Slide tone="slate">
          <div className="container-luxe section-pad">
            <Reveal className="mx-auto mb-8 max-w-3xl text-center">
              <SectionLabel n="03">Focused Themes</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                {themes.length} themes, <span className="text-gold-gradient">one ceremony</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                Each theme is its own world of recognition
                {categoryCount > 0 ? `, and together they carry ${categoryCount} award categories` : ''} —
                distinct areas of focus, united by a single vision.
              </p>
            </Reveal>
            {/* Four across on a wide screen: seven themes is three rows at
                three columns, and the third row is what pushed this slide past
                the height of a laptop screen. */}
            <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" stagger={0.07}>
              {themes.map(t => (
                <RevealItem key={t.name}>
                  <div className="h-full rounded-2xl glass p-5">
                    <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                      <Icon name={(t.icon || 'Trophy') as IconName} className="h-5 w-5" />
                    </span>
                    {t.theme && (
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/60">{t.theme}</p>
                    )}
                    <h3 className="mt-1 font-display text-lg font-semibold text-white">{t.name}</h3>
                    {/* Clamped, because these come from the database and one of
                        them is five times the length of the others — a single
                        long theme stretched its whole grid row and took the
                        slide past the height of the screen. The full text is a
                        click away on /categories. */}
                    {t.tagline && <p className="mt-1 line-clamp-2 text-sm text-white/45">{t.tagline}</p>}
                    {t.description && (
                      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/55">{t.description}</p>
                    )}
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal className="mt-6 text-center">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                See every award category
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </Slide>
      ),
    },

    // ── 04 What's On ───────────────────────────────────────────────────────
    {
      id: 'whats-on',
      label: 'What’s On',
      content: (
        <Slide>
          <div className="container-luxe section-pad">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="04">What&apos;s On</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                One day, <span className="text-gold-gradient">eight moments</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                {dateLong ? `${dateLong}, ${CEREMONY_WINDOW.label} — ` : ''}the running order below
                is indicative and will be confirmed closer to the ceremony.
              </p>
            </Reveal>
            <div className="mx-auto max-w-2xl">
              <Reveal>
                <ol className="space-y-2.5">
                  {RUNNING_ORDER.map(({ time, item }) => (
                    <li
                      key={time}
                      className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4"
                    >
                      <span className="mt-0.5 inline-flex shrink-0 items-center gap-2 font-display text-sm font-semibold text-gold">
                        <Clock className="h-3.5 w-3.5" />
                        {time}
                      </span>
                      <span className="text-sm leading-relaxed text-white/60">{item}</span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
          </div>
        </Slide>
      ),
    },

    // ── 05 Who You'll Meet ─────────────────────────────────────────────────
    {
      id: 'who',
      label: 'Who You’ll Meet',
      content: (
        <Slide tone="slate">
          <div className="container-luxe section-pad">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="05">Who You&apos;ll Meet</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                The room is <span className="text-gold-gradient">the whole value chain</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                Finalists, their teams, their advisers, their funders and the people who
                write about them — the whole chain in one room.
              </p>
            </Reveal>
            <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
              {WHO_YOU_MEET.map(w => (
                <RevealItem key={w}>
                  <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3.5">
                    <Users className="h-4 w-4 shrink-0 text-gold" />
                    <span className="text-sm text-white/70">{w}</span>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Slide>
      ),
    },

    // ── 06 Why Now ─────────────────────────────────────────────────────────
    {
      id: 'why-now',
      label: `${city}’s Moment`,
      content: (
        <Slide>
          <div className="pointer-events-none absolute left-1/4 top-1/4 h-[35rem] w-[35rem] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[140px]" />
          <div className="container-luxe section-pad relative">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="06">{city}&apos;s Moment</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Why these awards, <span className="text-gold-gradient">why now</span>
              </h2>
            </Reveal>
            <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
              {WHY_NOW.map(r => (
                <RevealItem key={r.title}>
                  <div className="h-full rounded-2xl glass p-7">
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-gradient text-ink shadow-gold-sm">
                      <r.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-base font-semibold text-white">{r.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{r.body}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Slide>
      ),
    },

    // ── 07 Make Your Move ──────────────────────────────────────────────────
    {
      id: 'move',
      label: 'Make Your Move',
      content: (
        <Slide tone="slate">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[58rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.07] blur-[140px]" />
          <div className="container-luxe section-pad relative text-center">
            <Reveal>
              <SectionLabel n="07">Make Your Move</SectionLabel>
              <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight text-white text-balance sm:text-5xl">
                Claim your place. Be seen. <span className="text-gold-gradient">Be remembered.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 text-balance">
                This is the day ambition, hard work and recognition finally meet in the same room.
                Where good businesses become known ones — and the people behind them get their moment.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register-interest"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-8 py-4 text-sm font-bold uppercase tracking-wider text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
                >
                  Submit a Nomination
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/partner"
                  className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Partner With Us
                </Link>
              </div>
              <p className="mt-6 text-xs text-white/30">
                Free to enter · Takes 10 minutes · No payment, ever
              </p>
            </Reveal>
          </div>
        </Slide>
      ),
    },

    // ── 08 The Venue ───────────────────────────────────────────────────────
    {
      id: 'venue',
      label: 'The Venue',
      content: (
        <Slide>
          <div className="container-luxe section-pad">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="08">The Venue</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Why <span className="text-gold-gradient">{city}</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                {city} is where ambition, capital and talent already meet — which makes it the right
                place to recognise the businesses doing it best.
                {venue ? ` The ceremony is hosted at ${venue}.` : ''}
              </p>
            </Reveal>
            <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
              {VENUE_POINTS.map(v => (
                <RevealItem key={v.title}>
                  <div className="h-full rounded-2xl glass p-7 text-center">
                    <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
                      <v.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-base font-semibold text-white">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{v.body}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
            {venue && (
              <Reveal className="mt-8 text-center">
                <p className="inline-flex items-center gap-2.5 rounded-2xl glass px-6 py-4 text-sm text-white/70">
                  <MapPin className="h-4 w-4 shrink-0 text-gold" />
                  {venue}
                </p>
              </Reveal>
            )}
          </div>
        </Slide>
      ),
    },

    // ── 09 International ───────────────────────────────────────────────────
    {
      id: 'international',
      label: 'International',
      content: (
        <Slide tone="slate">
          <div className="container-luxe section-pad">
            <Reveal className="mx-auto mb-9 max-w-3xl text-center">
              <SectionLabel n="09">International</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Invited countries and <span className="text-gold-gradient">business delegations</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                Businesses and trade delegations from across the world are invited to attend, nominate
                and partner — bringing an international dimension to the room.
              </p>
            </Reveal>
            <RevealGroup className="flex flex-wrap justify-center gap-2.5" stagger={0.02}>
              {COUNTRIES.map(c => (
                <RevealItem key={c}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/65">
                    <Globe className="h-3.5 w-3.5 text-gold/70" />
                    {c}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal className="mt-8 text-center">
              <p className="text-xs text-white/30">
                Country participation is subject to confirmation and mutual agreement.
              </p>
            </Reveal>
          </div>
        </Slide>
      ),
    },

    // ── 10 The Organiser ───────────────────────────────────────────────────
    {
      id: 'organiser',
      label: 'The Organiser',
      content: (
        <Slide>
          <div className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[140px]" />
          <div className="container-luxe section-pad relative">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="10">The Organiser</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Run by <span className="text-gold-gradient">{company}</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                We believe businesses grow faster through direct contact than through marketing spend
                alone. {site.name} exists to put the right people in the same room and give the ones
                doing exceptional work the recognition that follows them for years.
              </p>
            </Reveal>
            <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.08}>
              <RevealItem>
                <div className="h-full rounded-2xl glass p-7">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-white">The ceremony</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {venue || `${city} — venue to be confirmed`}
                  </p>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="h-full rounded-2xl glass p-7">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-white">Corporate office</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {site.address ?? company}
                  </p>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="h-full rounded-2xl glass p-7">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                    <Globe className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-white">International reach</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{REACH.join(' · ')}</p>
                </div>
              </RevealItem>
            </RevealGroup>
          </div>
        </Slide>
      ),
    },

    // ── 11 Partnership Packages ────────────────────────────────────────────
    {
      id: 'packages',
      label: 'Partnership Packages',
      content: (
        <Slide tone="slate">
          <div className="container-luxe section-pad">
            <Reveal className="mx-auto mb-7 max-w-3xl text-center">
              <SectionLabel n="11">Partnership Packages</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Three tiers, <span className="text-gold-gradient">one partnership</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                Every tier works before, during and after the ceremony — because visibility that stops
                at the door isn&apos;t worth paying for.
              </p>
            </Reveal>
            {/* Three across from tablet width, not from desktop. One column of
                three packages is the tallest thing in the deck by a distance —
                on an iPad it was the last slide that still could not be fitted
                to the screen. */}
            <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.09}>
              {PACKAGES.map(p => (
                <RevealItem key={p.name}>
                  <div className={`h-full rounded-2xl border ${p.border} bg-gradient-to-br ${p.bg} p-5`}>
                    {p.featured && (
                      <span className="mb-4 inline-flex rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                        Headline tier
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${p.border} bg-white/5 ${p.accent}`}>
                        <p.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-semibold text-white">{p.name}</h3>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${p.accent}`}>{p.tier}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wider text-white/35">Investment on application</p>

                    {[
                      { label: 'Before the ceremony', items: p.before },
                      { label: 'On the day', items: p.during },
                      { label: 'After the event', items: p.after },
                    ].map(block => (
                      <div key={block.label} className="mt-4">
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                          {block.label}
                        </p>
                        <ul className="space-y-1.5">
                          {block.items.map(item => (
                            <li key={item} className="flex items-start gap-2 text-sm leading-snug text-white/60">
                              <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${p.accent}`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal className="mt-7 text-center">
              <p className="text-xs text-white/30">
                Sponsorship is subject to availability and written agreement.
              </p>
            </Reveal>
          </div>
        </Slide>
      ),
    },

    // ── 12 Sponsorship ─────────────────────────────────────────────────────
    {
      id: 'sponsorship',
      label: 'Sponsorship',
      content: (
        <Slide>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[62rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[150px]" />
          <div className="container-luxe section-pad relative">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <SectionLabel n="12">Sponsorship</SectionLabel>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Attractive sponsorship opportunities <span className="text-gold-gradient">across the ceremony</span>
              </h2>
            </Reveal>
            <RevealGroup className="grid gap-6 sm:grid-cols-2" stagger={0.08}>
              {SPONSOR_BENEFITS.map(b => (
                <RevealItem key={b.title}>
                  <div className="flex h-full gap-5 rounded-2xl glass p-7">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-gradient text-ink shadow-gold-sm">
                      <b.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-white">{b.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{b.body}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/partner"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-8 py-4 text-sm font-bold uppercase tracking-wider text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
              >
                Explore Sponsorship
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/judges"
                className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Apply to Judge
              </Link>
            </Reveal>
          </div>
        </Slide>
      ),
    },

    // ── Contact & Links ────────────────────────────────────────────────────
    {
      id: 'contact-links',
      label: 'Contact & Links',
      content: (
        <Slide tone="slate">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.07] blur-[150px]" />
          <div className="container-luxe section-pad relative">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <span className="eyebrow mb-4 justify-center">
                <span className="h-px w-6 bg-gold/60" />
                Contact &amp; Links
              </span>
              <h2 className="font-display text-3xl font-semibold text-white text-balance sm:text-4xl">
                Ready when <span className="text-gold-gradient">you are</span>
              </h2>
            </Reveal>

            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                site.email && {
                  icon: Mail, label: 'General enquiries', value: site.email, href: `mailto:${site.email}`,
                },
                site.phone_display && {
                  icon: Phone, label: 'Telephone', value: site.phone_display, href: site.phone_href ?? undefined,
                },
                site.address && { icon: Building2, label: 'Corporate office', value: site.address },
                venue && { icon: MapPin, label: 'Ceremony venue', value: venue },
              ]
                .filter(Boolean)
                .map(c => {
                  const item = c as { icon: typeof Mail; label: string; value: string; href?: string };
                  const body = (
                    <>
                      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">{item.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/70">{item.value}</p>
                    </>
                  );
                  return item.href ? (
                    <a
                      key={item.label}
                      href={item.href}
                      className="rounded-2xl glass p-6 transition-colors hover:border-gold/40"
                    >
                      {body}
                    </a>
                  ) : (
                    <div key={item.label} className="rounded-2xl glass p-6">
                      {body}
                    </div>
                  );
                })}
            </div>

            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
              {QUICK_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  {l.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>

            <p className="mt-10 text-center text-xs leading-relaxed text-white/30">
              {site.legal ?? `${site.name} — presented by ${company}.`}
            </p>
          </div>
        </Slide>
      ),
    },
  ];

  return (
    <main id="main" className="bg-ink">
      <BrochureFlipbook
        slides={slides}
        title={site.name}
        label="Show Brochure"
        action={{
          // Short on purpose. The bar also carries the site name, and at a
          // phone width the site's usual 'Start Your Free Entry' truncated that
          // name to a few letters. The cover slide behind it still says the entry
          // is free; the bar only has to say what the button does.
          label: 'Enter now',
          href: '/register-interest',
        }}
      />
    </main>
  );
}
