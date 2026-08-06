'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Save, ChevronDown, Search, ImagePlus } from 'lucide-react';
import type { EventTabConfig, FieldConfig } from '@/lib/eventTabsConfig';

type Item = { id: number; event_id: number; type: string; data: Record<string, string>; display_order: number };

const COLUMNS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name',  label: 'Last Name' },
  { key: 'title',      label: 'Title' },
  { key: 'type',       label: 'Type' },
  { key: 'expire_date', label: 'Expiry Date' },
  { key: 'issue_date',  label: 'Issue Date' },
];

function FieldInput({ field, value, onChange, dynamicOptions }: {
  field: FieldConfig; value: string; onChange: (v: string) => void;
  dynamicOptions?: Record<string, string[]>;
}) {
  const base = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none';

  if (field.type === 'select') {
    const opts = field.masterDataUrl
      ? (dynamicOptions?.[field.masterDataUrl] ?? [])
      : (field.options ?? []);
    return (
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className={base + ' appearance-none pr-8'}>
          <option value="" className="bg-slate-900">— Select —</option>
          {opts.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
      </div>
    );
  }
  if (field.type === 'textarea') {
    return <textarea rows={3} value={value} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder} className={base + ' resize-none'} />;
  }
  if (field.type === 'image') {
    return (
      <div className="space-y-2">
        {value ? (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60">Photo uploaded</p>
              <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs text-gold/70 hover:text-gold transition-colors">
                <ImagePlus className="h-3 w-3" /> Change photo
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => onChange(reader.result as string);
                    reader.readAsDataURL(file);
                  }} />
              </label>
            </div>
            <button type="button" onClick={() => onChange('')}
              className="shrink-0 rounded-full p-1 text-white/25 hover:text-red-400 transition-colors" title="Remove">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] py-5 transition hover:border-gold/40 hover:bg-gold/[0.02]">
            <ImagePlus className="h-6 w-6 text-white/25" />
            <span className="text-xs text-white/40">Click to upload photo</span>
            <span className="text-[11px] text-white/20">PNG, JPG, WEBP</span>
            <input type="file" accept="image/*" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange(reader.result as string);
                reader.readAsDataURL(file);
              }} />
          </label>
        )}
      </div>
    );
  }
  return (
    <input type={field.type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder} required={field.required} className={base} />
  );
}

