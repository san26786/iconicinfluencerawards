/* eslint-disable camelcase */

// Sites table — one row per award website served from this codebase.
// Every domain-specific setting (name, venue, dates, branding colours,
// social links, hero image, categories) lives here so no code change is
// needed to add a new site — only a DB insert + DNS alias on Vercel.
//
// Theme colour columns store RGB channel triplets (e.g. "204 27 27") so they
// slot directly into Tailwind's rgb(var(--c-xxx) / <alpha-value>) pattern.
//
// IMPORTANT: all seed data uses pgm.sql() — not await pgm.db.query() — so
// it is queued for execution AFTER the DDL, not before the table exists.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('sites', {
    id: 'id',
    domain:        { type: 'varchar(255)', notNull: true, unique: true },
    name:          { type: 'varchar(200)', notNull: true },
    slug:          { type: 'varchar(100)', notNull: true, unique: true },
    tagline:       { type: 'text' },
    year:          { type: 'varchar(4)',   default: "'2026'" },
    legal:         { type: 'text' },
    // Event
    event_date:          { type: 'varchar(100)' },
    event_date_long:     { type: 'varchar(200)' },
    event_date_iso:      { type: 'timestamptz' },
    event_deadline_iso:  { type: 'timestamptz' },
    event_deadline_label:{ type: 'varchar(100)' },
    event_city:          { type: 'varchar(100)' },
    venue:               { type: 'varchar(300)' },
    venue_short:         { type: 'varchar(100)' },
    ceremonies_count:    { type: 'integer', default: 2 },
    // Contact
    email:         { type: 'varchar(255)' },
    phone_display: { type: 'varchar(50)' },
    phone_href:    { type: 'varchar(100)' },
    company:       { type: 'varchar(200)' },
    address:       { type: 'text' },
    official_site: { type: 'varchar(255)' },
    // Social
    social_facebook:  { type: 'varchar(255)' },
    social_instagram: { type: 'varchar(255)' },
    social_linkedin:  { type: 'varchar(255)' },
    social_x:         { type: 'varchar(255)' },
    // Branding — RGB channel triplets e.g. "204 27 27"
    theme_primary:     { type: 'varchar(20)', default: "'204 27 27'" },
    theme_light:       { type: 'varchar(20)', default: "'232 184 75'" },
    theme_deep:        { type: 'varchar(20)', default: "'139 0 0'" },
    theme_50:          { type: 'varchar(20)', default: "'255 245 245'" },
    theme_bg:          { type: 'varchar(20)', default: "'11 10 14'" },
    theme_bg_slate:    { type: 'varchar(20)', default: "'20 17 26'" },
    theme_bg_warm:     { type: 'varchar(20)', default: "'26 15 15'" },
    theme_bg_darkest:  { type: 'varchar(20)', default: "'6 4 8'" },
    // Hero / content
    hero_image_id: { type: 'varchar(100)' },
    categories:    { type: 'jsonb', default: pgm.func("'[]'") },
    ga_id:         { type: 'varchar(50)' },
    is_active:     { type: 'boolean', notNull: true, default: true },
    created_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // pgm.sql() queues SQL to run AFTER the table is created (in the same transaction).
  // Using await pgm.db.query() would fire before the DDL is applied.

  // ── Seed: London Business Awards (site_id = 1) ───────────────────────────
  pgm.sql(`
    INSERT INTO sites (
      domain, name, slug, tagline, year, legal,
      event_date, event_date_long, event_date_iso,
      event_deadline_iso, event_deadline_label,
      event_city, venue, venue_short, ceremonies_count,
      email, phone_display, phone_href, company, address, official_site,
      social_facebook, social_instagram, social_linkedin, social_x,
      theme_primary, theme_light, theme_deep, theme_50,
      theme_bg, theme_bg_slate, theme_bg_warm, theme_bg_darkest,
      hero_image_id
    ) VALUES (
      'londonbusinessawards.com',
      'London Business Awards',
      'london-business-awards',
      'Recognising the Businesses, Entrepreneurs and Leaders Shaping London''s Future.',
      '2027',
      'London Business Awards is a trading style of B2B Growth Hub Limited Copyright © 2027 All Rights Reserved',
      '23–24 Feb 2027',
      'Tue–Wed, 23–24 Feb 2027',
      '2027-02-23T10:00:00+00:00',
      '2027-02-22T23:59:59+00:00',
      '22 February 2027',
      'London',
      'London Olympia, Hammersmith Road, London W14 8UX',
      'London Olympia',
      2,
      'hello@londonbusinessawards.com',
      '+44 20 3451 7166',
      'tel:+442034517166',
      'B2B Growth Hub Limited',
      'Level 18, 40 Bank Street, Canary Wharf, London, E14 5AB, United Kingdom',
      'https://londonbusinessawards.com/',
      'https://www.facebook.com/people/London-Business-Awards/61590839274142/',
      'https://www.instagram.com/londonbizawards/',
      'https://www.linkedin.com/company/londonbusinessawards/',
      'https://x.com/londonbizawards',
      '204 27 27',
      '232 184 75',
      '139 0 0',
      '255 245 245',
      '11 10 14',
      '20 17 26',
      '26 15 15',
      '6 4 8',
      'photo-1470229722913-7c0e2dbbafd3'
    )
  `);

  // ── Seed: Cardiff Business Award (site_id = 2) ───────────────────────────
  pgm.sql(`
    INSERT INTO sites (
      domain, name, slug, tagline, year, legal,
      event_date, event_date_long, event_date_iso,
      event_deadline_iso, event_deadline_label,
      event_city, venue, venue_short, ceremonies_count,
      email, phone_display, phone_href, company, address, official_site,
      social_facebook, social_instagram, social_linkedin, social_x,
      theme_primary, theme_light, theme_deep, theme_50,
      theme_bg, theme_bg_slate, theme_bg_warm, theme_bg_darkest,
      hero_image_id
    ) VALUES (
      'cardiffbusinessaward.com',
      'Cardiff Business Award',
      'cardiff-business-award',
      'Celebrating the Businesses, Entrepreneurs and Leaders Driving Cardiff Forward.',
      '2026',
      'Cardiff Business Award is a trading style of B2B Growth Hub Limited Copyright © 2026 All Rights Reserved',
      '29 Oct 2026',
      'Thu, 29 Oct 2026',
      '2026-10-29T10:00:00+01:00',
      '2026-10-28T23:59:59+01:00',
      '28 October 2026',
      'Cardiff',
      'Cardiff City Stadium, Cardiff CF11 8AZ, United Kingdom',
      'Cardiff City Stadium',
      2,
      'hello@cardiffbusinessaward.com',
      '+44 20 3451 7166',
      'tel:+442034517166',
      'B2B Growth Hub Limited',
      'Level 18, 40 Bank Street, Canary Wharf, London, E14 5AB, United Kingdom',
      'https://cardiffbusinessaward.com/',
      'https://www.facebook.com/cardiffbusinessaward/',
      'https://www.instagram.com/cardiffbizaward/',
      'https://www.linkedin.com/company/cardiffbusinessaward/',
      'https://x.com/cardiffbizaward',
      '21 128 61',
      '134 239 172',
      '20 83 45',
      '240 253 244',
      '5 14 7',
      '8 15 10',
      '8 20 10',
      '2 5 3',
      'photo-1519389950473-47ba0277781c'
    )
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('sites');
};
