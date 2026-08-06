/* eslint-disable camelcase */
// Judges table — stores both the initial application (status=pending) and
// the approved judge profile. On approval a users row is created and
// linked via user_id so the judge can log in at /judge.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('judges', {
    id: 'id',
    site_id: { type: 'integer', references: 'sites', onDelete: 'CASCADE', notNull: true },
    user_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    first_name: { type: 'varchar(120)', notNull: true },
    last_name:  { type: 'varchar(120)', notNull: true },
    email:      { type: 'varchar(255)', notNull: true },
    phone:      { type: 'varchar(50)' },
    company:    { type: 'varchar(200)' },
    job_title:  { type: 'varchar(200)' },
    bio:        { type: 'text' },
    expertise:  { type: 'text' },
    linkedin:   { type: 'varchar(255)' },
    status:     { type: 'varchar(20)', notNull: true, default: "'pending'" },
    applied_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    approved_at:  { type: 'timestamptz' },
    approved_by:  { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('judges', 'judges_status_check', {
    check: "status IN ('pending', 'approved', 'rejected')",
  });

  pgm.createIndex('judges', 'site_id');
  pgm.createIndex('judges', 'status');
  pgm.createIndex('judges', 'email');
};

exports.down = (pgm) => {
  pgm.dropTable('judges');
};
