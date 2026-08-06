import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { HubUsersClient } from '@/components/hub/HubUsersClient';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hub — Users' };

type UserRow = {
  id: number; email: string; role: string; first_name: string | null;
  last_name: string | null; is_active: boolean; hub_admin: boolean; created_at: string;
} & QueryResultRow;

async function requireHubAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`, [user.sub],
  );
  return rows[0]?.hub_admin ? user : null;
}

export default async function HubUsersPage() {
  const user = await requireHubAdmin();
  if (!user) redirect('/login');

  const { rows } = await query<UserRow>(
    `SELECT id, email, role, first_name, last_name, is_active, hub_admin, created_at
     FROM users ORDER BY created_at DESC LIMIT 200`,
  );

  return (
    <div className="container-luxe section-pad py-10">
      <div className="mb-8">
        <span className="eyebrow mb-3 flex items-center gap-2">
          <span className="h-px w-5 bg-gold/60" /> Hub Admin
        </span>
        <h1 className="font-display text-4xl font-semibold text-white">
          All <span className="text-gold-gradient">Users</span>
        </h1>
        <p className="mt-2 text-white/50">View and manage accounts across all sites.</p>
      </div>
      <HubUsersClient users={rows} />
    </div>
  );
}
