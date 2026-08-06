/* eslint-disable camelcase */
// Per-category judging configuration — one row per (site, category).
// Controls eligibility engine inclusion, graph display, applicant-level
// judging toggle, and live stat counts updated by the organiser.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('award_categories', {
    id: 'id',
    site_id:      { type: 'integer', references: 'sites', onDelete: 'CASCADE', notNull: true },
    category_id:  { type: 'varchar(120)', notNull: true },
    category_name:{ type: 'varchar(200)' },
    include_in_eligibility:    { type: 'boolean', notNull: true, default: true },
    nominations_count:         { type: 'integer', notNull: true, default: 0 },
    applications_count:        { type: 'integer', notNull: true, default: 0 },
    judges_count:              { type: 'integer', notNull: true, default: 0 },
    include_in_graph:          { type: 'boolean', notNull: true, default: true },
    applicant_level_judging:   { type: 'boolean', notNull: true, default: false },
    excluded_in_stats:         { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('award_categories', 'award_categories_site_category_unique', {
    unique: ['site_id', 'category_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('award_categories');
};
