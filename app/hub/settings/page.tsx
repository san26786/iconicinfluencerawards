import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hub — Settings' };

async function requireHubAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`, [user.sub],
  );
  return rows[0]?.hub_admin ? user : null;
}

export default async function HubSettingsPage() {
  const user = await requireHubAdmin();
  if (!user) redirect('/login');

  const { rows: sites } = await query(
    `SELECT id, name, domain, is_active FROM sites ORDER BY created_at`,
  );

  return (
    <div className="container-luxe section-pad py-10">
      <div className="mb-8">
        <span className="eyebrow mb-3 flex items-center gap-2">
          <span className="h-px w-5 bg-gold/60" /> Hub Admin
        </span>
        <h1 className="font-display text-4xl font-semibold text-white">
          Site <span className="text-gold-gradient">Settings</span>
        </h1>
        <p className="mt-2 text-white/50">Edit settings for any site directly from here.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(sites as { id: number; name: string; domain: string; is_active: boolean }[]).map((s) => (
          <a key={s.id} href={`/hub/sites/${s.id}`}
            className="glass rounded-2xl p-5 transition hover:border-gold/30 hover:bg-gold/[0.03] group block">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-white group-hover:text-gold transition">{s.name}</h3>
                <p className="mt-0.5 text-xs text-white/40">{s.domain}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {s.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-3 text-xs text-gold/60 group-hover:text-gold transition">Edit settings →</p>
          </a>
        ))}
      </div>
    </div>
  );
}
