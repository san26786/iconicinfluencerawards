/* eslint-disable camelcase */
// Adds agreed_to_terms column to judges table.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('judges', {
    agreed_to_terms: { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('judges', ['agreed_to_terms']);
};
