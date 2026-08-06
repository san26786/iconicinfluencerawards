/* eslint-disable camelcase */

// Adds a configurable Reply-To address to the email settings. Empty falls back
// to the EMAIL_REPLY_TO env var; a per-message replyTo still wins over both.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('app_settings', {
    email_reply_to: { type: 'varchar(255)', notNull: true, default: '' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('app_settings', ['email_reply_to']);
};
