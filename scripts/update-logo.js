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

  // Two distinct, transparent variants — see scripts/build-logo-variants.mjs.
  // logo_url renders on the dark chrome (default theme) and needs the white
  // wordmark; logo_url_light renders only under html[data-theme="light"] and
  // needs the black wordmark. Pointing both columns at the same flattened,
  // white-background file (the old behaviour here) is what made the header
  // logo look broken — it rendered as an opaque white box.
  const logoUrlDark = '/Iconic-Influencer-Awards-Logo-Dark.png';
  const logoUrlLight = '/Iconic-Influencer-Awards-Logo-Light.png';

  await pool.query(
    `UPDATE sites SET logo_url = $1, logo_url_light = $2, updated_at = now() WHERE id = $3`,
    [logoUrlDark, logoUrlLight, siteId]
  );

  console.log(`Updated logo_url to ${logoUrlDark} and logo_url_light to ${logoUrlLight} for site ID ${siteId}`);
  await pool.end();
}

main().catch(console.error);
