'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Save, ChevronDown, Search, RefreshCw, Download } from 'lucide-react';
import Link from 'next/link';
import type { EventTabConfig, FieldConfig } from '@/lib/eventTabsConfig';

type Item = { id: number; event_id: number; type: string; data: Record<string, string>; display_order: number };

function FieldInput({ field, value, onChange, formValues, dynamicOptions }: {
  field: FieldConfig;
  value: string;
  onChange: (v: string) => void;
  formValues?: Record<string, string>;
  dynamicOptions?: Record<string, string[]>;
}) {
  const base = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none';

  if (field.type === 'select') {
    const parentVal = field.dependsOn ? (formValues?.[field.dependsOn] ?? '') : '';
    const masterOpts = field.masterDataUrl ? (dynamicOptions?.[field.masterDataUrl] ?? []) : null;
    const opts = masterOpts ?? (field.optionsByParent
      ? (parentVal ? (field.optionsByParent[parentVal] ?? []) : [])
      : (field.options ?? []));
    const isDisabled = !!field.dependsOn && !parentVal;
    return (
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} disabled={isDisabled}
          className={base + ' appearance-none pr-8 disabled:opacity-40'}>
          <option value="" className="bg-slate-900">
            {isDisabled ? '— Select industry first —' : '— Select —'}
          </option>
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
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 transition hover:border-gold/40">
          <span className="text-xs text-white/40">Click to upload photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onChange(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {value && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="h-14 w-14 rounded-lg object-cover border border-white/10" />
            <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-300">Remove</button>
          </div>
        )}
      </div>
    );
  }
  return (
    <input type={field.type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder} required={field.required} className={base} />
  );
}

