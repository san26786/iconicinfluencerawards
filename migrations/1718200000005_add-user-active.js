/* eslint-disable camelcase */

// Adds an `is_active` flag to users. Organisers can deactivate accounts; a
// deactivated user can no longer log in (enforced in app/api/auth/login).
// Defaults to true so every existing account stays able to sign in.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('users', {
    is_active: { type: 'boolean', notNull: true, default: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'is_active');
};
