// Central content + data for the Property Excellence Awards site.

export const IMG = (id: string, w = 1600, q = 80) =>
  id.startsWith('/') || id.startsWith('http') || id.startsWith('data:')
    ? id
    : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const SITE = {
  name: 'Property Excellence Awards',
  // Stable machine-readable identifier sent to upstream APIs so a shared
  // backend can tell which site a payload came from. Kebab-case, matches
  // the repo name.
  id: 'property-excellence-awards',
  year: '2026-27',
  tagline:
    'Recognising the Agencies, Developers and People Shaping the Property Industry.',
  venue: 'Cardiff City Stadium, Cardiff',
  nominateUrl: '/register-interest',
  nominateOtherUrl: '/register-interest?mode=nominate',
  partnerUrl: '/partner',
  categoriesUrl: '/categories',
  themesUrl: '/themes',
  // Confirmed ceremony date and running window. The entry deadline is not set
  // yet and stays empty rather than being guessed — an invented one is what put
  // a fabricated date on the site, the sitemap and the Event JSON-LD before.
  eventDate: '29 Oct 2026',
  eventDateLong: 'Thu, 29 October 2026',
  eventDateISO: '2026-10-29T10:00:00+00:00',
  eventCity: 'Cardiff',
  venueShort: 'Cardiff City Stadium',
  ceremoniesCount: 1,
  deadlineISO: '',
  deadlineLabel: '',
  // Contact — no confirmed number for this brand yet
  phoneDisplay: '',
  phoneHref: '',
  email: 'organiser@propertyexcellenceawards.org',
  company: 'B2B Growth Hub Limited',
  address: 'Level 30, The Leadenhall Building, 122 Leadenhall St, London EC3V 4AB, United Kingdom',
  // Legal
  legal:
    'Property Excellence Awards is a trading style of B2B Growth Hub Limited Copyright © 2027 All Rights Reserved',
};

/**
 * When the ceremony runs. This is a **daytime** programme, 10:00–16:30 — not the
 * evening gala the platform's stock copy assumes, so anything describing "the
 * night" or a dinner is wrong for this event.
 *
 * `durationHours` is what the Event JSON-LD adds to the site row's
 * event_date_iso to produce endDate; keep it in step with start/end.
 */
export const CEREMONY_WINDOW = {
  start: '10:00am',
  end: '4:30pm',
  label: '10:00am – 4:30pm',
  durationHours: 6.5,
};

// Social links the site footer, header strip and outbound emails all read
// from. Order here is the order shown to users. Icons must exist in the
// ICONS map in components/ui/Social.tsx (Facebook, Instagram, Linkedin
// from lucide-react; X is a custom inline SVG).
//
// Accounts are still being set up — the footer reads the site row's
// social_* columns first and renders nothing when they are null, so leaving
// this list empty is safer than shipping links that 404.
export const SOCIAL: { label: string; icon: string; href: string }[] = [];

export const IMAGES = {
  heroPrimary: 'photo-1486406146926-c627a92ad1ab', // city skyline / towers
  heroStage: 'photo-1505373877841-8d25f7d46678', // stage lights
  conferenceCrowd: 'photo-1540575467063-178a50c2df87',
  audienceHands: 'photo-1492684223066-81342ee5ff30',
  stageSpeaker: 'photo-1475721027785-f74eccf877e2',
  galaTable: 'photo-1559223607-a43c990c692c',
  confetti: 'photo-1530103862676-de8c9debad1d',
  networking: 'photo-1531058020387-3be344556be6',
  meeting: 'photo-1556761175-5973dc0f32e7',
  team: 'photo-1521737604893-d14cc237f11d',
  teamHappy: 'photo-1497032628192-86f99bcd76bc',
  collaborate: 'photo-1542744173-8e7e53415bb0',
  handshake: 'photo-1551836022-d5d88e9218df',
  analytics: 'photo-1559136555-9303baea8ebd',
  venueSeats: 'photo-1517457373958-b7bdd4587205',
  // headshots
  womanA: 'photo-1556157382-97eda2d62296',
  manA: 'photo-1573164713988-8665fc963095',
  womanB: 'photo-1438761681033-6461ffad8d80',
  manB: 'photo-1560250097-0b93528c311a',
  womanC: 'photo-1573497019940-1c28c88b4f3e',
};

