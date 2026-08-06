'use client';

import { useState } from 'react';
import { Search, ShieldCheck, User, Ban, CheckCircle, KeyRound, X } from 'lucide-react';

type UserRow = {
  id: number; email: string; role: string; first_name: string | null;
  last_name: string | null; is_active: boolean; hub_admin: boolean; created_at: string;
};

function ResetPasswordModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async () => {
    if (password.length < 6) { setMsg('Min 6 characters'); return; }
    setStatus('loading');
    const res = await fetch('/api/hub/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, newPassword: password }),
    });
    if (res.ok) { setStatus('done'); setMsg('Password reset successfully!'); }
    else { setStatus('error'); setMsg('Failed to reset password.'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Reset Password</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-white/40 hover:text-white" /></button>
        </div>
        <p className="text-sm text-white/50 mb-4">{user.email}</p>
        {status === 'done' ? (
          <p className="text-sm text-emerald-400">{msg}</p>
        ) : (
          <>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none mb-3"
            />
            {msg && <p className="text-xs text-red-400 mb-3">{msg}</p>}
            <button
              onClick={submit}
              disabled={status === 'loading'}
              className="w-full rounded-xl bg-gold-gradient py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {status === 'loading' ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function HubUsersClient({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'organiser' | 'visitor' | 'judge'>('all');
  const [resetUser, setResetUser] = useState<UserRow | null>(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email.includes(q) || (u.first_name ?? '').toLowerCase().includes(q) || (u.last_name ?? '').toLowerCase().includes(q);
    const matchRole = filter === 'all' || u.role === filter;
    return matchSearch && matchRole;
  });

  const counts = {
    all: users.length,
    organiser: users.filter(u => u.role === 'organiser').length,
    visitor: users.filter(u => u.role === 'visitor').length,
    judge: users.filter(u => u.role === 'judge').length,
  };

  return (
    <div className="space-y-4">
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />}
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {(['all','organiser','visitor','judge'] as const).map(r => (
            <button key={r} onClick={() => setFilter(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === r ? 'bg-gold-gradient text-ink' : 'border border-white/10 text-white/50 hover:text-white'}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)} <span className="ml-1 opacity-60">({counts[r]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                        {(u.first_name?.[0] ?? u.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : '—'}
                          {u.hub_admin && <ShieldCheck className="ml-1.5 inline h-3.5 w-3.5 text-gold" />}
                        </div>
                        <div className="text-xs text-white/40">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold
                      ${u.role === 'organiser' ? 'bg-gold/10 text-gold' :
                        u.role === 'judge' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-white/5 text-white/50'}`}>
                      {u.role === 'organiser' ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active
                      ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-3 w-3" /> Active</span>
                      : <span className="flex items-center gap-1 text-xs text-red-400"><Ban className="h-3 w-3" /> Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setResetUser(u)}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 hover:border-gold/40 hover:text-gold transition"
                    >
                      <KeyRound className="h-3 w-3" /> Reset
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-white/30">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
