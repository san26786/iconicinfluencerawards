// Usage: node scripts/upload-logo.mjs <path-to-logo-file> <site-domain>
// Example: node scripts/upload-logo.mjs "C:\Users\You\Desktop\logo.png" apps.thepowerbusinessawards.com

import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { extname, basename } from 'path';
import pg from 'pg';

const [,, filePath, domain = 'apps.thepowerbusinessawards.com'] = process.argv;

if (!filePath) {
  console.error('Usage: node scripts/upload-logo.mjs <logo-file-path> [domain]');
  process.exit(1);
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN not set. Run with: $env:BLOB_READ_WRITE_TOKEN="..." ; node ...');
  process.exit(1);
}

const ext = extname(filePath).slice(1) || 'png';
const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' };
const contentType = mimeMap[ext.toLowerCase()] ?? 'image/png';

console.log(`Reading: ${filePath}`);
const fileBuffer = readFileSync(filePath);
const fileName = `logos/power-business-awards-${Date.now()}.${ext}`;

console.log(`Uploading to Vercel Blob as ${fileName}...`);
const blob = await put(fileName, fileBuffer, {
  access: 'public',
  token,
  contentType,
});
console.log(`Uploaded: ${blob.url}`);

// Update DB
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('\nDATABASE_URL not set — skipping DB update.');
  console.log(`\nManually run: UPDATE sites SET logo_url = '${blob.url}' WHERE domain = '${domain}';`);
  process.exit(0);
}

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
const result = await client.query(
  `UPDATE sites SET logo_url = $1 WHERE domain = $2 RETURNING id, name, logo_url`,
  [blob.url, domain]
);
await client.end();

if (result.rows.length === 0) {
  console.error(`No site found with domain: ${domain}`);
} else {
  console.log(`\n✓ Updated site: ${result.rows[0].name}`);
  console.log(`  logo_url = ${result.rows[0].logo_url}`);
}
