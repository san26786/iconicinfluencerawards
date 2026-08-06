/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('sites', {
    logo_url:     { type: 'text' },
    font_display: { type: 'varchar(50)', default: "'playfair'" },
    font_body:    { type: 'varchar(50)', default: "'inter'" },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('sites', ['logo_url', 'font_display', 'font_body']);
};
