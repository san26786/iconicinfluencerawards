/* eslint-disable camelcase */
// Category allocations — which categories each judge is responsible for.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('judge_categories', {
    id: 'id',
    judge_id:    { type: 'integer', references: 'judges', onDelete: 'CASCADE', notNull: true },
    site_id:     { type: 'integer', references: 'sites',  onDelete: 'CASCADE', notNull: true },
    category_id: { type: 'varchar(120)', notNull: true },
    allocated_at:{ type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('judge_categories', 'judge_categories_unique', {
    unique: ['judge_id', 'category_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('judge_categories');
};
