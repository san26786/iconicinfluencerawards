/* eslint-disable camelcase */
// Adds the final judging flag to nominations.
//
// 039 added is_shortlisted / is_semifinalist / is_finalist but stopped short of
// the result itself, so the public /winners page had nothing to read. Purely
// additive with a false default, which matters because this database is shared
// with the other awards tenants.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('nominations', {
    is_winner: { type: 'boolean', notNull: true, default: false },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('nominations', ['is_winner'], { ifExists: true });
};
