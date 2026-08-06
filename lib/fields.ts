// Custom-field helpers for potential users. CSV columns that aren't a known
// field become custom fields: the header is slugified to a camelCase key (so it
// works as {{key}} in templates) and the original header is kept as a label in
// the potential_user_fields registry (powers the UI + designer variable list).

import { query } from '@/lib/db';

// Known/built-in template variables — custom keys must never collide with these.
export const RESERVED_KEYS = new Set([
  'firstName', 'lastName', 'fullName', 'email', 'company', 'phone',
  'title', 'position', 'gender',
  'siteName', 'siteUrl', 'year', 'nominationLink', 'unsubscribeUrl',
]);

/** Turn an arbitrary CSV header into a safe camelCase, template-usable key. */
export function slugifyKey(header: string): string {
  const words = String(header)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  let key = words[0] + words.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  // Template tokens must start with a letter (renderTemplate matches [\w.]+).
  if (/^[0-9]/.test(key)) key = `f${key[0].toUpperCase()}${key.slice(1)}`;
  return key.slice(0, 80);
}

export type FieldDef = { key: string; label: string };

export async function getFieldDefs(): Promise<FieldDef[]> {
  const { rows } = await query<FieldDef>(
    'SELECT key, label FROM potential_user_fields ORDER BY label',
  );
  return rows;
}

/** Register any new custom fields (idempotent — existing keys are left as-is). */
export async function registerFieldDefs(defs: FieldDef[]): Promise<void> {
  const map = new Map<string, string>();
  for (const d of defs) {
    if (d.key && !RESERVED_KEYS.has(d.key)) map.set(d.key, d.label || d.key);
  }
  if (map.size === 0) return;
  const keys = [...map.keys()];
  const labels = keys.map((k) => map.get(k)!);
  await query(
    `INSERT INTO potential_user_fields (key, label)
     SELECT x.key, x.label FROM unnest($1::text[], $2::text[]) AS x(key, label)
     ON CONFLICT (key) DO NOTHING`,
    [keys, labels],
  );
}
