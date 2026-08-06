'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Download, Upload, X, AlertCircle, CheckCircle2, Loader2, CheckSquare, Square, MessageSquare, Check, Search } from 'lucide-react';
import { Icon, type IconName } from '@/components/ui/Icon';

type Theme = { id: number; name: string; icon: string; linked_site_id: number | null };

export type Category = {
  id: number;
  event_id: number;
  theme_id: number | null;
  name: string;
  tagline: string | null;
  short_name: string | null;
  short_summary: string | null;
  description: string | null;
  eligibility: string | null;
  judging_criteria: string | null;
  qualitative_criteria: string | null;
  metrics: string | null;
  additional_criteria: string | null;
  icon: string | null;
  entry_fee: string | null;
  display_order: number;
  is_active: boolean;
  promo: boolean;
  theme_name: string | null;
  theme_icon: string | null;
};

type CsvRow = {
  name: string;
  short_name: string;
  tagline: string;
  icon: string;
  theme_name: string;
  display_order: string;
  is_active: string;
  promo: string;
  entry_fee: string;
  short_summary: string;
  description: string;
  eligibility: string;
  judging_criteria: string;
  qualitative_criteria: string;
  metrics: string;
  additional_criteria: string;
};

/* ── CSV helpers ────────────────────────────────────────────────────────── */

