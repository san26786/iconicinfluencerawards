/* eslint-disable camelcase */

// Records WHICH SMTP sending account delivered each recipient, so a campaign's
// even split across the multi-mailbox pool can be verified at a glance (a
// per-account breakdown on the campaign stats page). Null for recipients sent
// before this existed, or via the API providers (Resend/Mailgun), where a
// single account is implied.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('email_recipients', {
    sent_account: { type: 'text' }, // SMTP username of the mailbox that sent it
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('email_recipients', ['sent_account']);
};
