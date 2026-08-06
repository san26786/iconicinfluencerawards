export async function up(sql) {
  await sql`ALTER TABLE themes ADD COLUMN IF NOT EXISTS logo_url text`;
}

export async function down(sql) {
  await sql`ALTER TABLE themes DROP COLUMN IF EXISTS logo_url`;
}
