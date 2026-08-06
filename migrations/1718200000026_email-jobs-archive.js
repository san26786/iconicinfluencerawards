// Archive for email jobs: a done job can be archived (archived_at set) to move
// it out of the active/done views into an Archived tab, without deleting it.

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS archived_at timestamptz;
    CREATE INDEX IF NOT EXISTS email_jobs_archived_at ON email_jobs (archived_at);
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS email_jobs_archived_at;
    ALTER TABLE email_jobs DROP COLUMN IF EXISTS archived_at;
  `);
};
