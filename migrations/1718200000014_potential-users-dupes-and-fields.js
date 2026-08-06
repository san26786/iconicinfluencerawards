/* eslint-disable camelcase */

// Two changes to support the new CSV import flow:
//
//  1. Drop the one-row-per-email rule on potential_users. Duplicate prevention
//     moves to the explicit "check duplicates" import step (configurable match
//     columns). Send-time still de-dupes recipients by email, so an address is
//     only emailed once per campaign. A plain (non-unique) index keeps lookups
//     fast.
//
//  2. potential_user_fields — a small registry of custom CSV fields: the
//     slugified key (templatable as {{key}}) + the original header as a label.
//     Lets the UI show/search custom fields and the designer list them.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropConstraint('potential_users', 'potential_users_email_unique');
  pgm.createIndex('potential_users', 'email');

  pgm.createTable('potential_user_fields', {
    id: 'id',
    key: { type: 'varchar(80)', notNull: true, unique: true },
    label: { type: 'varchar(200)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('potential_user_fields');
  pgm.dropIndex('potential_users', 'email');
  pgm.addConstraint('potential_users', 'potential_users_email_unique', { unique: 'email' });
};
