/* eslint-disable camelcase */
// Judge scores — one row per (judge, nomination). Stores the numeric score
// (1-10), free-text notes, and the judge's own marking flags (first,
// semifinalist, finalist). These are the judge's personal view; the
// organiser sets the official flags on the nominations row directly.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('judge_scores', {
    id: 'id',
    judge_id:      { type: 'integer', references: 'judges',     onDelete: 'CASCADE', notNull: true },
    nomination_id: { type: 'integer', references: 'nominations', onDelete: 'CASCADE', notNull: true },
    site_id:       { type: 'integer', references: 'sites',       onDelete: 'CASCADE', notNull: true },
    score:              { type: 'integer' },
    notes:              { type: 'text' },
    marked_first:       { type: 'boolean', notNull: true, default: false },
    marked_semifinalist:{ type: 'boolean', notNull: true, default: false },
    marked_finalist:    { type: 'boolean', notNull: true, default: false },
    scored_at:  { type: 'timestamptz' },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('judge_scores', 'judge_scores_unique', {
    unique: ['judge_id', 'nomination_id'],
  });
  pgm.addConstraint('judge_scores', 'judge_scores_score_range', {
    check: 'score IS NULL OR (score >= 1 AND score <= 10)',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('judge_scores');
};
