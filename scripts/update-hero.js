require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const domain = process.env.DEV_SITE_DOMAIN || 'iconicinfluencerawards.com';
  console.log(`Looking up site with domain: ${domain}`);

  const siteQuery = await pool.query(`SELECT id, name FROM sites WHERE domain = $1 OR $1 = ANY(COALESCE(alt_domains, '{}'::text[]))`, [domain]);

  if (siteQuery.rows.length === 0) {
    console.log('Site not found in DB.');
    process.exit(1);
  }

  const siteId = siteQuery.rows[0].id;
  const siteName = siteQuery.rows[0].name;
  console.log(`Found site: ${siteName} (ID: ${siteId})`);

  const heroImageId = '/iconic.png';

  await pool.query(
    `UPDATE sites SET hero_image_id = $1, updated_at = now() WHERE id = $2`,
    [heroImageId, siteId]
  );

  console.log(`Updated hero_image_id to ${heroImageId} for site ID ${siteId}`);
  await pool.end();
}

main().catch(console.error);
