/* eslint-disable camelcase */

// Potential users — a marketing/outreach list the organiser maintains by hand
// or via CSV import. Separate from `users` (those are real accounts). `custom`
// holds any extra CSV columns so they can be used as email-template variables.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('potential_users', {
    id: 'id',
    first_name: { type: 'varchar(120)' },
    last_name: { type: 'varchar(120)' },
    email: { type: 'varchar(255)', notNull: true },
    company: { type: 'varchar(255)' },
    phone: { type: 'varchar(40)' },
    source: { type: 'varchar(120)' }, // 'manual' | 'csv'
    custom: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  // Case-insensitive uniqueness so CSV re-imports upsert instead of duplicating.
  pgm.addConstraint('potential_users', 'potential_users_email_unique', { unique: 'email' });
  pgm.createIndex('potential_users', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('potential_users');
};
