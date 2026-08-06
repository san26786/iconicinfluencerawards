/* eslint-disable no-console */
//
// Seeds the Property Excellence Awards tenant.
//
//   node -r dotenv/config scripts/seed-property-excellence.js dotenv_config_path=.env.local
//
// This repo shares its Postgres with the other awards tenants, so the script
// is deliberately narrow: it only ever touches the ONE site row whose domain
// matches SITE_DOMAIN below, plus that row's own themes, events and
// award_categories. Nothing else in the database is read or written.
//
// SITE_DOMAIN defaults to the staging host so a run cannot repaint the live
// propertyexcellenceawards.org site by accident. Pass --domain to target a
// different one at cutover:
//
//   node -r dotenv/config scripts/seed-property-excellence.js \
//     dotenv_config_path=.env.local --domain propertyexcellenceawards.org
//
// Idempotent — re-running updates in place rather than duplicating.

const { Pool } = require('pg');

const PROD_DOMAIN = 'propertyexcellenceawards.org';

const argIndex = process.argv.indexOf('--domain');
const SITE_DOMAIN =
  argIndex > -1 && process.argv[argIndex + 1]
    ? process.argv[argIndex + 1]
    : 'property-excellence-awards.vercel.app';

// sites.slug is UNIQUE and the existing live row already holds the clean slug,
// so the staging row takes a suffixed one. At cutover, free the clean slug on
// the old row first (rename or deactivate-and-rename it), then re-run this
// script with --domain propertyexcellenceawards.org.
const IS_PROD = SITE_DOMAIN === PROD_DOMAIN;
const SITE_SLUG = IS_PROD
  ? 'property-excellence-awards'
  : 'property-excellence-awards-staging';

const SITE = {
  name: 'Property Excellence Awards',
  slug: SITE_SLUG,
  tagline: 'Recognising the Agencies, Developers and People Shaping the Property Industry.',
  year: '2026-27',
  legal:
    'Property Excellence Awards is a trading style of B2B Growth Hub Limited Copyright © 2027 All Rights Reserved',
  event_date: '18 Jun 2027',
  event_date_long: 'Fri, 18 June 2027',
  event_date_iso: '2027-06-18T18:00:00+01:00',
  event_deadline_iso: '2027-05-28T23:59:59+01:00',
  event_deadline_label: '28 May 2027',
  event_city: 'London',
  venue: 'The Leadenhall Building, 122 Leadenhall Street, London EC3V 4AB',
  venue_short: 'The Leadenhall Building',
  ceremonies_count: 1,
  email: 'info@propertyexcellenceawards.org',
  phone_display: '+44 20 3977 8512',
  phone_href: 'tel:+442039778512',
  company: 'B2B Growth Hub Limited',
  address:
    'Level 30, The Leadenhall Building, 122 Leadenhall St, London EC3V 4AB, United Kingdom',
  official_site: 'https://propertyexcellenceawards.org/',
  // Amber on navy — must match the :root defaults in app/globals.css and
  // PEA_DEFAULTS in lib/site.ts.
  theme_primary: '255 173 36',
  theme_light: '244 227 161',
  theme_deep: '168 132 42',
  theme_50: '249 248 244',
  theme_bg: '14 20 36',
  theme_bg_slate: '10 15 28',
  theme_bg_warm: '20 19 38',
  theme_bg_darkest: '6 10 20',
  hero_image_id: 'photo-1486406146926-c627a92ad1ab',
  design_variant: 'corporate',
  font_display: 'playfair',
  font_body: 'inter',
};

