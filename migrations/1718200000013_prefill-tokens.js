/* eslint-disable camelcase */

// Opaque prefill tokens (Option B). A random token maps server-side to a
// potential_user or a registered user; the public nomination form exchanges it
// (via /api/prefill) for that person's basic details — so no personal data ever
// appears in the link. One token per person (unique source+ref_id) so re-sends
// reuse the same link. `expires_at` is reserved for future use — not enforced.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('prefill_tokens', {
    id: 'id',
    token: { type: 'varchar(64)', notNull: true, unique: true },
    source: { type: 'varchar(20)', notNull: true }, // potential_user | user
    ref_id: { type: 'integer', notNull: true },
    expires_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('prefill_tokens', 'prefill_tokens_source_ref_unique', {
    unique: ['source', 'ref_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('prefill_tokens');
};
