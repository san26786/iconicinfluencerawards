// Uploaded images are stored as real bytes in the `media` table and served
// from /api/media/<id>, so a site row only ever holds a short URL.
//
// The previous approach inlined uploads as base64 data: URLs directly on the
// site row. That broke two things badly:
//   1. getSite() runs on every request, so a multi-MB data: URL was inlined
//      into the HTML of every single page load.
//   2. Saving Site Settings posts the whole form back — including that data:
//      URL — which blew past the ~4.5MB serverless request-body cap. The
//      platform rejected it with an empty body, surfacing to organisers as
//      "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
//
// Existing data: URLs already stored on site rows keep rendering fine — the
// hero/header components handle both shapes.

import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';

export function ensureMediaTable() {
  return ensureOnce('media', () =>
    query(`
      CREATE TABLE IF NOT EXISTS media (
        id         SERIAL PRIMARY KEY,
        site_id    INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        mime       TEXT NOT NULL,
        data       BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(() => {}),
  );
}

/** Store bytes and return the public path to serve them from. */
export async function storeMedia(
  siteId: number | null,
  mime: string,
  bytes: Buffer,
): Promise<string> {
  await ensureMediaTable();
  const { rows } = await query<{ id: number }>(
    `INSERT INTO media (site_id, mime, data) VALUES ($1, $2, $3) RETURNING id`,
    [siteId, mime, bytes],
  );
  return `/api/media/${rows[0].id}`;
}

export async function getMedia(
  id: number,
): Promise<{ mime: string; data: Buffer } | null> {
  await ensureMediaTable();
  const { rows } = await query<{ mime: string; data: Buffer }>(
    `SELECT mime, data FROM media WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