function ItemForm({
  config, initial, onSave, onCancel, saving, dynamicOptions,
}: {
  config: EventTabConfig;
  initial?: Record<string, string>;
  onSave: (data: Record<string, string>) => void;
  onCancel: () => void;
  saving: boolean;
  dynamicOptions?: Record<string, string[]>;
}) {
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(config.fields.map(f => [f.key, initial?.[f.key] ?? ''])),
  );

  function set(key: string, val: string) {
    setForm(p => {
      const next = { ...p, [key]: val };
      // Clear dependent fields when parent changes
      config.fields.forEach(f => {
        if (f.dependsOn === key) next[f.key] = '';
      });
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-gold/[0.02] p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gold/60">
        {initial ? 'Edit Record' : 'Add New Record'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.fields.map(f => (
          <div key={f.key} className={f.fullWidth ? 'sm:col-span-2 lg:col-span-3' : ''}>
            <label className="mb-1 block text-xs font-semibold text-white/50">
              {f.label}{f.required && <span className="ml-1 text-gold">*</span>}
            </label>
            <FieldInput field={f} value={form[f.key] ?? ''} onChange={v => set(f.key, v)} formValues={form} dynamicOptions={dynamicOptions} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={() => onSave(form)} disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:text-white">
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

export function EventItemsTab({ eventId, config }: { eventId: number; config: EventTabConfig }) {
  const [items, setItems]             = useState<Item[]>([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [editId, setEditId]           = useState<number | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<number | null>(null);
  const [siteId, setSiteId]           = useState<number | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});
  const [search, setSearch]           = useState('');

  const isTableView = !!config.tableColumns?.length;

  useEffect(() => {
    fetch('/api/organiser/site-id').then(r => r.json()).then(d => setSiteId(d.siteId)).catch(() => {});
  }, []);

  useEffect(() => {
    const urls = [...new Set(config.fields.filter(f => f.masterDataUrl).map(f => f.masterDataUrl!))];
    urls.forEach(url => {
      fetch(url)
        .then(r => r.json())
        .then(d => {
          const opts: string[] = (d.types ?? d.options ?? []).map((x: { name: string } | string) =>
            typeof x === 'string' ? x : x.name
          );
          setDynamicOptions(prev => ({ ...prev, [url]: opts }));
        })
        .catch(() => {});
    });
  }, [config.fields]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/organiser/events/${eventId}/items?type=${config.type}`)
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eventId, config.type]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      Object.values(item.data).some(v => v?.toLowerCase().includes(q))
    );
  }, [items, search]);

  async function handleAdd(data: Record<string, string>) {
    if (!siteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/organiser/events/${eventId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: config.type, data, site_id: siteId }),
      });
      if (res.ok) { load(); setAdding(false); }
    } finally { setSaving(false); }
  }

  async function handleEdit(itemId: number, data: Record<string, string>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/organiser/events/${eventId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (res.ok) { load(); setEditId(null); }
    } finally { setSaving(false); }
  }

  async function handleDelete(itemId: number) {
    if (!confirm('Delete this record?')) return;
    setDeleting(itemId);
    await fetch(`/api/organiser/events/${eventId}/items/${itemId}`, { method: 'DELETE' });
    setItems(p => p.filter(i => i.id !== itemId));
    setDeleting(null);
  }

  const displayLabel = (item: Item) => item.data[config.displayField] || '(Untitled)';
  const subLabel     = (item: Item) => config.subField ? item.data[config.subField] : null;
  const statusLabel  = (item: Item) => config.statusField ? item.data[config.statusField] : null;

  /* ── TABLE VIEW (e.g. Agenda) ── */
  if (isTableView) {
    const cols = config.tableColumns!;
    return (
      <div className="space-y-4">
        {/* Add button */}
        <div className="flex justify-end">
          <Link
            href={`/organiser/events/${eventId}/${config.type}/new`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold text-ink shadow-gold-sm transition hover:opacity-90 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Agenda
          </Link>
        </div>

        {/* Search + count */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${config.label.toLowerCase()}…`}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
            />
          </div>
          <span className="text-xs text-white/30">{filtered.length} of {items.length}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-left text-xs font-semibold uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3 w-10 text-center">#</th>
                {cols.map(c => (
                  <th key={c.key} className="px-4 py-3">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={cols.length + 2} className="px-4 py-10 text-center text-white/30">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !adding && (
                <tr>
                  <td colSpan={cols.length + 2} className="px-4 py-14 text-center text-white/30">
                    {search ? `No results for "${search}"` : `No ${config.label.toLowerCase()} yet — click Add ${config.label} to get started.`}
                  </td>
                </tr>
              )}
              {filtered.map((item, idx) => (
                  <tr key={item.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-center text-xs text-white/25">{idx + 1}</td>
                    {cols.map(c => (
                      <td key={c.key} className="px-4 py-3 text-white/75 text-xs max-w-[220px]">
                        {c.key === 'description'
                          ? <span className="line-clamp-2">{item.data[c.key] || <span className="text-white/20">—</span>}</span>
                          : c.key === 'type'
                            ? item.data[c.key]
                              ? <span className="rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold/80 whitespace-nowrap">{item.data[c.key]}</span>
                              : <span className="text-white/20">—</span>
                            : (item.data[c.key] || <span className="text-white/20">—</span>)
                        }
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/organiser/events/${eventId}/${config.type}/${item.id}/edit`}
                          className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-gold"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
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
      </div>
    );
  }

  /* ── CARD VIEW (default) ── */
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{config.description}</p>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setEditId(null); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold text-ink shadow-gold-sm transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New
          </button>
        )}
      </div>

      {adding && (
        <ItemForm config={config} onSave={handleAdd} onCancel={() => setAdding(false)} saving={saving} dynamicOptions={dynamicOptions} />
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-white/30">Loading…</p>
      ) : items.length === 0 && !adding ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-14 text-center">
          <p className="text-sm text-white/30">No records yet. Click <strong className="text-white/50">Add New</strong> to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              {editId === item.id ? (
                <div className="p-5">
                  <ItemForm config={config} initial={item.data}
                    onSave={data => handleEdit(item.id, data)}
                    onCancel={() => setEditId(null)} saving={saving} dynamicOptions={dynamicOptions} />
                </div>
              ) : (
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{displayLabel(item)}</span>
                      {statusLabel(item) && (
                        <span className="rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold/80">
                          {statusLabel(item)}
                        </span>
                      )}
                    </div>
                    {subLabel(item) && (
                      <p className="mt-0.5 text-xs text-white/40">{subLabel(item)}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                      {config.fields
                        .filter(f => !['textarea'].includes(f.type) && f.key !== config.displayField && f.key !== config.subField && f.key !== config.statusField && item.data[f.key])
                        .slice(0, 4)
                        .map(f => (
                          <span key={f.key} className="text-[11px] text-white/35">
                            <span className="text-white/20">{f.label}:</span> {item.data[f.key]}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => { setEditId(item.id); setAdding(false); }}
                      className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-gold" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}