/* eslint-disable no-console */
//
// Seeds the Iconic Influencer Awards tenant's `sites` row on the shared
// Postgres instance. All content below is a PLACEHOLDER — edit before going
// live. Themes/categories/events are intentionally NOT seeded here; add them
// once real category names are decided (see seed-property-excellence.js in
// the property-excellence-awards repo for the pattern to copy).
//
//   node -r dotenv/config scripts/seed-iconic-influencer-awards.js
//
// Idempotent — re-running updates the row in place rather than duplicating.

const { Pool } = require('pg');

const SITE_DOMAIN = process.env.DEV_SITE_DOMAIN || 'iconicinfluencerawards.com';

const SITE = {
  name: 'Iconic Influencer Awards',
  slug: 'iconic-influencer-awards',
  tagline: 'PLACEHOLDER — Celebrating the Creators, Brands and Platforms Shaping Digital Influence.',
  year: '2026',
  legal: null,
  event_date: null,
  event_date_long: null,
  event_date_iso: null,
  event_deadline_iso: null,
  event_deadline_label: null,
  event_city: null,
  venue: null,
  venue_short: null,
  ceremonies_count: 1,
  email: null,
  phone_display: null,
  phone_href: null,
  company: null,
  address: null,
  official_site: null,
  // Magenta/violet — distinct from every other tenant's palette so the two
  // dev servers are visually unmistakable. Swap for the real brand colours.
  theme_primary: '217 70 239',
  theme_light: '240 171 252',
  theme_deep: '134 25 143',
  theme_50: '250 245 255',
  theme_bg: '17 10 26',
  theme_bg_slate: '13 8 20',
  theme_bg_warm: '24 12 30',
  theme_bg_darkest: '8 5 13',
  hero_image_id: null,
  design_variant: 'luxury',
  font_display: 'playfair',
  font_body: 'inter',
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — pass -r dotenv/config');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  const db = await pool.connect();

  try {
    const cols = Object.keys(SITE);
    const values = cols.map((c) => SITE[c]);
    const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ');
    const updates = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');

    const { rows } = await db.query(
      `INSERT INTO sites (domain, ${cols.join(', ')}, is_active)
            VALUES ($1, ${placeholders}, true)
       ON CONFLICT (domain) DO UPDATE SET ${updates}, is_active = true, updated_at = now()
         RETURNING id, (xmax = 0) AS inserted`,
      [SITE_DOMAIN, ...values],
    );
    console.log(`${rows[0].inserted ? 'Created' : 'Updated'} site ${rows[0].id} (${SITE_DOMAIN})`);
    console.log('Reminder: name/tagline/colours are placeholders — edit SITE above and re-run.');
  } finally {
    db.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
