/* eslint-disable camelcase */
// Seed The Power Business Awards site record (apps.thepowerbusinessawards.com).
// Uses ON CONFLICT so re-running is safe.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO sites (
      domain, name, slug, tagline, year, legal,
      event_date, event_date_long, event_date_iso, event_deadline_iso, event_deadline_label,
      event_city, venue, venue_short, ceremonies_count,
      email, phone_display, phone_href, company, address, official_site,
      social_facebook, social_instagram, social_linkedin, social_x,
      theme_primary, theme_light, theme_deep, theme_50,
      theme_bg, theme_bg_slate, theme_bg_warm, theme_bg_darkest,
      hero_image_id, categories, ga_id, is_active,
      design_variant, logo_url, font_display, font_body
    ) VALUES (
      'apps.thepowerbusinessawards.com',
      'The Power Business Awards',
      'power-business-awards',
      'Recognising the Most Powerful Leaders, Innovators and Businesses Shaping Tomorrow.',
      '2026',
      'The Power Business Awards is a trading style of B2B Growth Hub Limited Copyright © 2026 All Rights Reserved',
      'TBA 2026', 'TBA 2026',
      '2026-11-01T19:00:00+00:00',
      '2026-10-31T23:59:59+00:00',
      '31 October 2026',
      'London', 'TBA, London', 'TBA', 1,
      'hello@thepowerbusinessawards.com',
      '+44 20 3451 7166', 'tel:+442034517166',
      'B2B Growth Hub Limited',
      'Level 18, 40 Bank Street, Canary Wharf, London, E14 5AB, United Kingdom',
      'https://thepowerbusinessawards.com/',
      NULL, NULL, NULL, NULL,
      '107 33 168', '232 184 75', '76 29 149', '250 245 255',
      '10 8 16', '18 14 28', '20 14 30', '7 5 12',
      '/power-awards/trophy.png',
      '[]'::jsonb,
      NULL, true,
      'luxury',
      '/logos/power-business-awards.png',
      'playfair', 'inter'
    )
    ON CONFLICT (domain) DO UPDATE SET
      logo_url      = EXCLUDED.logo_url,
      hero_image_id = EXCLUDED.hero_image_id,
      theme_primary = EXCLUDED.theme_primary,
      theme_light   = EXCLUDED.theme_light,
      theme_deep    = EXCLUDED.theme_deep,
      theme_50      = EXCLUDED.theme_50,
      theme_bg      = EXCLUDED.theme_bg,
      theme_bg_slate   = EXCLUDED.theme_bg_slate,
      theme_bg_warm    = EXCLUDED.theme_bg_warm,
      theme_bg_darkest = EXCLUDED.theme_bg_darkest,
      slug             = EXCLUDED.slug,
      design_variant   = EXCLUDED.design_variant;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM sites WHERE domain = 'apps.thepowerbusinessawards.com';`);
};
