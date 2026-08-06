// Soft delete for nominations (deleted_at). NOTE: this migration was already
// applied to existing databases; this file is a reconstruction so the on-disk
// migration history matches what ran. Idempotent (IF NOT EXISTS) and skipped on
// machines where it has already run.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE nominations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    CREATE INDEX IF NOT EXISTS nominations_not_deleted ON nominations (deleted_at) WHERE deleted_at IS NULL;
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS nominations_not_deleted;
    ALTER TABLE nominations DROP COLUMN IF EXISTS deleted_at;
  `);
};
