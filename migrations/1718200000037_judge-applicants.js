/* eslint-disable camelcase */
// Applicant allocations — which nominations each judge must score.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('judge_applicants', {
    id: 'id',
    judge_id:      { type: 'integer', references: 'judges',      onDelete: 'CASCADE', notNull: true },
    nomination_id: { type: 'integer', references: 'nominations',  onDelete: 'CASCADE', notNull: true },
    site_id:       { type: 'integer', references: 'sites',        onDelete: 'CASCADE', notNull: true },
    allocated_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('judge_applicants', 'judge_applicants_unique', {
    unique: ['judge_id', 'nomination_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('judge_applicants');
};
