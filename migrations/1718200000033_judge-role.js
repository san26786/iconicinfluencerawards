/* eslint-disable camelcase */
// Extend the users role constraint to allow 'judge' in addition to
// 'visitor' and 'organiser'. Judges get their own login portal at /judge.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropConstraint('users', 'users_role_check');
  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('visitor', 'organiser', 'judge')",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('users', 'users_role_check');
  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('visitor', 'organiser')",
  });
};
