/* eslint-disable no-console */
//
//   node -r dotenv/config scripts/upload-brand-logos.js dotenv_config_path=.env.local
//
// Stores the two brand logo variants in the media table and points the site row
// at them.
//
// This script was inherited from the property-excellence-awards fork and
// originally pointed at ITS brand files (SITE_ID 15 on the shared Postgres
// instance is that tenant, not this one) — running it as-is would have
// touched a different customer's site row. Repointed below at this repo's
// own Iconic Influencer Awards artwork, resolved by domain instead of a
// hardcoded id.
//
// Which file goes in which column is decided by the text colour, not the
// filename — "Dark"/"Light" is ambiguous about whether it means the ink or the
// background it sits on:
//
//   logo_url        shown on the dark navy chrome, i.e. the DEFAULT theme.
//                   Needs the white-text artwork (see build-logo-variants.mjs).
//   logo_url_light  shown only under html[data-theme="light"] (see the
//                   .theme-logo-* rules in globals.css). Needs the black-text
//                   artwork.
//
// Both source files must already be transparent — run
// `node scripts/build-logo-variants.mjs` first if they aren't (it derives
// them from the flattened public/474.png).
//
// Pass --check to verify the artwork without writing anything.

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SITE_DOMAIN = process.env.DEV_SITE_DOMAIN || 'iconicinfluencerawards.com';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const VARIANTS = [
  {
    column: 'logo_url',
    file: 'Iconic-Influencer-Awards-Logo-Dark.png',
    expect: 'white text — sits on the dark navy header',
    // The text must not be near-black, or it vanishes on the navy chrome.
    reject: (s) => s.nearBlackPct > 2,
    rejectWhy: 'this artwork has black text, which is invisible on the dark header',
  },
  {
    column: 'logo_url_light',
    file: 'Iconic-Influencer-Awards-Logo-Light.png',
    expect: 'black text — sits on the light theme',
    reject: (s) => s.nearBlackPct < 1,
    rejectWhy: 'this artwork has no black text, so it is not the light-theme variant',
  },
];

async function inspect(file) {
  const sharp = require('sharp');
  const img = sharp(file);
  const meta = await img.metadata();
  // Sample the wordmark, right of the trophy, rather than the whole canvas —
  // the trophy is gold in both variants and would mask the difference.
  const { data } = await img
    .extract({ left: 500, top: 80, width: 1800, height: 300 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let opaque = 0;
  let nearBlack = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    opaque++;
    if (Math.max(data[i], data[i + 1], data[i + 2]) < 70) nearBlack++;
  }
  return {
    width: meta.width,
    height: meta.height,
    hasAlpha: meta.hasAlpha,
    nearBlackPct: opaque ? (nearBlack / opaque) * 100 : 0,
  };
}

async function main() {
  const checkOnly = process.argv.includes('--check');

  const resolved = [];
  for (const v of VARIANTS) {
    const file = path.join(PUBLIC_DIR, v.file);
    if (!fs.existsSync(file)) throw new Error(`Missing ${v.file} in public/`);
    const stats = await inspect(file);
    const bad = v.reject(stats);
    console.log(
      `${v.column.padEnd(16)}${v.file}\n` +
        `                ${stats.width}x${stats.height} alpha=${stats.hasAlpha} ` +
        `near-black text ${stats.nearBlackPct.toFixed(1)}%  ${bad ? 'REJECTED' : 'ok'} — ${v.expect}`,
    );
    if (bad) throw new Error(`${v.file}: ${v.rejectWhy}`);
    resolved.push({ ...v, file, bytes: fs.readFileSync(file) });
  }

  if (checkOnly) {
    console.log('\n--check: artwork verified, nothing written.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const siteRow = await pool.query(
    `SELECT id FROM sites WHERE domain = $1 OR $1 = ANY(COALESCE(alt_domains, '{}'::text[]))`,
    [SITE_DOMAIN],
  );
  if (siteRow.rows.length === 0) {
    await pool.end();
    throw new Error(`No site found for domain ${SITE_DOMAIN}`);
  }
  const siteId = siteRow.rows[0].id;

  // Mirrors storeMedia() in lib/media.ts — a new row per upload, so the served
  // URL is immutable and can be cached hard.
  const urls = {};
  for (const v of resolved) {
    const { rows } = await pool.query(
      `INSERT INTO media (site_id, mime, data) VALUES ($1, $2, $3) RETURNING id`,
      [siteId, 'image/png', v.bytes],
    );
    urls[v.column] = `/api/media/${rows[0].id}`;
    console.log(`\nstored ${v.column} -> ${urls[v.column]} (${(v.bytes.length / 1024) | 0}kB)`);
  }

  await pool.query(
    `UPDATE sites SET logo_url = $1, logo_url_light = $2, updated_at = now() WHERE id = $3`,
    [urls.logo_url, urls.logo_url_light, siteId],
  );

  const after = (
    await pool.query('SELECT logo_url, logo_url_light FROM sites WHERE id = $1', [siteId])
  ).rows[0];
  console.log('\nRow now reads:');
  console.log(`  logo_url        ${after.logo_url}`);
  console.log(`  logo_url_light  ${after.logo_url_light}`);

  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
