/* eslint-disable camelcase */

// Nominations table — receives what used to be POSTed to the upstream PHP API.
// Mirrors the JSON payload built by components/RegisterForm.tsx: flattened
// nominee/nominator columns for easy querying, plus jsonb for the list-shaped
// bits (award_categories, supporting docs) and a raw_payload copy as a safety
// net so nothing submitted is ever lost even if a column is added later.
//
// File uploads are NOT stored as bytes here — only their metadata (name/size/
// type) inside `supporting`, exactly as the original payload carried it.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('nominations', {
    id: 'id',
    // Nullable: public nominations are submitted without being logged in.
    user_id: {
      type: 'integer',
      references: 'users',
      onDelete: 'SET NULL',
    },
    site: { type: 'varchar(120)' },
    submitted_at: { type: 'timestamptz' },
    award_categories: { type: 'jsonb', notNull: true, default: '[]' },
    self_nominate: { type: 'boolean', notNull: true, default: false },

    // Nominee (the person being put forward)
    nominee_first_name: { type: 'varchar(120)' },
    nominee_last_name: { type: 'varchar(120)' },
    nominee_email: { type: 'varchar(255)' },
    nominee_mobile: { type: 'varchar(40)' },
    nominee_work_phone: { type: 'varchar(40)' },
    nominee_organisation: { type: 'varchar(255)' },
    nominee_post_code: { type: 'varchar(40)' },
    anonymous: { type: 'boolean', notNull: true, default: false },
    opening_statement: { type: 'text' },
    linked_in: { type: 'varchar(255)' },
    how_heard: { type: 'varchar(120)' },

    // Nominator (the person filling in the form)
    nominator_first_name: { type: 'varchar(120)' },
    nominator_last_name: { type: 'varchar(120)' },
    nominator_email: { type: 'varchar(255)' },
    nominator_mobile: { type: 'varchar(40)' },
    nominator_work_phone: { type: 'varchar(40)' },
    business_name: { type: 'varchar(255)' },
    business_location: { type: 'varchar(255)' },
    business_category: { type: 'varchar(120)' },

    supporting: { type: 'jsonb', notNull: true, default: '{}' },
    agreed_to_terms: { type: 'boolean', notNull: true, default: false },
    raw_payload: { type: 'jsonb' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('nominations', 'nominee_email');
  pgm.createIndex('nominations', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('nominations');
};
