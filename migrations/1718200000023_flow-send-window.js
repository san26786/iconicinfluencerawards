/* eslint-disable camelcase */

// Per-flow "office hours" opt-in. When true, this flow's reminder emails are
// only sent inside the configured daily send window (app_settings.send_window_*,
// Europe/London) — even if the GLOBAL send window is switched off (24/7 sending).
// It can only make a flow MORE restrictive, never bypass the global window.
// Defaults to true so reminders stay confined to office hours unless an organiser
// deliberately opts a flow out.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('email_flows', {
    respect_send_window: { type: 'boolean', notNull: true, default: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('email_flows', ['respect_send_window']);
};
