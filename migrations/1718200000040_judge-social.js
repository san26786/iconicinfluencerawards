/* eslint-disable camelcase */
// Adds Facebook and Twitter social URL columns to judges.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('judges', {
    facebook: { type: 'varchar(255)' },
    twitter:  { type: 'varchar(255)' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('judges', ['facebook', 'twitter']);
};
