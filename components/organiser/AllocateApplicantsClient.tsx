'use client';

import { useState } from 'react';
import { Plus, X, Loader2, ChevronDown, ChevronUp, Star } from 'lucide-react';

type JudgeInfo = { judge_id: number; judge_name: string; judge_email: string; allocation_id: number };
type Nomination = {
  nomination_id: number;
  nominee_name: string;
  nominee_email: string | null;
  business_name: string | null;
  award_categories: string[] | null;
  avg_score: number | null;
  judges: JudgeInfo[];
};
type CategoryJudge = { id: number; name: string; email: string };

function NomRow({
  nom,
  categoryJudges,
  onAdd,
  onRemove,
}: {
  nom: Nomination;
  categoryJudges: CategoryJudge[];
  onAdd: (nominationId: number, judgeId: number) => Promise<void>;
  onRemove: (nominationId: number, judgeId: number) => Promise<void>;
}) {
  const [open, setOpen]         = useState(false);
  const [judges, setJudges]     = useState<JudgeInfo[]>(nom.judges);
  const [adding, setAdding]     = useState(false);
  const [selected, setSelected] = useState('');
  const [busy, setBusy]         = useState(false);

  const assignedIds = new Set(judges.map((j) => j.judge_id));
  const unassigned  = categoryJudges.filter((j) => !assignedIds.has(j.id));

  async function add() {
    if (!selected) return;
    const judgeId = Number(selected);
    const judge   = categoryJudges.find((j) => j.id === judgeId);
    if (!judge) return;
    setBusy(true);
    await onAdd(nom.nomination_id, judgeId);
    setJudges((prev) => [...prev, { judge_id: judgeId, judge_name: judge.name, judge_email: judge.email, allocation_id: Date.now() }]);
    setSelected('');
    setAdding(false);
    setBusy(false);
  }

  async function remove(judgeId: number) {
    setBusy(true);
    await onRemove(nom.nomination_id, judgeId);
    setJudges((prev) => prev.filter((j) => j.judge_id !== judgeId));
    setBusy(false);
  }

  return (
    <div className="rounded-2xl glass overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{nom.nominee_name}</p>
          {nom.business_name && <p className="text-sm text-white/50">{nom.business_name}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {nom.avg_score != null && (
            <span className="flex items-center gap-1 text-xs font-bold text-gold">
              <Star className="h-3 w-3" /> {Number(nom.avg_score).toFixed(1)}
            </span>
          )}
          <span className="text-xs text-white/40">{judges.length} judge{judges.length !== 1 ? 's' : ''}</span>
          {open ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-3">
          {judges.length === 0 ? (
            <p className="text-xs text-white/35">No judges allocated yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {judges.map((j) => (
                <div key={j.judge_id} className="flex items-center gap-2 rounded-full glass px-3 py-1.5">
                  <span className="text-sm text-white/80">{j.judge_name}</span>
                  <button type="button" onClick={() => remove(j.judge_id)} disabled={busy}
                    className="text-white/40 hover:text-red-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {adding ? (
            <div className="flex items-center gap-2">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none"
              >
                <option value="">Select judge…</option>
                {unassigned.map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
              <button onClick={add} disabled={!selected || busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add
              </button>
              <button onClick={() => setAdding(false)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} disabled={categoryJudges.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white disabled:opacity-40">
              <Plus className="h-3.5 w-3.5" /> Assign judge
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AllocateApplicantsClient({
  nominations,
  categories,
  judgesByCategory,
}: {
  nominations: Nomination[];
  categories: { category_id: string; category_name: string }[];
  judgesByCategory: Record<string, CategoryJudge[]>;
}) {
  const [filterCat, setFilterCat] = useState('');

  const visible = filterCat
    ? nominations.filter((n) => n.award_categories?.includes(filterCat))
    : nominations;

  const currentJudges: CategoryJudge[] = filterCat
    ? (judgesByCategory[filterCat] ?? [])
    : Object.values(judgesByCategory).flat().filter((j, i, arr) => arr.findIndex((x) => x.id === j.id) === i);

  async function handleAdd(nominationId: number, judgeId: number) {
    await fetch('/api/organiser/judge-applicants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId, nominationId }),
    });
  }

  async function handleRemove(nominationId: number, judgeId: number) {
    await fetch('/api/organiser/judge-applicants', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId, nominationId }),
    });
  }

  return (
    <div>
      {/* Category filter */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none"
        >
          <option value="">All categories ({nominations.length})</option>
          {categories.map((c) => {
            const count = nominations.filter((n) => n.award_categories?.includes(c.category_id)).length;
            return <option key={c.category_id} value={c.category_id}>{c.category_name} ({count})</option>;
          })}
        </select>
        {filterCat && (
          <span className="text-xs text-white/40">
            {currentJudges.length} judge{currentJudges.length !== 1 ? 's' : ''} assigned to this category
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/35">No nominations found.</p>
        ) : (
          visible.map((n) => (
            <NomRow
              key={n.nomination_id}
              nom={n}
              categoryJudges={currentJudges}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>
    </div>
  );
}
