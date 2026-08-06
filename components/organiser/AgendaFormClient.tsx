'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, ImagePlus, ChevronDown, Plus, Pencil, Trash2, RefreshCw, Download } from 'lucide-react';
import Link from 'next/link';
import { EVENT_TABS } from '@/lib/eventTabsConfig';

const agendaConfig = EVENT_TABS.find(t => t.id === 'agenda')!;

const base = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none';

type Session = { id: number; data: Record<string, string> };

export function AgendaFormClient({
  eventId,
  siteId,
  itemId,
  initialData,
  backUrl,
}: {
  eventId: number;
  siteId: number;
  itemId?: number;
  initialData?: Record<string, string>;
  backUrl: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(agendaConfig.fields.map(f => [f.key, initialData?.[f.key] ?? ''])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deletingSession, setDeletingSession] = useState<number | null>(null);

  const loadSessions = useCallback(() => {
    if (!itemId) return;
    fetch(`/api/organiser/events/${eventId}/items?type=agenda_session&agenda_id=${itemId}`)
      .then(r => r.json())
      .then(d => setSessions(d.items ?? []))
      .catch(() => {});
  }, [eventId, itemId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  function set(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    if (!form.title?.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = itemId
        ? `/api/organiser/events/${eventId}/items/${itemId}`
        : `/api/organiser/events/${eventId}/items`;
      const res = await fetch(url, {
        method: itemId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemId ? { data: form } : { type: 'agenda', data: form, site_id: siteId }),
      });
      if (res.ok) {
        router.push(backUrl);
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Save failed.');
      }
    } finally { setSaving(false); }
  }

  async function autoSetupSlots() {
    if (!itemId) return;
    if (!confirm('Auto Setup Slots: generate time slots every 30 mins (9:00 AM – 6:00 PM) as sessions?')) return;
    const slots = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM'];
    for (const slot of slots) {
      await fetch(`/api/organiser/events/${eventId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agenda_session', site_id: siteId, data: { title: `Session – ${slot}`, start_time: slot, agenda_id: String(itemId) } }),
      });
    }
    loadSessions();
  }

  function downloadSlots() {
    const headers = ['#', 'Speaker', 'Title', 'Date', 'Start Time', 'End Time', 'Video Type'];
    const rows = sessions.map((s, i) => [
      String(i + 1),
      s.data.speaker ?? '',
      s.data.title ?? '',
      s.data.date ?? '',
      s.data.start_time ?? '',
      s.data.end_time ?? '',
      s.data.video_type ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'agenda-sessions.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteSession(sessionId: number) {
    if (!confirm('Delete this session?')) return;
    setDeletingSession(sessionId);
    await fetch(`/api/organiser/events/${eventId}/items/${sessionId}`, { method: 'DELETE' });
    setSessions(p => p.filter(s => s.id !== sessionId));
    setDeletingSession(null);
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* Toolbar — edit mode only */}
      {itemId && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={autoSetupSlots}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Auto Setup Slots
          </button>
          <button
            onClick={downloadSlots}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Download Available Slots
          </button>
          <Link
            href={`/organiser/events/${eventId}/agenda/${itemId}/session/new`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/20 transition-colors whitespace-nowrap ml-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Session Details
          </Link>
        </div>
      )}

      {/* Form card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="space-y-5">
          {agendaConfig.fields.map(f => (
            <div key={f.key} className={f.fullWidth ? 'col-span-full' : ''}>
              <label className="mb-1.5 block text-sm font-semibold text-white/60">
                {f.label}
                {f.required && <span className="ml-1 text-gold">*</span>}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  rows={4}
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={base + ' resize-none'}
                />
              ) : f.type === 'select' ? (
                <div className="relative">
                  <select
                    value={form[f.key] ?? ''}
                    onChange={e => set(f.key, e.target.value)}
                    className={base + ' appearance-none pr-8'}
                  >
                    <option value="" style={{ background: '#0f172a', color: '#fff' }}>— Select —</option>
                    {f.options?.map(o => (
                      <option key={o} value={o} style={{ background: '#0f172a', color: '#fff' }}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                </div>
              ) : f.type === 'image' ? (
                <div className="space-y-2">
                  {form[f.key] ? (
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form[f.key]} alt="preview" className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60">File uploaded</p>
                        <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs text-gold/70 hover:text-gold transition-colors">
                          <ImagePlus className="h-3 w-3" /> Change file
                          <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => set(f.key, reader.result as string);
                              reader.readAsDataURL(file);
                            }} />
                        </label>
                      </div>
                      <button type="button" onClick={() => set(f.key, '')}
                        className="shrink-0 rounded-full p-1 text-white/25 hover:text-red-400 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] py-6 transition hover:border-gold/40 hover:bg-gold/[0.02]">
                      <ImagePlus className="h-6 w-6 text-white/25" />
                      <span className="text-xs text-white/40">Browse to upload attachment</span>
                      <span className="text-[11px] text-white/20">PDF, DOC, PNG, JPG</span>
                      <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => set(f.key, reader.result as string);
                          reader.readAsDataURL(file);
                        }} />
                    </label>
                  )}
                </div>
              ) : (
                <input
                  type={f.type}
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={base}
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-bold text-ink shadow-gold transition hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : itemId ? 'Update Agenda' : 'Save Agenda'}
          </button>
          <button
            onClick={() => router.push(backUrl)}
            className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:text-white"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>

      {/* Sessions table — edit mode only */}
      {itemId && (
        <div>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Session Details</h2>
            <p className="mt-0.5 text-xs text-white/35">Speaker slots for this lobby agenda</p>
          </div>
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
              <p className="text-sm text-white/25">No sessions yet — click <strong className="text-white/40">Add Session Details</strong> above to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Speaker</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sessions.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3 text-xs text-white/25">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs text-white/60">{s.data.speaker || <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3 text-xs font-medium text-white/80">{s.data.title || <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{s.data.date || <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{s.data.start_time || <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{s.data.end_time || <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/organiser/events/${eventId}/agenda/${itemId}/session/${s.id}/edit`}
                            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-gold transition"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => deleteSession(s.id)}
                            disabled={deletingSession === s.id}
                            className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
