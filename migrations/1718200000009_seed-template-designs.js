/* eslint-disable camelcase */

// Backfills the `design` (block structure) for the seeded templates so they
// open in the visual designer instead of the raw-HTML "Code" tab. Mirrors the
// content of each seeded template as heading/text/button blocks. The stored
// `html` is left as-is (visually equivalent) and is re-rendered from these
// blocks the next time the template is saved in the designer.

exports.shorthands = undefined;

const heading = (id, text) => ({ id, type: 'heading', text, align: 'left' });
const text = (id, t) => ({ id, type: 'text', text: t, align: 'left' });
const button = (id, label, url) => ({ id, type: 'button', label, url, align: 'left' });

// key = slug (system templates) or name (outreach templates, which have no slug)
const DESIGNS = {
  'Awards Invitation': [
    heading('h', 'Hello {{firstName}},'),
    text('t1', "We'd love for {{company}} to be part of the {{siteName}}. Entering is free and takes only a few minutes — it's a brilliant way to gain recognition and visibility."),
    button('b', 'Start your free entry', '{{siteUrl}}'),
    text('t2', 'Warm regards,\nThe {{siteName}} team'),
  ],
  'Nomination Reminder': [
    heading('h', "Don't miss out, {{firstName}}"),
    text('t1', "Nominations for the {{siteName}} are closing soon. There's still time for {{company}} to put a name forward."),
    button('b', 'Nominate now', '{{siteUrl}}'),
    text('t2', 'See you there,\nThe {{siteName}} team'),
  ],
  'Event Announcement': [
    heading('h', 'Save the date, {{firstName}}'),
    text('t1', "We're delighted to share details of the upcoming {{siteName}} ceremony. We hope you and {{company}} can join us."),
    button('b', 'View the details', '{{siteUrl}}'),
    text('t2', 'Best wishes,\nThe {{siteName}} team'),
  ],
  welcome: [
    heading('h', 'Welcome, {{firstName}}!'),
    text('t1', 'Thanks for creating your account with {{siteName}}. You can now complete your awards profile and track your nominations any time.'),
    button('b', 'Go to my account', '{{siteUrl}}'),
    text('t2', 'See you soon,\nThe {{siteName}} team'),
  ],
  nominee_confirmation: [
    heading('h', 'Congratulations, {{nomineeName}}!'),
    text('t1', "You've been nominated for the {{siteName}} in: {{categories}}."),
    text('t2', "We'll be in touch with the next steps. In the meantime you can find out more below."),
    button('b', 'Find out more', '{{siteUrl}}'),
    text('t3', 'Warm regards,\nThe {{siteName}} team'),
  ],
  nominator_thankyou: [
    heading('h', 'Thank you, {{nominatorName}}'),
    text('t1', 'Thanks for nominating {{nomineeName}} for the {{siteName}} in {{categories}}. Your support helps us celebrate the very best.'),
    button('b', 'Visit the awards', '{{siteUrl}}'),
    text('t2', 'With thanks,\nThe {{siteName}} team'),
  ],
};

const SLUGS = new Set(['welcome', 'nominee_confirmation', 'nominator_thankyou']);

exports.up = (pgm) => {
  for (const [key, blocks] of Object.entries(DESIGNS)) {
    const json = JSON.stringify(blocks);
    const where = SLUGS.has(key) ? `slug = $pga$${key}$pga$` : `name = $pga$${key}$pga$ AND slug IS NULL`;
    pgm.sql(`UPDATE email_templates SET design = $pga$${json}$pga$::jsonb, updated_at = now() WHERE ${where};`);
  }
};

exports.down = (pgm) => {
  const keys = Object.keys(DESIGNS);
  const slugs = keys.filter((k) => SLUGS.has(k));
  const names = keys.filter((k) => !SLUGS.has(k));
  if (slugs.length)
    pgm.sql(`UPDATE email_templates SET design = NULL WHERE slug IN (${slugs.map((s) => `'${s}'`).join(',')});`);
  if (names.length)
    pgm.sql(`UPDATE email_templates SET design = NULL WHERE name IN (${names.map((n) => `$pga$${n}$pga$`).join(',')}) AND slug IS NULL;`);
};
