/* eslint-disable camelcase */

// Makes the email provider / from-address / credentials configurable from the
// organiser settings UI (stored on the app_settings singleton) instead of only
// via env vars. Empty values fall back to the corresponding env var, so
// existing env-based setups keep working unchanged.
//
// Note: secrets are stored here in plaintext (same trust boundary as env on the
// host). They are never returned to the browser — the settings API only reports
// whether each secret is set.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('app_settings', {
    email_provider: { type: 'varchar(20)', notNull: true, default: '' }, // ''|resend|mailgun|smtp
    email_from: { type: 'varchar(255)', notNull: true, default: '' },
    resend_api_key: { type: 'text', notNull: true, default: '' },
    mailgun_api_key: { type: 'text', notNull: true, default: '' },
    mailgun_domain: { type: 'varchar(255)', notNull: true, default: '' },
    mailgun_region: { type: 'varchar(10)', notNull: true, default: 'us' },
    smtp_host: { type: 'varchar(255)', notNull: true, default: '' },
    smtp_port: { type: 'integer', notNull: true, default: 587 },
    smtp_user: { type: 'varchar(255)', notNull: true, default: '' },
    smtp_pass: { type: 'text', notNull: true, default: '' },
    smtp_secure: { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('app_settings', [
    'email_provider', 'email_from', 'resend_api_key',
    'mailgun_api_key', 'mailgun_domain', 'mailgun_region',
    'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure',
  ]);
};
