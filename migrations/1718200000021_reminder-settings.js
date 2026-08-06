/* eslint-disable camelcase */

// Reminder engine settings: a master on/off switch and the default gap used
// when a flow step doesn't specify its own delay (and as the seeded default).
// Default OFF so no automated follow-up emails can go out until an organiser
// explicitly enables reminder processing in the Send Queue settings.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('app_settings', {
    reminders_enabled: { type: 'boolean', notNull: true, default: false },
    reminder_default_delay_minutes: { type: 'integer', notNull: true, default: 240 },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('app_settings', ['reminders_enabled', 'reminder_default_delay_minutes']);
};