// Every figure here has to be checkable against the taxonomy or the entry
// terms. An attendance number is not: the inaugural ceremony has no confirmed
// venue yet, so its capacity is unknown and any "N+ guests" tile would be a
// guess presented as a fact to entrants and sponsors.
export const STATS = [
  { value: 6, suffix: '', label: 'Award Themes' },
  { value: 1, suffix: '', label: 'Inaugural Edition' },
  { value: 100, suffix: '%', label: 'Free to Nominate' },
  { value: 60, suffix: '+', label: 'Award Categories' },
];

// Short, repeatable reassurance shown beside calls to action.
export const REASSURE = 'Free to enter · Takes 10 minutes · No payment, ever';

// Wider awards family — Property Excellence Awards sits inside this group.
export const OFFICIAL_SITE = 'https://propertyexcellenceawards.org/';

// Same-origin proxy endpoint. The actual upstream URL + X-API-Key live in
// app/api/nominate/route.ts (server-side only) so the key never ships in the
// client bundle and we sidestep mixed-content blocks (HTTPS page -> HTTP API).
export const NOMINATION_API_URL = '/api/nominate';

// sessionStorage key used by the Categories page and Find My Award to hand
// pre-selected award categories to the nomination form without bloating the
// URL with a long ?categories=… list.
export const NOMINATION_STORAGE_KEY = 'pea_nominate_preset_v1';

// Per-theme application base URL. Every theme of this programme runs on the
// one domain, so all six point at the same place — the "Complete Your
// Application" buttons in the nominee email deep-link here with
// `?nominated_id=<crytid>`. Path is appended downstream (currently
// /application_process). No trailing slash.
export const THEME_APPLICATION_URLS: Record<
  'agency' | 'development' | 'services' | 'proptech' | 'individual' | 'team',
  string
> = {
  agency: 'https://propertyexcellenceawards.org',
  development: 'https://propertyexcellenceawards.org',
  services: 'https://propertyexcellenceawards.org',
  proptech: 'https://propertyexcellenceawards.org',
  individual: 'https://propertyexcellenceawards.org',
  team: 'https://propertyexcellenceawards.org',
};

// One vision, one environment — the unifying message for the themes.
export const THEMES_VISION =
  'Six themes. One vision. One environment where every kind of property excellence is seen, celebrated and connected.';

// The themes of the Property Excellence Awards — distinct areas of focus,
// united by a single vision. Full set retained here; the public `THEMES`
// export below filters out any theme currently hidden from the site.
export const ALL_THEMES = [
  {
    icon: 'Building2',
    theme: 'Agency & Brokerage',
    name: 'Agency Excellence Awards',
    tagline: 'For the agencies setting the standard',
    desc: 'Celebrating the sales, lettings and commercial agencies whose service, results and integrity define the market.',
    href: '/categories#agency',
  },
  {
    icon: 'HardHat',
    theme: 'Development & Construction',
    name: 'Development Excellence Awards',
    tagline: 'For the schemes reshaping our places',
    desc: 'Honouring the developers, housebuilders and contractors behind the schemes that change how a place looks and lives.',
    href: '/categories#development',
  },
  {
    icon: 'Scale',
    theme: 'Property Services & Finance',
    name: 'Property Services Awards',
    tagline: 'For the specialists behind every deal',
    desc: 'Recognising the managers, surveyors, lawyers and lenders whose expertise keeps the industry moving.',
    href: '/categories#services',
  },
  {
    icon: 'Lightbulb',
    theme: 'Innovation & PropTech',
    name: 'PropTech Innovation Awards',
    tagline: 'For the ideas moving the industry forward',
    desc: 'Spotlighting the platforms, products and campaigns bringing genuinely new thinking to property.',
    href: '/categories#proptech',
  },
  {
    icon: 'Star',
    theme: 'Individual Excellence',
    name: 'People in Property Awards',
    tagline: 'For the individuals who make the difference',
    desc: 'A distinguished set of accolades for the entrepreneurs, agents, investors and rising stars driving the industry.',
    href: '/categories#individual',
  },
  {
    icon: 'Users',
    theme: 'Team, Workplace & Impact',
    name: 'Workplace & Impact Awards',
    tagline: 'For the teams and cultures behind the results',
    desc: 'Celebrating the teams, workplaces and community programmes that prove how a business grows matters as much as how fast.',
    href: '/categories#team',
  },
] as const;

// Themes hidden from the public site for now (data retained in ALL_THEMES
// above for an easy re-enable — just remove the name here).
const HIDDEN_THEME_NAMES = new Set<string>([]);