const THEMES = [
  {
    name: 'Agency Excellence Awards',
    theme: 'Agency & Brokerage',
    tagline: 'For the agencies setting the standard',
    description:
      'Celebrating the sales, lettings and commercial agencies whose service, results and integrity define the market.',
    icon: 'Building2',
    href: '/categories#agency',
  },
  {
    name: 'Development Excellence Awards',
    theme: 'Development & Construction',
    tagline: 'For the schemes reshaping our places',
    description:
      'Honouring the developers, housebuilders and contractors behind the schemes that change how a place looks and lives.',
    icon: 'HardHat',
    href: '/categories#development',
  },
  {
    name: 'Property Services Awards',
    theme: 'Property Services & Finance',
    tagline: 'For the specialists behind every deal',
    description:
      'Recognising the managers, surveyors, lawyers and lenders whose expertise keeps the industry moving.',
    icon: 'Scale',
    href: '/categories#services',
  },
  {
    name: 'PropTech Innovation Awards',
    theme: 'Innovation & PropTech',
    tagline: 'For the ideas moving the industry forward',
    description:
      'Spotlighting the platforms, products and campaigns bringing genuinely new thinking to property.',
    icon: 'Lightbulb',
    href: '/categories#proptech',
  },
  {
    name: 'People in Property Awards',
    theme: 'Individual Excellence',
    tagline: 'For the individuals who make the difference',
    description:
      'A distinguished set of accolades for the entrepreneurs, agents, investors and rising stars driving the industry.',
    icon: 'Star',
    href: '/categories#individual',
  },
  {
    name: 'Workplace & Impact Awards',
    theme: 'Team, Workplace & Impact',
    tagline: 'For the teams and cultures behind the results',
    description:
      'Celebrating the teams, workplaces and community programmes that prove how a business grows matters as much as how fast.',
    icon: 'Users',
    href: '/categories#team',
  },
];

// Mirrors ALL_AWARD_CATEGORIES in lib/content.ts. Kept as a flat list here
// because award_categories has no theme column — the grouping lives in the app.
const CATEGORIES = [
  // Agency & Brokerage Excellence
  'Estate Agency of the Year Award',
  'Lettings Agency of the Year Award',
  'Independent Estate Agency of the Year Award',
  'Commercial Property Agency of the Year Award',
  'Fast-Growing Estate Agency of the Year Award',
  'Property Auction House of the Year Award',
  'Buying Agency of the Year Award',
  'Online & Hybrid Agency of the Year Award',
  'Emerging Estate Agency of the Year Award',
  'Rural & Land Agency of the Year Award',
  // Development & Construction
  'Property Developer of the Year Award',
  'Residential Development of the Year Award',
  'Commercial Development of the Year Award',
  'Regeneration Project of the Year Award',
  'Housebuilder of the Year Award',
  'Construction Firm of the Year Award',
  'Refurbishment Project of the Year Award',
  'Sustainable Development of the Year Award',
  'Mixed-Use Development of the Year Award',
  'Heritage Restoration Project of the Year Award',
  // Property Services & Finance
  'Property Management Company of the Year Award',
  'Block Management Firm of the Year Award',
  'Surveying Firm of the Year Award',
  'Property Law Firm of the Year Award',
  'Mortgage Broker of the Year Award',
  'Facilities Management Firm of the Year Award',
  'Property Finance Firm of the Year Award',
  'Build-to-Rent Operator of the Year Award',
  'Student Accommodation Operator of the Year Award',
  'Property Insurance Specialist of the Year Award',
  // Innovation & PropTech
  'PropTech Business of the Year Award',
  'Property Innovation of the Year Award',
  'Property Portal or Platform of the Year Award',
  'Emerging PropTech Firm of the Year Award',
  'Digital Marketing Campaign of the Year Award',
  'Sustainable Property Business of the Year Award',
  'Smart Building Technology Award',
  'Data & Analytics Innovation Award',
  'Property Media Brand of the Year Award',
  'AI in Property Award',
  // Individual Excellence
  'Property Entrepreneur of the Year Award',
  'Estate Agent of the Year Award',
  'Lettings Negotiator of the Year Award',
  'Property Investor of the Year Award',
  'Rising Star in Property Award',
  'Woman in Property of the Year Award',
  'Property Mentor of the Year Award',
  'Property Leader of the Year Award',
  'Young Property Professional of the Year Award',
  'Lifetime Achievement in Property Award',
  // Team, Workplace & Impact
  'Property Business of the Year Award',
  'Property Team of the Year Award',
  'Top Property Workplace of the Year Award',
  'Customer Service Excellence Award',
  'Community Impact Award',
  'Diversity & Inclusion in Property Award',
  'Training & Development Award',
  'Marketing Team of the Year Award',
  'Social Value in Property Award',
  'Employer of Choice in Property Award',
];

