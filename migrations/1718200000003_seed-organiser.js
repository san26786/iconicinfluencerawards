/* eslint-disable camelcase */

// Seeds the single organiser account so there's a login to manage the site
// with out of the box. Credentials can be overridden at migrate time:
//
//   ORGANISER_EMAIL=...  ORGANISER_PASSWORD=...  npm run migrate
//
// Defaults (documented for the team — change the password after first login):
//   email:    organiser@londonbusinessawards.com
//   password: Organiser@2026!
//
// Idempotent: ON CONFLICT DO NOTHING means re-running migrations never throws
// or clobbers a password the organiser has since changed.

exports.shorthands = undefined;

const DEFAULT_EMAIL = 'organiser@londonbusinessawards.com';
const DEFAULT_PASSWORD = 'Organiser@2026!';

exports.up = async (pgm) => {
  // bcryptjs is a runtime dependency of the app; requiring it here lets the
  // migration hash the password instead of embedding a precomputed hash.
  const bcrypt = require('bcryptjs');

  const email = (process.env.ORGANISER_EMAIL || DEFAULT_EMAIL).toLowerCase();
  const password = process.env.ORGANISER_PASSWORD || DEFAULT_PASSWORD;
  // bcrypt hashes are ASCII ($, ., /, alnum) — no quotes — so they are safe to
  // inline in the SQL literal below.
  const hash = await bcrypt.hash(password, 10);

  pgm.sql(`
    INSERT INTO users (email, password_hash, role, first_name, last_name)
    VALUES ('${email}', '${hash}', 'organiser', 'Site', 'Organiser')
    ON CONFLICT (email) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  const email = (process.env.ORGANISER_EMAIL || DEFAULT_EMAIL).toLowerCase();
  pgm.sql(`DELETE FROM users WHERE email = '${email}' AND role = 'organiser';`);
};