// What the site renders — full set minus the hidden themes.
export const THEMES = ALL_THEMES.filter((t) => !HIDDEN_THEME_NAMES.has(t.name));

// Full award taxonomy used by the /categories explorer page and the
// "Find My Award" quiz. Each theme has Popular (always shown), Prime
// (always shown) and More (revealed on demand) tiers.
export type ThemeId =
  | 'agency'
  | 'development'
  | 'services'
  | 'proptech'
  | 'individual'
  | 'team';

export const ALL_AWARD_CATEGORIES: {
  id: ThemeId;
  name: string;
  blurb: string;
  icon: string;
  image: string;
  popular: string[];
  prime: string[];
  more: string[];
}[] = [
  {
    id: 'agency',
    name: 'Agency Excellence Awards',
    blurb: 'Sales, lettings, commercial and specialist agencies.',
    icon: 'Building2',
    image: 'photo-1560518883-ce09059eeffa',
    popular: [
      'Estate Agency of the Year Award',
      'Lettings Agency of the Year Award',
      'Independent Estate Agency of the Year Award',
      'Commercial Property Agency of the Year Award',
      'Fast-Growing Estate Agency of the Year Award',
    ],
    prime: [
      'Property Auction House of the Year Award',
      'Buying Agency of the Year Award',
      'Online & Hybrid Agency of the Year Award',
    ],
    more: [
      'Emerging Estate Agency of the Year Award',
      'Rural & Land Agency of the Year Award',
    ],
  },
  {
    id: 'development',
    name: 'Development Excellence Awards',
    blurb: 'Developers, housebuilders, contractors and completed schemes.',
    icon: 'HardHat',
    image: 'photo-1512917774080-9991f1c4c750',
    popular: [
      'Property Developer of the Year Award',
      'Residential Development of the Year Award',
      'Commercial Development of the Year Award',
      'Regeneration Project of the Year Award',
      'Housebuilder of the Year Award',
    ],
    prime: [
      'Construction Firm of the Year Award',
      'Refurbishment Project of the Year Award',
      'Sustainable Development of the Year Award',
    ],
    more: [
      'Mixed-Use Development of the Year Award',
      'Heritage Restoration Project of the Year Award',
    ],
  },
  {
    id: 'services',
    name: 'Property Services Awards',
    blurb: 'Management, surveying, legal, finance and operations.',
    icon: 'Scale',
    image: 'photo-1554469384-e58fac16e23a',
    popular: [
      'Property Management Company of the Year Award',
      'Block Management Firm of the Year Award',
      'Surveying Firm of the Year Award',
      'Property Law Firm of the Year Award',
      'Mortgage Broker of the Year Award',
    ],
    prime: [
      'Facilities Management Firm of the Year Award',
      'Property Finance Firm of the Year Award',
      'Build-to-Rent Operator of the Year Award',
    ],
    more: [
      'Student Accommodation Operator of the Year Award',
      'Property Insurance Specialist of the Year Award',
    ],
  },
  {
    id: 'proptech',
    name: 'PropTech Innovation Awards',
    blurb: 'Platforms, products, data and marketing that move the industry on.',
    icon: 'Lightbulb',
    image: 'photo-1559136555-9303baea8ebd',
    popular: [
      'PropTech Business of the Year Award',
      'Property Innovation of the Year Award',
      'Property Portal or Platform of the Year Award',
      'Emerging PropTech Firm of the Year Award',
      'Digital Marketing Campaign of the Year Award',
    ],
    prime: [
      'Sustainable Property Business of the Year Award',
      'Smart Building Technology Award',
      'Data & Analytics Innovation Award',
    ],
    more: [
      'Property Media Brand of the Year Award',
      'AI in Property Award',
    ],
  },
  {
    id: 'individual',
    name: 'People in Property Awards',
    blurb: 'Entrepreneurs, agents, investors, leaders and rising stars.',
    icon: 'Star',
    image: 'photo-1552664730-d307ca884978',
    popular: [
      'Property Entrepreneur of the Year Award',
      'Estate Agent of the Year Award',
      'Lettings Negotiator of the Year Award',
      'Property Investor of the Year Award',
      'Rising Star in Property Award',
    ],
    prime: [
      'Woman in Property of the Year Award',
      'Property Mentor of the Year Award',
      'Property Leader of the Year Award',
    ],
    more: [
      'Young Property Professional of the Year Award',
      'Lifetime Achievement in Property Award',
    ],
  },
  {
    id: 'team',
    name: 'Workplace & Impact Awards',
    blurb: 'Teams, culture, customer service and community impact.',
    icon: 'Users',
    image: 'photo-1497366811353-6870744d04b2',
    popular: [
      'Property Business of the Year Award',
      'Property Team of the Year Award',
      'Top Property Workplace of the Year Award',
      'Customer Service Excellence Award',
      'Community Impact Award',
    ],
    prime: [
      'Diversity & Inclusion in Property Award',
      'Training & Development Award',
      'Marketing Team of the Year Award',
    ],
    more: [
      'Social Value in Property Award',
      'Employer of Choice in Property Award',
    ],
  },
];

