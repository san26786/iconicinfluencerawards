/* eslint-disable camelcase */
// Migration 049: event_categories + event_questions tables, linked_site_id on themes.
// event_categories are scoped to an event, grouped under a theme.
// Themes gain linked_site_id so categories can appear on a different site's /categories.

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Allow a theme to link its categories to another site's /categories page
  pgm.addColumns('themes', {
    linked_site_id: {
      type: 'integer',
      references: 'sites',
      onDelete: 'SET NULL',
    },
  });

  // Categories scoped to an event, optionally grouped under a theme
  pgm.createTable('event_categories', {
    id:            'id',
    event_id:      { type: 'integer', references: 'events', onDelete: 'CASCADE', notNull: true },
    theme_id:      { type: 'integer', references: 'themes', onDelete: 'SET NULL' },
    name:          { type: 'varchar(200)', notNull: true },
    description:   { type: 'text' },
    display_order: { type: 'integer', notNull: true, default: 0 },
    is_active:     { type: 'boolean', notNull: true, default: true },
    created_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('event_categories', 'event_id');
  pgm.createIndex('event_categories', 'theme_id');

  // Eligibility and application questions scoped to an event
  pgm.createTable('event_questions', {
    id:            'id',
    event_id:      { type: 'integer', references: 'events', onDelete: 'CASCADE', notNull: true },
    question_type: { type: 'varchar(20)', notNull: true, default: 'eligibility' },
    question_text: { type: 'text', notNull: true },
    field_type:    { type: 'varchar(20)', notNull: true, default: 'yes_no' },
    options:       { type: 'jsonb' },
    is_required:   { type: 'boolean', notNull: true, default: true },
    display_order: { type: 'integer', notNull: true, default: 0 },
    is_active:     { type: 'boolean', notNull: true, default: true },
    created_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('event_questions', 'event_id');
};

exports.down = (pgm) => {
  pgm.dropTable('event_questions');
  pgm.dropTable('event_categories');
  pgm.dropColumns('themes', ['linked_site_id']);
};
