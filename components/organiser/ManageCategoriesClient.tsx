'use client';

import { useState } from 'react';
import { RefreshCw, Loader2, CheckCircle2, BarChart2, Users, FileText, ToggleLeft, ToggleRight } from 'lucide-react';

type Category = {
  id: number;
  category_id: string;
  category_name: string;
  include_in_eligibility: boolean;
  nominations_count: number;
  applications_count: number;
  judges_count: number;
  include_in_graph: boolean;
  applicant_level_judging: boolean;
  excluded_in_stats: boolean;
};

function Toggle({
  value,
  onChange,
  label,
  colour = 'gold',
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  colour?: 'gold' | 'green' | 'red';
}) {
  const colours = {
    gold:  value ? 'text-gold'       : 'text-white/30',
    green: value ? 'text-green-400'  : 'text-white/30',
    red:   value ? 'text-red-400'    : 'text-white/30',
  };
  const Icon = value ? ToggleRight : ToggleLeft;
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${colours[colour]}`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function CategoryRow({ cat, onUpdate }: {
  cat: Category;
  onUpdate: (id: number, patch: Partial<Category>) => Promise<void>;
}) {
  const [data, setData]   = useState(cat);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(key: keyof Category) {
    const next = { ...data, [key]: !data[key as keyof Category] };
    setData(next as Category);
    setSaving(key);
    await onUpdate(cat.id, { [key]: (next as Record<string, unknown>)[key] });
    setSaving(null);
  }

  const flagBorder = data.excluded_in_stats ? 'border-l-2 border-red-500/50' :
                     data.applicant_level_judging ? 'border-l-2 border-gold/40' : '';

  return (
    <div className={`rounded-2xl glass overflow-hidden ${flagBorder}`}>
      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-white">{data.category_name}</h3>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
        </div>

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {data.nominations_count} nominations</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {data.applications_count} applications</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {data.judges_count} judges</span>
        </div>

        {/* Toggles */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          <Toggle
            value={data.include_in_eligibility}
            onChange={() => toggle('include_in_eligibility')}
            label="Include in eligibility"
            colour="green"
          />
          <Toggle
            value={data.include_in_graph}
            onChange={() => toggle('include_in_graph')}
            label="Include in graph"
            colour="gold"
          />
          <Toggle
            value={data.applicant_level_judging}
            onChange={() => toggle('applicant_level_judging')}
            label="Applicant level judging"
            colour="gold"
          />
          <Toggle
            value={data.excluded_in_stats}
            onChange={() => toggle('excluded_in_stats')}
            label="Excluded in stats"
            colour="red"
          />
        </div>
      </div>
    </div>
  );
}

export function ManageCategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [syncing, setSyncing]       = useState(false);
  const [syncMsg, setSyncMsg]       = useState('');

  async function sync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res  = await fetch('/api/organiser/award-categories', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        setSyncMsg(`Synced ${data.synced} categories.`);
      }
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 3000);
    }
  }

  async function updateCategory(id: number, patch: Partial<Category>) {
    await fetch(`/api/organiser/award-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  return (
    <div>
      {/* Sync bar */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={sync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? 'Syncing…' : 'Sync from Nominations'}
        </button>
        {syncMsg && <span className="text-sm text-green-300">{syncMsg}</span>}
        <span className="ml-auto text-xs text-white/35">{categories.length} categories</span>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1"><ToggleRight className="h-4 w-4 text-gold" /> enabled</span>
        <span className="flex items-center gap-1"><ToggleLeft className="h-4 w-4 text-white/30" /> disabled</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-0.5 bg-red-500/70" /> excluded from stats</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-0.5 bg-gold/60" /> applicant level judging on</span>
      </div>

      <div className="mt-4 space-y-3">
        {categories.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/35">
            No categories yet. Click <strong className="text-white/60">Sync from Nominations</strong> to populate.
          </p>
        ) : (
          categories.map((c) => <CategoryRow key={c.id} cat={c} onUpdate={updateCategory} />)
        )}
      </div>
    </div>
  );
}
