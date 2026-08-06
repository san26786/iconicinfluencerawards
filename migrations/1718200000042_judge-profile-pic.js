/* eslint-disable camelcase */
// Adds profile_pic_url column to judges table.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('judges', {
    profile_pic_url: { type: 'text' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('judges', ['profile_pic_url']);
};
