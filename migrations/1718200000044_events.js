/* eslint-disable camelcase */
// Events table — organiser-managed events for a site (award ceremonies,
// networking nights, etc.). Multiple events per site are supported.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('events', {
    id:          'id',
    site_id:     { type: 'integer', notNull: true, references: 'sites', onDelete: 'CASCADE' },
    title:       { type: 'varchar(200)', notNull: true },
    description: { type: 'text' },
    event_date:  { type: 'timestamptz' },
    event_date_label: { type: 'varchar(100)' },
    venue:       { type: 'varchar(200)' },
    venue_address:{ type: 'text' },
    ticket_url:  { type: 'varchar(500)' },
    is_featured: { type: 'boolean', notNull: true, default: false },
    status:      { type: 'varchar(20)', notNull: true, default: "'upcoming'" },
    created_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('events', 'events_status_check', {
    check: "status IN ('upcoming', 'ongoing', 'completed', 'cancelled')",
  });

  pgm.createIndex('events', 'site_id');
};

exports.down = (pgm) => {
  pgm.dropTable('events');
};
