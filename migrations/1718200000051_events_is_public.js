exports.up = async (sql) => {
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true`;
};

exports.down = async (sql) => {
  await sql`ALTER TABLE events DROP COLUMN IF EXISTS is_public`;
};
