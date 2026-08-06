/* eslint-disable camelcase */

// Indexes for the server-side Potential Users list: created_at drives the
// ORDER BY + pagination, and the rest back the filter dropdowns' equality
// filters. (Free-text search is an ILIKE scan; fine at this scale.)

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex('potential_users', 'created_at', { ifNotExists: true });
  pgm.createIndex('potential_users', 'title', { ifNotExists: true });
  pgm.createIndex('potential_users', 'position', { ifNotExists: true });
  pgm.createIndex('potential_users', 'gender', { ifNotExists: true });
  pgm.createIndex('potential_users', 'company', { ifNotExists: true });
  pgm.createIndex('potential_users', 'source', { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropIndex('potential_users', 'created_at', { ifExists: true });
  pgm.dropIndex('potential_users', 'title', { ifExists: true });
  pgm.dropIndex('potential_users', 'position', { ifExists: true });
  pgm.dropIndex('potential_users', 'gender', { ifExists: true });
  pgm.dropIndex('potential_users', 'company', { ifExists: true });
  pgm.dropIndex('potential_users', 'source', { ifExists: true });
};