// Theme ids hidden from the public site for now (full taxonomy retained in
// ALL_AWARD_CATEGORIES above). Server/email code that must understand every
// theme — e.g. lib/email/nomination.ts grouping existing nominations — imports
// ALL_AWARD_CATEGORIES; everything user-facing imports the filtered
// AWARD_CATEGORIES below. To re-enable a theme, remove its id here.
export const HIDDEN_THEME_IDS: ThemeId[] = [];

// What the site renders — full taxonomy minus the hidden themes.
export const AWARD_CATEGORIES = ALL_AWARD_CATEGORIES.filter(
  (g) => !HIDDEN_THEME_IDS.includes(g.id),
);

// Total number of live categories — used in hero and category copy so the
// number can never drift from the taxonomy above.
export const CATEGORY_COUNT = AWARD_CATEGORIES.reduce(
  (n, g) => n + g.popular.length + g.prime.length + g.more.length,
  0,
);

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Speakers', href: '/speakers' },
  { label: 'Categories', href: '/categories' },
  { label: 'The Jury', href: '/judges' },
  { label: 'Venue & Event Schedule', href: '/venue' },
  { label: 'Sponsors', href: '/sponsors' },
  { label: 'Nominations Guideline', href: '/nomination-guideline' },
  { label: 'View Application', href: '/view-application' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'Award FAQ', href: '/faqs' },
  { label: 'Shortlists', href: '/shortlists' },
  { label: 'Semifinalists', href: '/semifinalists' },
  { label: 'Finalists', href: '/finalists' },
  { label: 'Winners', href: '/winners' },
  { label: 'The Experience', href: '/about-event' },
  { label: 'Join The Challenge', href: '/challenge' },
];

export const FOOTER_EXTRA_LINKS = NAV_LINKS;

// Grouped navigation for the site header. Everything from the gala and
// pre-launch programme collapses under one dropdown, mirroring the running
// order of the awards year.
export type HeaderNavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

export const HEADER_NAV: HeaderNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Speakers', href: '/speakers' },
  { label: 'Categories', href: '/categories' },
  { label: 'The Jury', href: '/judges' },
  {
    label: 'The Gala & Pre-Launch',
    children: [
      { label: 'Venue & Event Schedule', href: '/venue' },
      { label: 'Sponsors', href: '/sponsors' },
      { label: 'Nominations Guideline', href: '/nomination-guideline' },
      { label: 'View Application', href: '/view-application' },
      { label: 'Tickets', href: '/tickets' },
      { label: 'Award FAQ', href: '/faqs' },
      { label: 'Shortlists', href: '/shortlists' },
      { label: 'Semifinalists', href: '/semifinalists' },
      { label: 'Finalists', href: '/finalists' },
      { label: 'Winners', href: '/winners' },
      { label: 'The Experience', href: '/about-event' },
      { label: 'Join The Challenge', href: '/challenge' },
    ],
  },
];

export const WHY_CARDS = [
  {
    icon: 'BadgeCheck',
    title: 'Build Credibility',
    body: 'Earn independent industry recognition and the client trust that comes with it.',
  },
  {
    icon: 'Megaphone',
    title: 'Increase Visibility',
    body: 'Gain exposure through trade press, social reach and year-round award promotion.',
  },
  {
    icon: 'Users',
    title: 'Celebrate Your Team',
    body: 'Honour the people behind your success and give them a moment they will never forget.',
  },
  {
    icon: 'Trophy',
    title: 'Stand Above Competitors',
    body: 'Differentiate your firm in a crowded market and prove your excellence where it counts.',
  },
  {
    icon: 'Sparkles',
    title: 'Win More Instructions',
    body: 'Leverage powerful, third-party social proof that turns valuations into instructions.',
  },
  {
    icon: 'TrendingUp',
    title: 'Accelerate Growth',
    body: 'Open doors to new partnerships, investment, talent and expansion opportunities.',
  },
];

