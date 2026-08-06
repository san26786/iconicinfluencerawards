/* eslint-disable camelcase */

// Add design_variant to sites so each domain can render a completely different
// Hero layout (luxury | sport | corporate) without touching the codebase.
// Uses ADD COLUMN IF NOT EXISTS so running on a DB that was manually patched
// in a dev session doesn't fail.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE sites
      ADD COLUMN IF NOT EXISTS design_variant varchar(20) NOT NULL DEFAULT 'luxury'
  `);

  // Set each site's variant
  pgm.sql(`UPDATE sites SET design_variant = 'luxury'  WHERE domain = 'londonbusinessawards.com'`);
  pgm.sql(`UPDATE sites SET design_variant = 'sport'    WHERE domain = 'cardiffbusinessaward.com'`);
  pgm.sql(`UPDATE sites SET design_variant = 'corporate' WHERE domain = 'thegreatbritishexcellenceawards.com'`);

  // Insert Great British Excellence Awards if it doesn't already exist
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
      hero_image_id, design_variant
    ) VALUES (
      'thegreatbritishexcellenceawards.com',
      'Great British Excellence Awards',
      'great-british-excellence-awards',
      'Honouring Britain''s Most Exceptional Businesses, Leaders and Innovators.',
      '2027',
      'Great British Excellence Awards is a trading style of B2B Growth Hub Limited Copyright © 2027 All Rights Reserved',
      '15 Mar 2027',
      'Mon, 15 Mar 2027',
      '2027-03-15T10:00:00+00:00',
      '2027-03-14T23:59:59+00:00',
      '14 March 2027',
      'London',
      'The Shard, 32 London Bridge St, London SE1 9SG',
      'The Shard, London',
      1,
      'hello@thegreatbritishexcellenceawards.com',
      '+44 20 3451 7166',
      'tel:+442034517166',
      'B2B Growth Hub Limited',
      'Level 18, 40 Bank Street, Canary Wharf, London, E14 5AB, United Kingdom',
      'https://thegreatbritishexcellenceawards.com/',
      NULL, NULL, NULL, NULL,
      '29 78 216',
      '147 197 253',
      '30 58 138',
      '239 246 255',
      '8 10 18',
      '12 14 24',
      '10 12 22',
      '4 5 12',
      'photo-1486406146926-c627a92ad1ab',
      'corporate'
    )
    ON CONFLICT (domain) DO NOTHING
  `);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE sites DROP COLUMN IF EXISTS design_variant`);
};
