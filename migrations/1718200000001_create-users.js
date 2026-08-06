/* eslint-disable camelcase */

// Users table — holds both visitor and organiser accounts. Role distinguishes
// the two login types. Password reset is handled with a single hashed token +
// expiry stored directly on the row (one outstanding reset per user is enough).
//
// Emails are stored lowercased by the application layer; the UNIQUE constraint
// then gives us case-insensitive uniqueness without a functional index.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id', // SERIAL PRIMARY KEY
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(20)', notNull: true, default: 'visitor' },
    first_name: { type: 'varchar(120)' },
    last_name: { type: 'varchar(120)' },
    phone: { type: 'varchar(40)' },
    reset_token_hash: { type: 'varchar(64)' },
    reset_token_expires: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('visitor', 'organiser')",
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