export const IMPACT_STATS = [
  { value: 70, suffix: '%', label: 'of clients say awards increase their trust in a firm' },
  { value: 3, suffix: 'x', label: 'more media coverage for shortlisted businesses' },
  { value: 2, suffix: 'x', label: 'stronger recruitment pull as an award-winning employer' },
];

export const IMPACT_POINTS = [
  { icon: 'Newspaper', label: 'Media Exposure' },
  { icon: 'Globe', label: 'Brand Awareness' },
  { icon: 'HeartHandshake', label: 'Client Trust' },
  { icon: 'UserPlus', label: 'Recruitment Edge' },
  { icon: 'PartyPopper', label: 'Team Morale' },
];

export const IMPACT_NOTE =
  'Indicative outcomes reported by award-winning businesses and independent industry research.';

export const CATEGORIES = [
  {
    icon: 'Crown',
    name: 'Property Business of the Year',
    desc: 'The headline accolade for the standout property business of the year.',
  },
  {
    icon: 'Building2',
    name: 'Estate Agency of the Year',
    desc: 'For the agency whose service, results and reputation lead the market.',
  },
  {
    icon: 'HardHat',
    name: 'Property Developer of the Year',
    desc: 'Recognising the developer behind the year’s most accomplished schemes.',
  },
  {
    icon: 'Home',
    name: 'Residential Development of the Year',
    desc: 'For the scheme that sets a new standard in how and where people live.',
  },
  {
    icon: 'Store',
    name: 'Commercial Development of the Year',
    desc: 'Honouring the workspace, retail or industrial scheme of the year.',
  },
  {
    icon: 'Lightbulb',
    name: 'PropTech Business of the Year',
    desc: 'For the platform or product bringing genuinely new thinking to property.',
  },
  {
    icon: 'Leaf',
    name: 'Sustainable Development of the Year',
    desc: 'Recognising schemes leading on carbon, biodiversity and long-term impact.',
  },
  {
    icon: 'Smile',
    name: 'Customer Service Excellence',
    desc: 'For the firms that turn every client into a long-term advocate.',
  },
  {
    icon: 'Handshake',
    name: 'Property Management Company of the Year',
    desc: 'For the managers keeping buildings, budgets and residents in good order.',
  },
  {
    icon: 'Star',
    name: 'Rising Star in Property',
    desc: 'Spotlighting the next generation of agents, surveyors and developers.',
  },
  {
    icon: 'HeartHandshake',
    name: 'Community Impact',
    desc: 'For the businesses whose projects visibly strengthen the places they work in.',
  },
  {
    icon: 'Users',
    name: 'Top Property Workplace',
    desc: 'The best places to work in property — culture, wellbeing and people first.',
  },
];

// 2026-27 is the inaugural year — there are no past winners to showcase yet.

// No past testimonials yet — the inaugural awards take place in 2027.

export const JOURNEY = [
  {
    step: '01',
    icon: 'DoorOpen',
    title: 'Nominations Open',
    body: 'Entries and public nominations are open now — completely free to enter.',
  },
  {
    step: '02',
    icon: 'FileText',
    title: 'Submit Your Entry',
    body: 'Tell your story across one or more categories. Enter as many as you like.',
  },
  {
    step: '03',
    icon: 'Scale',
    title: 'Independent Judging',
    body: 'A panel of independent experts reviews and scores every single entry.',
  },
  {
    step: '04',
    icon: 'ListChecks',
    title: 'Finalists Announced',
    body: 'The highest-scoring businesses are revealed and celebrated as finalists.',
  },
  {
    step: '05',
    icon: 'Sparkles',
    title: 'The Awards Ceremony',
    // Venue + date are filled in per site — see buildJourney below.
    body: '',
  },
  {
    step: '06',
    icon: 'Trophy',
    title: 'Winners Revealed',
    body: 'Gold winners are crowned live and the Overall Winner is named.',
  },
];

/**
 * JOURNEY with the per-site gala details filled in. Step 05's body names the
 * venue and date, which differ per tenant, so it can't live in the static array.
 */
export function buildJourney(venue: string, eventDateLong: string) {
  return JOURNEY.map((s) =>
    s.step === '05'
      ? {
          ...s,
          body: [venue, eventDateLong].filter(Boolean).join(', ')
            ? `An unforgettable celebration at ${[venue, eventDateLong].filter(Boolean).join(', ')}.`
            : 'An unforgettable celebration — full details announced soon.',
        }
      : s,
  );
}