function MemberForm({ config, initial, onSave, onCancel, saving, dynamicOptions }: {
  config: EventTabConfig; initial?: Record<string, string>;
  onSave: (data: Record<string, string>) => void;
  onCancel: () => void; saving: boolean;
  dynamicOptions?: Record<string, string[]>;
}) {
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(config.fields.map(f => [f.key, initial?.[f.key] ?? ''])),
  );
  return (
    <div className="rounded-2xl border border-gold/20 bg-gold/[0.02] p-6 mb-4">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gold/60">
        {initial ? 'Edit Member' : 'Add New Member'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.fields.map(f => (
          <div key={f.key} className={f.fullWidth ? 'sm:col-span-2 lg:col-span-3' : ''}>
            <label className="mb-1 block text-xs font-semibold text-white/50">
              {f.label}{f.required && <span className="ml-1 text-gold">*</span>}
            </label>
            <FieldInput field={f} value={form[f.key] ?? ''} onChange={v => setForm(p => ({ ...p, [f.key]: v }))} dynamicOptions={dynamicOptions} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={() => onSave(form)} disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:text-white">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}

function formatDate(val: string) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function LeadershipBoardTab({ eventId, config }: { eventId: number; config: EventTabConfig }) {
  const [items, setItems]       = useState<Item[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [search, setSearch]     = useState('');
  const [siteId, setSiteId]     = useState<number | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/api/organiser/site-id').then(r => r.json()).then(d => setSiteId(d.siteId)).catch(() => {});
  }, []);

  useEffect(() => {
    const urls = [...new Set(config.fields.filter(f => f.masterDataUrl).map(f => f.masterDataUrl!))];
    urls.forEach(url => {
      fetch(url).then(r => r.json()).then(d => {
        const opts: string[] = (d.types ?? d.options ?? []).map((x: { name: string } | string) =>
          typeof x === 'string' ? x : x.name);
        setDynamicOptions(prev => ({ ...prev, [url]: opts }));
      }).catch(() => {});
    });
  }, [config.fields]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/organiser/events/${eventId}/items?type=${config.type}`)
      .then(r => r.json()).then(d => setItems(d.items ?? []))
      .catch(() => setItems([])).finally(() => setLoading(false));
  }, [eventId, config.type]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      COLUMNS.some(c => (it.data[c.key] ?? '').toLowerCase().includes(q))
    );
  }, [items, search]);

  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id));
  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach(i => next.delete(i.id));
      else filtered.forEach(i => next.add(i.id));
      return next;
    });
  }
  function toggleOne(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleAdd(data: Record<string, string>) {
    if (!siteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/organiser/events/${eventId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: config.type, data, site_id: siteId }),
      });
      if (res.ok) { load(); setShowForm(false); }
    } finally { setSaving(false); }
  }

  async function handleEdit(itemId: number, data: Record<string, string>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/organiser/events/${eventId}/items/${itemId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (res.ok) { load(); setEditId(null); }
    } finally { setSaving(false); }
  }

  async function handleDelete(itemId: number) {
    if (!confirm('Delete this member?')) return;
    await fetch(`/api/organiser/events/${eventId}/items/${itemId}`, { method: 'DELETE' });
    setItems(p => p.filter(i => i.id !== itemId));
    setSelected(p => { const n = new Set(p); n.delete(itemId); return n; });
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected member(s)?`)) return;
    setBulkDeleting(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/organiser/events/${eventId}/items/${id}`, { method: 'DELETE' })
    ));
    setItems(p => p.filter(i => !selected.has(i.id)));
    setSelected(new Set());
    setBulkDeleting(false);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={handleBulkDelete} disabled={selected.size === 0 || bulkDeleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-30">
          <Trash2 className="h-3.5 w-3.5" />
          Bulk Delete {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50" />
        </div>
        <span className="text-xs text-white/40 whitespace-nowrap">{filtered.length} of {items.length}</span>
        <button onClick={() => { setShowForm(true); setEditId(null); }}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold text-ink shadow-gold-sm transition hover:opacity-90 whitespace-nowrap">
          <Plus className="h-3.5 w-3.5" /> Add Member
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && !editId && (
        <MemberForm config={config} onSave={handleAdd} onCancel={() => setShowForm(false)}
          saving={saving} dynamicOptions={dynamicOptions} />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="h-4 w-4 accent-gold rounded" />
              </th>
              <th className="px-4 py-3 w-12">ID</th>
              {COLUMNS.map(c => (
                <th key={c.key} className="px-4 py-3">{c.label}</th>
              ))}
              <th className="px-4 py-3 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr><td colSpan={COLUMNS.length + 3} className="px-4 py-10 text-center text-white/30">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={COLUMNS.length + 3} className="px-4 py-10 text-center text-white/30">
                {search ? `No results for "${search}"` : 'No members yet — click Add Member to get started.'}
              </td></tr>
            )}
            {filtered.map(item => (
              <>
                <tr key={item.id} className={`transition hover:bg-white/5 ${selected.has(item.id) ? 'bg-gold/5' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)}
                      className="h-4 w-4 accent-gold rounded" />
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">{item.id}</td>
                  {COLUMNS.map(c => (
                    <td key={c.key} className="px-4 py-3 text-white/80 text-xs">
                      {c.key === 'issue_date' || c.key === 'expire_date'
                        ? formatDate(item.data[c.key] ?? '')
                        : (item.data[c.key] || <span className="text-white/20">—</span>)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditId(item.id); setShowForm(false); }}
                        className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-gold" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-400" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {editId === item.id && (
                  <tr key={`edit-${item.id}`}>
                    <td colSpan={COLUMNS.length + 3} className="px-4 py-4 bg-white/[0.02]">
                      <MemberForm config={config} initial={item.data}
                        onSave={data => handleEdit(item.id, data)}
                        onCancel={() => setEditId(null)} saving={saving} dynamicOptions={dynamicOptions} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
