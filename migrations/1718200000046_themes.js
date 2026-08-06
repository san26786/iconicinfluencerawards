/* eslint-disable camelcase */
// Per-site themes table — organisers can add/edit/hide themes shown on
// the public /themes page. Replaces the hardcoded THEMES array in lib/content.ts.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('themes', {
    id:            'id',
    site_id:       { type: 'integer', references: 'sites', onDelete: 'CASCADE', notNull: true },
    name:          { type: 'varchar(200)', notNull: true },
    theme:         { type: 'varchar(200)' },
    tagline:       { type: 'varchar(300)' },
    description:   { type: 'text' },
    icon:          { type: 'varchar(50)', notNull: true, default: 'Sparkles' },
    href:          { type: 'varchar(500)' },
    is_hidden:     { type: 'boolean', notNull: true, default: false },
    display_order: { type: 'integer', notNull: true, default: 0 },
    created_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('themes');
};
