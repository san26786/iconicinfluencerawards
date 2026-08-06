/* eslint-disable no-console */
//
// Moves the production domain onto this deployment's site row.
//
//   node -r dotenv/config scripts/cutover-to-production-domain.js dotenv_config_path=.env.local
//
// sites.domain and sites.slug are both UNIQUE, and the legacy row holds the
// clean slug — so the two rows have to be updated together or the second update
// fails. Everything below runs in one transaction.
//
// The staging alias is kept in alt_domains so it keeps resolving after the
// switch; app/robots.ts closes any non-canonical host to crawlers, so it stays
// out of the index on its own.
//
// Add --revert to put both rows back the way they were.

const { Pool } = require('pg');

const PROD_DOMAIN = 'propertyexcellenceawards.org';
const STAGING_DOMAIN = 'property-excellence-awards.vercel.app';
const CLEAN_SLUG = 'property-excellence-awards';
const LEGACY_SLUG = 'property-excellence-awards-legacy';

const REVERT = process.argv.includes('--revert');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — pass dotenv_config_path=.env.local');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    // Identify the two rows by the only thing that can't collide: the new row
    // is whichever one currently answers on the staging alias.
    const { rows: newRows } = await db.query(
      `SELECT id FROM sites
        WHERE domain = $1 OR $1 = ANY(COALESCE(alt_domains, '{}'::text[]))`,
      [STAGING_DOMAIN],
    );
    const { rows: oldRows } = await db.query(
      `SELECT id FROM sites WHERE domain = $1`,
      [PROD_DOMAIN],
    );

    if (REVERT) {
      const target = oldRows[0];
      if (!target) throw new Error(`No row holds ${PROD_DOMAIN} — nothing to revert`);
      const { rows: legacyRows } = await db.query(
        `SELECT id FROM sites WHERE slug = $1`, [LEGACY_SLUG],
      );

      await db.query(
        `UPDATE sites SET domain = $1, slug = $2, alt_domains = NULL, updated_at = now()
          WHERE id = $3`,
        [STAGING_DOMAIN, `${CLEAN_SLUG}-staging`, target.id],
      );
      if (legacyRows[0]) {
        await db.query(
          `UPDATE sites SET domain = $1, slug = $2, is_active = true, updated_at = now()
            WHERE id = $3`,
          [PROD_DOMAIN, CLEAN_SLUG, legacyRows[0].id],
        );
        console.log(`Reverted: site ${legacyRows[0].id} serves ${PROD_DOMAIN} again`);
      }
      console.log(`Reverted: site ${target.id} back to ${STAGING_DOMAIN}`);
      await db.query('COMMIT');
      return;
    }

    if (!newRows[0]) throw new Error(`No row holds ${STAGING_DOMAIN} — run the seed first`);
    const newId = newRows[0].id;

    if (oldRows[0] && oldRows[0].id === newId) {
      console.log(`Site ${newId} already serves ${PROD_DOMAIN} — nothing to do`);
      await db.query('COMMIT');
      return;
    }

    // 1. Retire the legacy row and free the clean slug + domain it is holding.
    if (oldRows[0]) {
      const oldId = oldRows[0].id;
      await db.query(
        `UPDATE sites
            SET domain = $1, slug = $2, is_active = false, updated_at = now()
          WHERE id = $3`,
        [`legacy-${oldId}.${PROD_DOMAIN}`, LEGACY_SLUG, oldId],
      );
      console.log(`Retired site ${oldId} (is_active=false, slug=${LEGACY_SLUG})`);
    } else {
      console.log(`No existing row on ${PROD_DOMAIN} — nothing to retire`);
    }

    // 2. Promote this deployment's row onto the production domain.
    await db.query(
      `UPDATE sites
          SET domain = $1,
              slug = $2,
              alt_domains = $3,
              official_site = $4,
              is_active = true,
              updated_at = now()
        WHERE id = $5`,
      [PROD_DOMAIN, CLEAN_SLUG, [STAGING_DOMAIN], `https://${PROD_DOMAIN}/`, newId],
    );
    console.log(`Promoted site ${newId} → ${PROD_DOMAIN} (staging alias retained)`);

    await db.query('COMMIT');

    const { rows: after } = await db.query(
      `SELECT id, domain, alt_domains, slug, is_active FROM sites
        WHERE id = ANY($1::int[]) ORDER BY id`,
      [[newId, ...(oldRows[0] ? [oldRows[0].id] : [])]],
    );
    console.log('\nFinal state:');
    for (const r of after) {
      console.log(
        `  ${r.id}  ${r.domain}  slug=${r.slug}  active=${r.is_active}` +
          `  alt=${r.alt_domains ? r.alt_domains.join(',') : '—'}`,
      );
    }
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  } finally {
    db.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Cutover failed:', err.message);
  process.exit(1);
});
