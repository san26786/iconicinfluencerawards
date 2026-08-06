'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, ChevronDown } from 'lucide-react';

const base = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none';

const SESSION_FIELDS = [
  { key: 'speaker',    label: 'Speaker',    type: 'select' as const, options: ['Keynote Speaker','Guest Speaker','Panel Speaker','Workshop Leader','Host / MC','Other'] },
  { key: 'title',      label: 'Title',      type: 'text' as const,   required: true, placeholder: 'e.g. Opening Keynote', fullWidth: true },
  { key: 'description',label: 'Description',type: 'textarea' as const, fullWidth: true },
  { key: 'date',       label: 'Date',       type: 'date' as const },
  { key: 'time_slot',  label: 'Time Slot',  type: 'select' as const, options: ['Morning (9AM–12PM)','Afternoon (12PM–5PM)','Evening (5PM–10PM)','Full Day'] },
  { key: 'start_time', label: 'Start Time', type: 'time' as const },
  { key: 'end_time',   label: 'End Time',   type: 'time' as const },
  { key: 'video_type', label: 'Video Type', type: 'select' as const, options: ['None','Live Stream','Pre-recorded','YouTube','Vimeo','Other'] },
  { key: 'video_link', label: 'Video Link', type: 'url' as const, fullWidth: true, placeholder: 'https://...' },
];

export function SessionFormClient({
  eventId,
  siteId,
  agendaId,
  sessionId,
  initialData,
  backUrl,
}: {
  eventId: number;
  siteId: number;
  agendaId: number;
  sessionId?: number;
  initialData?: Record<string, string>;
  backUrl: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(SESSION_FIELDS.map(f => [f.key, initialData?.[f.key] ?? ''])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    if (!form.title?.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const data = { ...form, agenda_id: String(agendaId) };
      const url = sessionId
        ? `/api/organiser/events/${eventId}/items/${sessionId}`
        : `/api/organiser/events/${eventId}/items`;
      const res = await fetch(url, {
        method: sessionId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionId
          ? { data }
          : { type: 'agenda_session', data, site_id: siteId }),
      });
      if (res.ok) {
        router.push(backUrl);
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Save failed.');
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 max-w-3xl">
      <div className="space-y-5">
        {SESSION_FIELDS.map(f => (
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
                placeholder={'placeholder' in f ? f.placeholder : undefined}
                className={base + ' resize-none'}
              />
            ) : f.type === 'select' ? (
              <div className="relative">
                <select
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  className={base + ' appearance-none pr-8'}
                >
                  <option value="" style={{background:'#0f172a',color:'#fff'}}>— Select —</option>
                  {'options' in f && f.options?.map(o => (
                    <option key={o} value={o} style={{background:'#0f172a',color:'#fff'}}>{o}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              </div>
            ) : (
              <input
                type={f.type}
                value={form[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
                placeholder={'placeholder' in f ? f.placeholder : undefined}
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
          {saving ? 'Saving…' : sessionId ? 'Update Session' : 'Save Session'}
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
  );
}