// The published weighting behind every score. Percentages must total 100 —
// components/sections/JudgingProcess.tsx renders these as the scoring bars.
export const SCORING_FRAMEWORK = [
  { label: 'Impact & Results', weight: 30 },
  { label: 'Innovation', weight: 25 },
  { label: 'Leadership & Culture', weight: 20 },
  { label: 'Sustainability', weight: 15 },
  { label: 'Evidence Quality', weight: 10 },
];

export const JUDGING_PILLARS = [
  {
    icon: 'Scale',
    title: 'Independent Judges',
    body: 'No pay-to-win. Judges are external experts with no commercial stake in the outcome.',
  },
  {
    icon: 'BarChart3',
    title: 'Transparent Scoring',
    body: 'Every entry is scored against a published, weighted criteria framework.',
  },
  {
    icon: 'BadgeCheck',
    title: 'Merit-Based Evaluation',
    body: 'Winners are decided on evidence and results — never on reputation or budget.',
  },
  {
    icon: 'Users',
    title: 'Industry Experts',
    body: 'Panels are matched to each category so your entry is judged by people who get it.',
  },
];

export const FAQS = [
  {
    q: 'Who is eligible to enter?',
    // Region is filled in per site — see buildFaqs below.
    a: '',
  },
  {
    q: 'How much does it cost to enter?',
    a: 'Entry is completely free. There is no fee to nominate, to be shortlisted or to win, and no obligation to attend the ceremony — you can enter as many categories as you like at no cost.',
  },
  {
    q: 'Can I nominate someone else?',
    a: 'Absolutely. Clients, colleagues and the wider industry can nominate any business or individual they believe deserves to be recognised. A nomination is a genuine way to champion work you rate.',
  },
  {
    q: 'How are entries judged?',
    a: 'Every entry is scored independently by a panel of industry experts against a published, weighted criteria framework. Scores are moderated for consistency, and judges declare any conflicts of interest.',
  },
  {
    q: 'Can I enter more than one category?',
    a: 'Yes. Many organisations enter several categories to reflect different sides of the business — an agency might enter for service, for growth and for its workplace culture. There is no extra cost.',
  },
  {
    q: 'What do winners actually receive?',
    a: "Winners receive a trophy and certificate, the official winner's digital mark, a press-ready PR toolkit, a feature in our winners' showcase, and a full year's licence to use the recognition across marketing and recruitment.",
  },
  {
    q: 'What are the key dates?',
    // Deadline is filled in per site — see buildFaqs below.
    a: '',
  },
  {
    q: 'When are winners announced?',
    // Venue, date and city are filled in per site — see buildFaqs below.
    a: '',
  },
];

/**
 * FAQS with the per-site answers filled in. Three answers name the region,
 * venue, deadline and ceremony date, none of which can be shared across
 * tenants.
 */
export function buildFaqs(
  eventCity: string,
  venue: string,
  eventDate: string,
  deadlineLabel = '',
) {
  const region = eventCity || 'the region';
  const where = [venue, eventDate].filter(Boolean).join(' on ');
  return FAQS.map((f) => {
    if (f.q === 'Who is eligible to enter?') {
      return {
        ...f,
        a: `Any organisation working in or serving the property industry — agencies, developers, contractors, managers, surveyors, lenders, PropTech firms and the people within them. Most categories are open to all sizes and specialisms, whether you are based in ${region} or operating nationally.`,
      };
    }
    if (f.q === 'What are the key dates?') {
      return {
        ...f,
        a: deadlineLabel && eventDate
          ? `Entries are open now and close on ${deadlineLabel}. Finalists are announced ahead of the ceremony, where winners are revealed live on ${eventDate}.`
          : 'Entries are open now. Finalists are announced ahead of the ceremony, where winners are revealed live — full dates are confirmed on the event page.',
      };
    }
    if (f.q === 'When are winners announced?') {
      return {
        ...f,
        a: where
          ? `Winners are revealed live and in person at the Awards Ceremony at ${where} — the highlight of the ${region} property calendar.`
          : `Winners are revealed live and in person at the Awards Ceremony — the highlight of the ${region} property calendar.`,
      };
    }
    return f;
  });
}

// Founding partners are being confirmed for the inaugural edition — add real
// partner names here when ready.
