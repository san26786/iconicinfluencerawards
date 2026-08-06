'use client';

import { useState } from 'react';
import { Plus, Pencil, Save, X, Trash2, Eye, EyeOff, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Question = {
  id: number;
  event_id: number;
  question_type: string;
  question_text: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
};

type FormValues = {
  question_type: string;
  question_text: string;
  field_type: string;
  options_raw: string;
  is_required: boolean;
  display_order: string;
};

const empty = (type: string): FormValues => ({
  question_type: type,
  question_text: '',
  field_type: 'yes_no',
  options_raw: '',
  is_required: true,
  display_order: '0',
});

function qToForm(q: Question): FormValues {
  return {
    question_type: q.question_type,
    question_text: q.question_text,
    field_type: q.field_type,
    options_raw: (q.options ?? []).join(', '),
    is_required: q.is_required,
    display_order: String(q.display_order),
  };
}

const FIELD_LABELS: Record<string, string> = {
  yes_no: 'Yes / No',
  text: 'Free Text',
  number: 'Number',
  select: 'Multiple Choice',
};

type LibraryQuestion = {
  id: number;
  question_text: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
};

export function ManageEventQuestionsClient({
  eventId,
  initial,
  libraryQuestions = [],
}: {
  eventId: number;
  initial: Question[];
  libraryQuestions?: LibraryQuestion[];
}) {
  const [questions, setQuestions] = useState(initial);
  const [activeTab, setActiveTab] = useState<'eligibility' | 'application'>('eligibility');
  const [form, setForm] = useState<FormValues>(empty('eligibility'));
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const base = `/api/organiser/events/${eventId}/questions`;
  const visible = questions.filter(q => q.question_type === activeTab);

  function openAdd() { setEditId(null); setForm(empty(activeTab)); setError(''); }
  function openEdit(q: Question) { setEditId(q.id); setForm(qToForm(q)); setError(''); }
  function cancelEdit() { setEditId(null); setForm(empty(activeTab)); setError(''); }

  async function save() {
    if (!form.question_text.trim()) { setError('Question text is required.'); return; }
    setSaving(true); setError('');
    try {
      const options = form.field_type === 'select'
        ? form.options_raw.split(',').map(s => s.trim()).filter(Boolean)
        : null;

      const body = {
        question_type: form.question_type,
        question_text: form.question_text.trim(),
        field_type: form.field_type,
        options,
        is_required: form.is_required,
        display_order: Number(form.display_order) || 0,
      };

      const res = await fetch(
        editId ? `${base}/${editId}` : base,
        { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      const data = await res.json() as { question?: Question; error?: string };
      if (!res.ok) { setError(data.error ?? 'Save failed.'); return; }

      if (editId) {
        setQuestions(qs => qs.map(q => q.id === editId ? data.question! : q));
      } else {
        setQuestions(qs => [...qs, data.question!]);
      }
      cancelEdit();
    } finally { setSaving(false); }
  }

  async function toggleActive(q: Question) {
    const res = await fetch(`${base}/${q.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !q.is_active }),
    });
    const data = await res.json() as { question?: Question };
    if (data.question) setQuestions(qs => qs.map(x => x.id === q.id ? data.question! : x));
  }

  async function del(q: Question) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    await fetch(`${base}/${q.id}`, { method: 'DELETE' });
    setQuestions(qs => qs.filter(x => x.id !== q.id));
  }

  return (
    <div className="space-y-6">
      {/* Library eligibility questions (from Question Library) */}
      {libraryQuestions.length > 0 && (
        <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold/70" />
              <p className="text-sm font-semibold text-gold/90">
                Question Library se Eligibility Questions ({libraryQuestions.length})
              </p>
            </div>
            <Link
              href="/organiser/question-library"
              className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-gold transition-colors"
            >
              Manage <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {libraryQuestions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 rounded-xl border border-gold/10 bg-black/20 px-4 py-3">
                <span className="text-xs font-bold text-white/25 mt-0.5">Q{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{q.question_text}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {FIELD_LABELS[q.field_type] ?? q.field_type}
                    {q.options && q.options.length > 0 && ` — ${q.options.slice(0, 3).join(', ')}${q.options.length > 3 ? ` +${q.options.length - 3}` : ''}`}
                    {q.is_required && <span className="ml-2 text-red-400/60">required</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30">
            Ye questions application form mein automatically show honge. Change karne ke liye Question Library jaao.
          </p>
        </div>
      )}

      {/* Sub-tabs: Eligibility / Application */}
      <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1 w-fit">
        {(['eligibility', 'application'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); cancelEdit(); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
              activeTab === t
                ? 'bg-gold-gradient text-ink shadow-gold-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {t} Questions
          </button>
        ))}
      </div>

      {/* Question list */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <p className="text-sm text-white/30">
            No {activeTab} questions yet. Add one below.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((q, i) => (
            <div
              key={q.id}
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                q.is_active ? 'border-white/8 bg-white/[0.03]' : 'border-white/5 bg-white/[0.015] opacity-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white/25">Q{i + 1}</span>
                  <span className="font-medium text-white/90">{q.question_text}</span>
                  {q.is_required && (
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400/80">required</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/35">
                  <span>{FIELD_LABELS[q.field_type] ?? q.field_type}</span>
                  {q.options && q.options.length > 0 && (
                    <span>— {q.options.join(', ')}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => toggleActive(q)}
                  title={q.is_active ? 'Hide' : 'Show'}
                  className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-gold/30 hover:text-gold transition-colors"
                >
                  {q.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => openEdit(q)}
                  className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-gold/30 hover:text-gold transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => del(q)}
                  className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-red-500/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-white">
            {editId ? 'Edit Question' : `Add ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Question`}
          </h3>
          {editId && (
            <button onClick={cancelEdit} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Question *</label>
            <textarea
              value={form.question_text}
              onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
              rows={2}
              placeholder={
                activeTab === 'eligibility'
                  ? 'e.g. Is your business based in London?'
                  : 'e.g. Describe your biggest achievement in the past year.'
              }
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Answer Type</label>
              <select
                value={form.field_type}
                onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-ink/80 px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none"
              >
                <option value="yes_no">Yes / No</option>
                <option value="text">Free Text</option>
                <option value="number">Number</option>
                <option value="select">Multiple Choice</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none"
              />
            </div>
          </div>

          {form.field_type === 'select' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">
                Options <span className="text-white/25">(comma-separated)</span>
              </label>
              <input
                value={form.options_raw}
                onChange={e => setForm(f => ({ ...f, options_raw: e.target.value }))}
                placeholder="Option A, Option B, Option C"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="q-required"
              type="checkbox"
              checked={form.is_required}
              onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
              className="rounded border-white/20 bg-white/5 text-gold focus:ring-gold/40"
            />
            <label htmlFor="q-required" className="text-sm text-white/60">Required</label>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : editId ? 'Update' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