// One public event per theme, so the organiser panel and the entry form have
// something to attach questions and categories to from day one.
const EVENTS = THEMES.map((t) => t.name);

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — pass dotenv_config_path=.env.local');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    // ── 1. The site row ──────────────────────────────────────────────────
    const cols = Object.keys(SITE);
    const values = cols.map((c) => SITE[c]);
    const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ');
    const updates = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');

    const { rows: siteRows } = await db.query(
      `INSERT INTO sites (domain, ${cols.join(', ')}, is_active)
            VALUES ($1, ${placeholders}, true)
       ON CONFLICT (domain) DO UPDATE SET ${updates}, is_active = true, updated_at = now()
         RETURNING id, (xmax = 0) AS inserted`,
      [SITE_DOMAIN, ...values],
    );
    const siteId = siteRows[0].id;
    console.log(
      `${siteRows[0].inserted ? 'Created' : 'Updated'} site ${siteId} (${SITE_DOMAIN})`,
    );

    // ── 2. Themes ────────────────────────────────────────────────────────
    // Replace wholesale: the row may be carrying another programme's themes.
    await db.query('DELETE FROM themes WHERE site_id = $1', [siteId]);
    for (let i = 0; i < THEMES.length; i++) {
      const t = THEMES[i];
      await db.query(
        `INSERT INTO themes (site_id, name, theme, tagline, description, icon, href, is_hidden, display_order)
              VALUES ($1,$2,$3,$4,$5,$6,$7,false,$8)`,
        [siteId, t.name, t.theme, t.tagline, t.description, t.icon, t.href, i + 1],
      );
    }
    console.log(`Seeded ${THEMES.length} themes`);

    // ── 3. Award categories ──────────────────────────────────────────────
    // category_id is the stable slug the judging tables join on.
    let catInserted = 0;
    for (const name of CATEGORIES) {
      const categoryId = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const { rowCount } = await db.query(
        `INSERT INTO award_categories (site_id, category_id, category_name)
              VALUES ($1,$2,$3)
         ON CONFLICT DO NOTHING`,
        [siteId, categoryId, name],
      );
      catInserted += rowCount;
    }
    console.log(`Seeded ${catInserted} new categories (${CATEGORIES.length} total in the list)`);

    // ── 4. Events ────────────────────────────────────────────────────────
    // Renames whatever is already there rather than deleting: events may
    // already have questions and applications attached to them.
    const { rows: existing } = await db.query(
      'SELECT id FROM events WHERE site_id = $1 ORDER BY id',
      [siteId],
    );
    for (let i = 0; i < EVENTS.length; i++) {
      if (existing[i]) {
        await db.query(
          `UPDATE events SET title = $1, is_public = true, status = 'upcoming',
                             is_featured = $2, updated_at = now()
            WHERE id = $3`,
          [EVENTS[i], i === 0, existing[i].id],
        );
      } else {
        await db.query(
          `INSERT INTO events (site_id, title, status, is_public, is_featured)
                VALUES ($1,$2,'upcoming',true,$3)`,
          [siteId, EVENTS[i], i === 0],
        );
      }
    }
    console.log(`Seeded ${EVENTS.length} events`);

    await db.query('COMMIT');
    console.log(`\nDone. Point DEV_SITE_DOMAIN at ${SITE_DOMAIN} to serve this tenant locally.`);
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  } finally {
    db.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