function escapeCell(v: string | null | undefined): string {
  const s = v ?? '';
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const CSV_HEADERS = [
  'name', 'short_name', 'tagline', 'icon', 'theme_name',
  'display_order', 'is_active', 'promo', 'entry_fee',
  'short_summary', 'description', 'eligibility',
  'judging_criteria', 'qualitative_criteria', 'metrics', 'additional_criteria',
];

function exportCsv(categories: Category[]) {
  const rows = categories.map(c =>
    [
      escapeCell(c.name),
      escapeCell(c.short_name),
      escapeCell(c.tagline),
      escapeCell(c.icon),
      escapeCell(c.theme_name),
      String(c.display_order),
      String(c.is_active),
      String(c.promo),
      c.entry_fee ?? '0',
      escapeCell(c.short_summary),
      escapeCell(c.description),
      escapeCell(c.eligibility),
      escapeCell(c.judging_criteria),
      escapeCell(c.qualitative_criteria),
      escapeCell(c.metrics),
      escapeCell(c.additional_criteria),
    ].join(','),
  );
  const csv = [CSV_HEADERS.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `categories-event.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser — handles double-quoted fields
    const cells: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuote && line[j + 1] === '"') { cur += '"'; j++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cells.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);

    const row: Record<string, string> = {};
    header.forEach((h, idx) => { row[h] = (cells[idx] ?? '').trim(); });

    if (row.name) {
      results.push({
        name:                row.name                ?? '',
        short_name:          row.short_name          ?? '',
        tagline:             row.tagline             ?? '',
        icon:                row.icon               ?? '',
        theme_name:          row.theme_name          ?? '',
        display_order:       row.display_order       ?? '0',
        is_active:           row.is_active           ?? 'true',
        promo:               row.promo               ?? 'false',
        entry_fee:           row.entry_fee           ?? '0',
        short_summary:       row.short_summary       ?? '',
        description:         row.description         ?? '',
        eligibility:         row.eligibility         ?? '',
        judging_criteria:    row.judging_criteria    ?? '',
        qualitative_criteria:row.qualitative_criteria ?? '',
        metrics:             row.metrics             ?? '',
        additional_criteria: row.additional_criteria ?? '',
      });
    }
  }
  return results;
}

/* ── Import modal ───────────────────────────────────────────────────────── */

function ImportModal({
  eventId,
  themes,
  onClose,
  onImported,
}: {
  eventId: number;
  themes: Theme[];
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<CsvRow[]>([]);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);

  const themeNames = themes.map(t => t.name);

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length === 0) { setError('No valid rows found. Check the CSV format.'); return; }
      setError('');
      setParsed(rows);
    };
    reader.readAsText(file);
  }

  async function doImport() {
    if (parsed.length === 0) return;
    setLoading(true);
    try {
      const body = {
        categories: parsed.map((r, i) => ({
          name:                 r.name,
          short_name:           r.short_name           || undefined,
          tagline:              r.tagline              || undefined,
          icon:                 r.icon                || undefined,
          theme_name:           r.theme_name           || undefined,
          display_order:        Number(r.display_order) || i + 1,
          is_active:            r.is_active !== 'false',
          promo:                r.promo === 'true',
          entry_fee:            Number(r.entry_fee) || 0,
          short_summary:        r.short_summary        || undefined,
          description:          r.description          || undefined,
          eligibility:          r.eligibility          || undefined,
          judging_criteria:     r.judging_criteria     || undefined,
          qualitative_criteria: r.qualitative_criteria || undefined,
          metrics:              r.metrics              || undefined,
          additional_criteria:  r.additional_criteria  || undefined,
        })),
      };
      const res = await fetch(`/api/organiser/events/${eventId}/categories/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { inserted: number; skipped: number; errors: string[] };
      setResult(data);
      onImported(data.inserted);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f0f1a] shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold uppercase tracking-luxe text-gold">Import Categories</h2>
            <p className="mt-0.5 text-xs text-white/40">Upload a CSV to bulk-add categories to this event</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Result state */}
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300">
                  <span className="font-semibold">{result.inserted} categories imported</span>
                  {result.skipped > 0 && `, ${result.skipped} skipped (already exist)`}
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-400">{e}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Template hint */}
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-white/40 space-y-1">
                <p className="font-semibold text-white/55">Expected CSV columns (same as Export):</p>
                <code className="block text-gold/60 text-[0.7rem] break-all">
                  name, short_name, tagline, icon, theme_name, display_order, is_active, promo, entry_fee, short_summary, description, eligibility, judging_criteria, qualitative_criteria, metrics, additional_criteria
                </code>
                <p>Only <span className="text-white/60">name</span> is required. Use <span className="text-white/60">Export CSV</span> to get the exact template with all columns.</p>
                {themeNames.length > 0 && (
                  <p>Available themes: {themeNames.map(n => <span key={n} className="text-gold/50 mr-1">"{n}"</span>)}</p>
                )}
              </div>

              {/* File upload */}
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 py-10 cursor-pointer hover:border-gold/30 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <Upload className="h-8 w-8 text-white/20" />
                <p className="text-sm text-white/40">Drag & drop a CSV here, or <span className="text-gold underline">click to browse</span></p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Preview table */}
              {parsed.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Preview — {parsed.length} row{parsed.length !== 1 ? 's' : ''} detected
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-white/8 max-h-48">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/[0.03]">
                          {['name', 'tagline', 'short_name', 'theme_name', 'promo'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-white/35 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.slice(0, 8).map((r, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-3 py-2 text-white max-w-[180px] truncate">{r.name}</td>
                            <td className="px-3 py-2 text-white/40 max-w-[140px] truncate">{r.tagline || '—'}</td>
                            <td className="px-3 py-2 text-white/40">{r.short_name || '—'}</td>
                            <td className="px-3 py-2 text-gold/60">{r.theme_name || '—'}</td>
                            <td className="px-3 py-2 text-white/40">{r.promo === 'true' ? '★' : '—'}</td>
                          </tr>
                        ))}
                        {parsed.length > 8 && (
                          <tr>
                            <td colSpan={5} className="px-3 py-2 text-center text-white/25 text-xs">
                              …and {parsed.length - 8} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={doImport}
              disabled={parsed.length === 0 || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink shadow-gold disabled:opacity-40 hover:-translate-y-0.5 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import {parsed.length > 0 ? `${parsed.length} rows` : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export function ManageEventCategoriesClient({
  eventId,
  themes,
  initial,
}: {
  eventId: number;
  themes: Theme[];
  initial: Category[];
}) {
  const [categories, setCategories] = useState(initial);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [questionsCategory, setQuestionsCategory] = useState<Category | null>(null);

  const base = `/api/organiser/events/${eventId}/categories`;

  const allSelected = categories.length > 0 && selected.size === categories.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(categories.map(c => c.id)));
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} categor${selected.size === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`${base}/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        const ids = selected;
        setCategories(cs => cs.filter(c => !ids.has(c.id)));
        setSelected(new Set());
      }
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(c: Category) {
    const res = await fetch(`${base}/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: c.name,
        theme_id: c.theme_id,
        display_order: c.display_order,
        is_active: !c.is_active,
        promo: c.promo,
      }),
    });
    const data = await res.json() as { category?: Category };
    if (data.category) setCategories(cs => cs.map(x => x.id === c.id ? data.category! : x));
  }

  async function del(c: Category) {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${base}/${c.id}`, { method: 'DELETE' });
    if (res.ok) setCategories(cs => cs.filter(x => x.id !== c.id));
  }

  function handleImported(count: number) {
    if (count > 0) {
      // Refresh the page to load newly inserted categories from DB
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {categories.length > 0 && (
            <button
              onClick={toggleSelectAll}
              title={allSelected ? 'Deselect all' : 'Select all'}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              {allSelected ? <CheckSquare className="h-4 w-4 text-gold" /> : someSelected ? <CheckSquare className="h-4 w-4 text-white/40" /> : <Square className="h-4 w-4" />}
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
          <p className="text-xs text-white/35">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            {selected.size > 0 && <span className="ml-1 text-gold/70">· {selected.size} selected</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Bulk delete */}
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:border-red-500/50 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete {selected.size}
            </button>
          )}
          {/* Export CSV */}
          <button
            onClick={() => exportCsv(categories)}
            disabled={categories.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/60 hover:border-gold/30 hover:text-white transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          {/* Import CSV */}
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/60 hover:border-gold/30 hover:text-white transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>

          {/* Add single */}
          <Link
            href={`/organiser/events/${eventId}/categories/new`}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Link>
        </div>
      </div>

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-sm text-white/30">No categories yet. Add one manually or import a CSV.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(c => (
            <div
              key={c.id}
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                selected.has(c.id)
                  ? 'border-gold/30 bg-gold/[0.04]'
                  : c.is_active
                  ? 'border-white/8 bg-white/[0.03]'
                  : 'border-white/5 bg-white/[0.015] opacity-50'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleSelect(c.id)}
                className="mt-0.5 flex-shrink-0 text-white/25 hover:text-gold transition-colors"
              >
                {selected.has(c.id)
                  ? <CheckSquare className="h-4 w-4 text-gold" />
                  : <Square className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-white">{c.name}</span>
                  {c.short_name && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40">
                      {c.short_name}
                    </span>
                  )}
                  {c.promo && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-400/80">
                      <Star className="h-2.5 w-2.5" /> Promo
                    </span>
                  )}
                  {c.theme_name && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-xs text-gold/80">
                      {c.theme_icon && <Icon name={c.theme_icon as IconName} className="h-3 w-3" />}
                      {c.theme_name}
                    </span>
                  )}
                  {!c.is_active && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/30">hidden</span>
                  )}
                  {c.entry_fee && Number(c.entry_fee) > 0 && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40">
                      £{Number(c.entry_fee).toFixed(2)}
                    </span>
                  )}
                </div>
                {(c.tagline || c.short_summary || c.description) && (
                  <p className="mt-0.5 text-sm text-white/40 line-clamp-1">
                    {c.tagline || c.short_summary || c.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setQuestionsCategory(c)}
                  title="Manage Questions"
                  className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-blue-400/30 hover:text-blue-400 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  title={c.is_active ? 'Hide' : 'Show'}
                  className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-gold/30 hover:text-gold transition-colors"
                >
                  {c.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <Link
                  href={`/organiser/events/${eventId}/categories/${c.id}/edit`}
                  title="Edit"
                  className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-gold/30 hover:text-gold transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => del(c)}
                  title="Delete"
                  className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-red-500/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Theme legend */}
      {themes.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.015] px-4 py-3">
          <p className="mb-2 text-xs font-medium text-white/30">Themes on this site</p>
          <div className="flex flex-wrap gap-2">
            {themes.map(t => (
              <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">
                <Icon name={t.icon as IconName} className="h-3 w-3 text-gold/50" />
                {t.name}
                {t.linked_site_id && <span className="text-gold/40"> → linked site</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          eventId={eventId}
          themes={themes}
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}

      {/* Category questions modal */}
      {questionsCategory && (
        <CategoryQuestionsModal
          category={questionsCategory}
          onClose={() => setQuestionsCategory(null)}
        />
      )}
    </div>
  );
}

/* ── Category Questions Modal ───────────────────────────────────────────── */

type LibraryQuestion = {
  id: number;
  question_text: string;
  question_type: string;
  field_type: string;
  options: string[] | null;
  source_category: string | null;
  is_active: boolean;
};

type QuestionLink = {
  link_id: number;
  id: number;
  question_text: string;
  field_type: string;
  options: string[] | null;
  display_order: number;
  is_required: boolean;
};

function CategoryQuestionsModal({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const [links, setLinks] = useState<QuestionLink[]>([]);
  const [library, setLibrary] = useState<LibraryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/organiser/category-questions?categoryId=${category.id}`).then(r => r.json()) as Promise<{ questions: QuestionLink[] }>,
      fetch('/api/organiser/question-library').then(r => r.json()) as Promise<{ questions: LibraryQuestion[] }>,
    ]).then(([linked, all]) => {
      setLinks(linked.questions ?? []);
      setLibrary(all.questions ?? []);
      setLoading(false);
    });
  }, [category.id]);

  const linkedIds = new Set(links.map(l => l.id));

  async function toggle(q: LibraryQuestion) {
    if (linkedIds.has(q.id)) {
      const link = links.find(l => l.id === q.id);
      if (!link) return;
      await fetch(`/api/organiser/category-questions/${link.link_id}`, { method: 'DELETE' });
      setLinks(ls => ls.filter(l => l.id !== q.id));
    } else {
      const res = await fetch('/api/organiser/category-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_category_id: category.id, question_library_id: q.id }),
      });
      const data = await res.json() as { link?: { id: number } };
      if (data.link) {
        setLinks(ls => [...ls, {
          link_id: data.link!.id,
          id: q.id,
          question_text: q.question_text,
          field_type: q.field_type,
          options: q.options,
          display_order: 0,
          is_required: true,
        }]);
      }
    }
  }

  // Exact match on source_category
  const suggested = library.filter(
    q => q.source_category?.toLowerCase() === category.name.toLowerCase()
  );
  const otherQuestions = library.filter(
    q => q.source_category?.toLowerCase() !== category.name.toLowerCase()
  );

  const filteredOthers = otherQuestions.filter(q => {
    if (!search.trim()) return true;
    const lower = search.toLowerCase();
    return q.question_text.toLowerCase().includes(lower) ||
      (q.source_category ?? '').toLowerCase().includes(lower);
  });

  async function addAllSuggested() {
    for (const q of suggested) {
      if (!linkedIds.has(q.id)) await toggle(q);
    }
  }

  const allSuggestedLinked = suggested.length > 0 && suggested.every(q => linkedIds.has(q.id));

  // When searching, show a single unified filtered list across all questions
  const isSearching = search.trim().length > 0;
  const searchLower = search.toLowerCase();
  const searchResults = isSearching
    ? library.filter(q =>
        q.question_text.toLowerCase().includes(searchLower) ||
        (q.source_category ?? '').toLowerCase().includes(searchLower)
      )
    : [];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate950 shadow-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="border-b border-white/8 px-6 py-4 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/30">Category Questions</p>
                <h3 className="font-display text-lg font-semibold text-white">{category.name}</h3>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 hover:border-white/25 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Search — always visible at top */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Question ya category name search karo, phir tick karo…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                autoFocus
              />
              {isSearching && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isSearching && (
              <p className="text-xs text-white/30">{searchResults.length} results — tick karo assign karne ke liye</p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/30">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isSearching ? (
            /* ── SEARCH MODE: unified filtered list ── */
            <div className="overflow-y-auto flex-1 p-4">
              {searchResults.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-12">Koi result nahi mila.</p>
              ) : (
                <div className="space-y-1.5">
                  {searchResults.map(q => (
                    <button
                      key={q.id}
                      onClick={() => toggle(q)}
                      className={`w-full flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        linkedIds.has(q.id)
                          ? 'border-gold/40 bg-gold/[0.08]'
                          : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${linkedIds.has(q.id) ? 'border-gold bg-gold text-ink' : 'border-white/20'}`}>
                        {linkedIds.has(q.id) && <Check className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/85">{q.question_text}</p>
                        {q.source_category && (
                          <p className="text-xs text-white/30 mt-0.5">{q.source_category}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── DEFAULT MODE: suggested + assigned + others ── */
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Suggested questions for this category */}
              {suggested.length > 0 && (
                <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gold/80">
                      ✦ Is Category Ke Questions ({suggested.length})
                    </p>
                    {!allSuggestedLinked && (
                      <button
                        onClick={addAllSuggested}
                        className="rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold text-ink shadow-gold-sm hover:opacity-90"
                      >
                        Add All
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {suggested.map((q, i) => (
                      <button
                        key={q.id}
                        onClick={() => toggle(q)}
                        className={`w-full flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          linkedIds.has(q.id)
                            ? 'border-gold/40 bg-gold/10'
                            : 'border-gold/10 bg-black/20 hover:border-gold/30'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${linkedIds.has(q.id) ? 'border-gold bg-gold text-ink' : 'border-white/30'}`}>
                          {linkedIds.has(q.id) && <Check className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white/30 mr-1.5">Q{i + 1}</span>
                          <span className="text-sm text-white/85">{q.question_text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Currently assigned (not in suggested) */}
              {links.filter(l => !suggested.some(s => s.id === l.id)).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Other Assigned Questions</p>
                  <div className="space-y-1.5">
                    {links.filter(l => !suggested.some(s => s.id === l.id)).map(l => (
                      <div key={l.link_id} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5">
                        <span className="text-xs font-bold text-white/25 mt-0.5">·</span>
                        <p className="flex-1 text-sm text-white/75">{l.question_text}</p>
                        <button onClick={() => toggle({ id: l.id, question_text: l.question_text, question_type: '', field_type: l.field_type, options: l.options, source_category: null, is_active: true })} className="text-white/25 hover:text-red-400 transition-colors shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other library questions */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">
                  Doosri Categories Ke Questions ({otherQuestions.length})
                </p>
                {library.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-6">
                    Library empty hai. Question Library page pe jaake Seed karo.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {otherQuestions.map(q => (
                      <button
                        key={q.id}
                        onClick={() => toggle(q)}
                        className={`w-full flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          linkedIds.has(q.id)
                            ? 'border-gold/30 bg-gold/[0.06]'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${linkedIds.has(q.id) ? 'border-gold bg-gold text-ink' : 'border-white/20'}`}>
                          {linkedIds.has(q.id) && <Check className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-white/75">{q.question_text}</p>
                          {q.source_category && (
                            <p className="text-xs text-white/30 mt-0.5">{q.source_category}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
