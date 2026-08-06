/* eslint-disable camelcase */

// Add site_id FK to nominations and potential_users so each record belongs
// to a specific site. Existing rows are backfilled to site_id = 1 (London).
// Uses pgm.sql() for the backfill so it is queued after the column is added.

exports.shorthands = undefined;

exports.up = (pgm) => {
  // ── nominations ──────────────────────────────────────────────────────────
  pgm.addColumns('nominations', {
    site_id: {
      type: 'integer',
      references: '"sites"',
      onDelete: 'RESTRICT',
    },
  });

  pgm.sql(`UPDATE nominations SET site_id = 1`);
  pgm.alterColumn('nominations', 'site_id', { notNull: true, default: 1 });
  pgm.createIndex('nominations', ['site_id', 'submitted_at']);

  // ── potential_users ───────────────────────────────────────────────────────
  pgm.addColumns('potential_users', {
    site_id: {
      type: 'integer',
      references: '"sites"',
      onDelete: 'RESTRICT',
    },
  });

  pgm.sql(`UPDATE potential_users SET site_id = 1`);
  pgm.alterColumn('potential_users', 'site_id', { notNull: true, default: 1 });
  pgm.createIndex('potential_users', ['site_id', 'created_at']);
};

exports.down = (pgm) => {
  pgm.dropIndex('potential_users', ['site_id', 'created_at']);
  pgm.dropColumns('potential_users', ['site_id']);

  pgm.dropIndex('nominations', ['site_id', 'submitted_at']);
  pgm.dropColumns('nominations', ['site_id']);
};
