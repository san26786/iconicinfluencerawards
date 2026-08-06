// Soft delete for the remaining deletable records (nominations already got its
// deleted_at in 1718200000024_nominations-soft-delete). Instead of removing a
// row we set deleted_at; every read excludes deleted_at IS NOT NULL. Idempotent
// (IF NOT EXISTS) so it's safe regardless of prior partial state.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE potential_users    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE email_templates    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE email_flows        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE email_suppressions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    CREATE INDEX IF NOT EXISTS potential_users_not_deleted    ON potential_users    (deleted_at) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS email_templates_not_deleted    ON email_templates    (deleted_at) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS email_flows_not_deleted        ON email_flows        (deleted_at) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS email_suppressions_not_deleted ON email_suppressions (deleted_at) WHERE deleted_at IS NULL;
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS potential_users_not_deleted;
    DROP INDEX IF EXISTS email_templates_not_deleted;
    DROP INDEX IF EXISTS email_flows_not_deleted;
    DROP INDEX IF EXISTS email_suppressions_not_deleted;
    ALTER TABLE potential_users    DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE email_templates    DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE email_flows        DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE email_suppressions DROP COLUMN IF EXISTS deleted_at;
  `);
};
