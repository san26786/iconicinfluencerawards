/* eslint-disable camelcase */

// Adds support for MULTIPLE SMTP sending accounts (a "sending pool"). Large
// campaigns are split round-robin across these mailboxes and sent in parallel,
// so an 8k send can go out as ~2k from each of four accounts at once — keeping
// every mailbox under its host's hourly/daily sending caps.
//
// Stored as a JSON array on the app_settings singleton:
//   [{ "host": "...", "port": 465, "user": "a@d.com", "pass": "...",
//      "secure": true, "from": "Name <a@d.com>" }, ...]
//
// Backward compatible: when this array is empty, the existing single smtp_*
// columns are used as a one-account pool, so nothing changes for current setups.
// Secrets live here in plaintext (same trust boundary as env on the host) and
// are never returned to the browser.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('app_settings', {
    smtp_accounts: { type: 'jsonb', notNull: true, default: '[]' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('app_settings', ['smtp_accounts']);
};
