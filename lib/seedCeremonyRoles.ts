import { query } from './db';
import { CEREMONY_ROLE_CATEGORIES } from './ceremonyRolesData';

export async function seedCeremonyRoles(siteId: number, eventId: number): Promise<number> {
  // Ensure columns exist (safe to call on existing tables)
  await query(`ALTER TABLE ceremony_roles ADD COLUMN IF NOT EXISTS description text`).catch(() => {});
  await query(`ALTER TABLE ceremony_roles ADD COLUMN IF NOT EXISTS additional_details text`).catch(() => {});

  // Build the full values list for all roles
  const values: unknown[] = [];
  const chunks: string[] = [];
  let i = 1;

  for (const cat of CEREMONY_ROLE_CATEGORIES) {
    for (const r of cat.roles) {
      chunks.push(`($${i},$${i+1},$${i+2},$${i+3},$${i+4},$${i+5},'vacant')`);
      values.push(siteId, eventId, cat.label, r.role, r.description || null, r.additional_details || null);
      i += 6;
    }
  }

  if (chunks.length === 0) return 0;

  // Insert all roles, skipping any that already exist (idempotent)
  const { rowCount } = await query(
    `INSERT INTO ceremony_roles (site_id, event_id, category, role, description, additional_details, status)
     VALUES ${chunks.join(',')}
     ON CONFLICT (site_id, event_id, category, role) DO NOTHING`,
    values,
  );

  return rowCount ?? 0;
}
