/* eslint-disable camelcase */

// Daily send-window for the email queue: when enabled, the processor only sends
// inside [start, end] (Europe/London) and auto-pauses outside it. Defaults to
// ON, 09:00–18:30 — i.e. campaigns pause at 6:30pm UK and resume at 9am.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('app_settings', {
    send_window_enabled: { type: 'boolean', notNull: true, default: true },
    send_window_start: { type: 'varchar(5)', notNull: true, default: '09:00' },
    send_window_end: { type: 'varchar(5)', notNull: true, default: '18:30' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('app_settings', [
    'send_window_enabled',
    'send_window_start',
    'send_window_end',
  ]);
};
