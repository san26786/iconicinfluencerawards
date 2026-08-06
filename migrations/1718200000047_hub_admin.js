/* eslint-disable camelcase */
// Adds hub_admin flag to users so a designated super-admin can access the
// /hub area and create new multi-tenant sites without touching the database.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('users', {
    hub_admin: { type: 'boolean', notNull: true, default: false },
  });
  // Promote all existing organisers to hub_admin automatically.
  pgm.sql(`UPDATE users SET hub_admin = true WHERE role = 'organiser'`);
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'hub_admin');
};
