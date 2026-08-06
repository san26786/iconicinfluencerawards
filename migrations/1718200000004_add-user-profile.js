/* eslint-disable camelcase */

// Adds the "My Awards Profile" store. Rather than ~30 new columns we keep the
// whole profile (personal details, work info, social links, "golden words" and
// small base64 file uploads) in a single jsonb column. Defaults to '{}' so
// existing users get an empty profile they can fill in later.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('users', {
    profile: { type: 'jsonb', notNull: true, default: '{}' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'profile');
};
