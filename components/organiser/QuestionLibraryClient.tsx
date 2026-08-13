'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Save, X, Trash2, Eye, EyeOff, Search, BookOpen, Zap, Check, ChevronDown } from 'lucide-react';

type LibraryQuestion = {
  id: number;
  question_text: string;
  question_type: 'eligibility' | 'category_specific' | 'application';
  field_type: string;
  options: string[] | null;
  source_category: string | null;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
};

type EventOption = { id: number; title: string; status: string };

type EventLink = { link_id: number; question_library_id: number; display_order: number; is_required: boolean };

type FormValues = {
  question_text: string;
  question_type: string;
  field_type: string;
  options_raw: string;
  is_required: boolean;
  display_order: string;
};

const FIELD_LABELS: Record<string, string> = {
  yes_no: 'Yes / No',
  text: 'Short Text',
  paragraph: 'Paragraph',
  number: 'Number',
  select: 'Multiple Choice',
  multi_select: 'Multi-Select',
};

const empty = (): FormValues => ({
  question_text: '',
  question_type: 'eligibility',
  field_type: 'select',
  options_raw: '',
  is_required: true,
  display_order: '0',
});

function qToForm(q: LibraryQuestion): FormValues {
  return {
    question_text: q.question_text,
    question_type: q.question_type,
    field_type: q.field_type,
    options_raw: (q.options ?? []).join('\n'),
    is_required: q.is_required,
    display_order: String(q.display_order),
  };
}

export function QuestionLibraryClient({
  initialQuestions,
  events,
  siteId,
}: {
  initialQuestions: LibraryQuestion[];
  events: EventOption[];
  siteId: number;
}) {
  const [questions, setQuestions] = useState<LibraryQuestion[]>(initialQuestions);
  const [activeTab, setActiveTab] = useState<'eligibility' | 'manage'>('eligibility');

  // Eligibility tab state
  const [selectedEventId, setSelectedEventId] = useState<number | null>(events[0]?.id ?? null);
  const [eventLinks, setEventLinks] = useState<EventLink[]>([]);
  const [linksLoaded, setLinksLoaded] = useState(false);
  const [linksLoading, setLinksLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Manage tab state
  const [form, setForm] = useState<FormValues>(empty());
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [error, setError] = useState('');
  const [manageSearch, setManageSearch] = useState('');
  const [manageType, setManageType] = useState<'eligibility' | 'category_specific' | 'application'>('eligibility');

  async function loadLinks(eventId: number) {
    setLinksLoading(true);
    const res = await fetch(`/api/organiser/event-library-questions?eventId=${eventId}`);
    const data = await res.json() as { links: EventLink[] };
    setEventLinks(data.links ?? []);
    setLinksLoaded(true);
    setLinksLoading(false);
  }

  function selectEvent(id: number) {
    setSelectedEventId(id);
    setLinksLoaded(false);
    setEventLinks([]);
    loadLinks(id);
  }

  // Auto-load when component mounts if event exists
  useState(() => {
    if (events[0]) loadLinks(events[0].id);
  });

  const linkedIds = new Set(eventLinks.map(l => l.question_library_id));

  async function toggleEligibility(q: LibraryQuestion) {
    if (!selectedEventId) return;
    if (linkedIds.has(q.id)) {
      const link = eventLinks.find(l => l.question_library_id === q.id);
      if (!link) return;
      await fetch(`/api/organiser/event-library-questions?linkId=${link.link_id}`, { method: 'DELETE' });
      setEventLinks(ls => ls.filter(l => l.question_library_id !== q.id));
    } else {
      const res = await fetch('/api/organiser/event-library-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: selectedEventId, question_library_id: q.id }),
      });
      const data = await res.json() as { link?: EventLink };
      if (data.link) setEventLinks(ls => [...ls, data.link!]);
    }
  }

  const eligibilityQuestions = useMemo(
    () => questions.filter(q => q.question_type === 'eligibility'),
    [questions],
  );

  const filteredEligibility = useMemo(() => {
    if (!search.trim()) return eligibilityQuestions;
    const lower = search.toLowerCase();
    return eligibilityQuestions.filter(q => q.question_text.toLowerCase().includes(lower));
  }, [eligibilityQuestions, search]);

  const selectedCount = eligibilityQuestions.filter(q => linkedIds.has(q.id)).length;

  // Manage tab
  const manageQuestions = useMemo(() => {
    const qs = questions.filter(q => q.question_type === manageType);
    if (!manageSearch.trim()) return qs;
    return qs.filter(q => q.question_text.toLowerCase().includes(manageSearch.toLowerCase()));
  }, [questions, manageType, manageSearch]);

  function openAdd() { setEditId(null); setForm(empty()); setError(''); }
  function openEdit(q: LibraryQuestion) { setEditId(q.id); setForm(qToForm(q)); setError(''); }
  function cancelEdit() { setEditId(null); setForm(empty()); setError(''); }

  async function save() {
    if (!form.question_text.trim()) { setError('Question text is required.'); return; }
    setSaving(true); setError('');
    try {
      const options = ['select', 'multi_select'].includes(form.field_type)
        ? form.options_raw.split('\n').map(s => s.trim()).filter(Boolean)
        : null;
      const body = {
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        field_type: form.field_type,
        options,
        is_required: form.is_required,
        display_order: Number(form.display_order) || 0,
      };
      const url = editId ? `/api/organiser/question-library/${editId}` : '/api/organiser/question-library';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json() as { question?: LibraryQuestion; error?: string };
      if (!res.ok) { setError(data.error ?? 'Save failed.'); return; }
      if (editId) {
        setQuestions(qs => qs.map(q => q.id === editId ? data.question! : q));
      } else {
        setQuestions(qs => [...qs, data.question!]);
      }
      cancelEdit();
    } finally { setSaving(false); }
  }

  async function toggleActive(q: LibraryQuestion) {
    const res = await fetch(`/api/organiser/question-library/${q.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !q.is_active }),
    });
    const data = await res.json() as { question?: LibraryQuestion };
    if (data.question) setQuestions(qs => qs.map(x => x.id === q.id ? data.question! : x));
  }

  async function del(q: LibraryQuestion) {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/organiser/question-library/${q.id}`, { method: 'DELETE' });
    setQuestions(qs => qs.filter(x => x.id !== q.id));
  }

  async function seed() {
    if (!confirm('Seed the library with the Iconic Influencer Awards question set and auto-assign the eligibility questions to the featured event?')) return;
    setSeeding(true); setSeedMsg('');
    try {
      const res = await fetch('/api/organiser/seed-property-questions', { method: 'POST' });
      const data = await res.json() as { ok?: boolean; inserted?: number; skipped?: number; linked?: number; linkedTo?: string };
      if (data.ok) {
        const linkedMsg = data.linkedTo ? ` · ${data.linked} linked to "${data.linkedTo}"` : '';
        setSeedMsg(`Done: ${data.inserted} new, ${data.skipped} already existed${linkedMsg}.`);
        const fresh = await fetch('/api/organiser/question-library');
        const fd = await fresh.json() as { questions?: LibraryQuestion[] };
        if (fd.questions) setQuestions(fd.questions);
      }
    } finally { setSeeding(false); }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1 w-fit">
        <button
          onClick={() => setActiveTab('eligibility')}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${activeTab === 'eligibility' ? 'bg-gold-gradient text-ink shadow-gold-sm' : 'text-white/50 hover:text-white'}`}
        >
          Eligibility Questions
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${activeTab === 'manage' ? 'bg-gold-gradient text-ink shadow-gold-sm' : 'text-white/50 hover:text-white'}`}
        >
          Manage Library
        </button>
      </div>

      {/* ── ELIGIBILITY TAB ── */}
      {activeTab === 'eligibility' && (
        <div className="space-y-5">
          <p className="text-sm text-white/50">
            Event select karo, phir eligibility questions choose karo jo us event ke application form me dikhenge.
          </p>

          {/* Event selector */}
          {events.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">
              Koi event nahi mila. Pehle ek event banao.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">Event Select Karo</label>
                <div className="relative">
                  <select
                    value={selectedEventId ?? ''}
                    onChange={e => selectEvent(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-white/15 bg-ink/80 px-4 py-3 pr-10 text-sm text-white focus:border-gold/50 focus:outline-none"
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title} ({ev.status})</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                </div>
              </div>

              {/* Status bar */}
              {selectedEventId && (
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>{selectedCount} of {eligibilityQuestions.length} questions selected for this event</span>
                  {linksLoading && <span className="text-gold/60">Loading…</span>}
                </div>
              )}
            </div>
          )}

          {/* Eligibility questions list */}
          {selectedEventId && eligibilityQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center space-y-3">
              <BookOpen className="mx-auto h-6 w-6 text-white/15" />
              <p className="text-sm text-white/30">Library mein koi eligibility question nahi.</p>
              <button
                onClick={seed}
                disabled={seeding}
                className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-sm font-bold text-ink shadow-gold disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5" />
                {seeding ? 'Seeding…' : 'Seed Library'}
              </button>
            </div>
          ) : selectedEventId ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Questions search karo…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                {filteredEligibility.map((q, i) => {
                  const selected = linkedIds.has(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggleEligibility(q)}
                      className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                        selected
                          ? 'border-gold/30 bg-gold/[0.06]'
                          : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${selected ? 'border-gold bg-gold text-ink' : 'border-white/20 bg-transparent'}`}>
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white/25">Q{i + 1}</span>
                          <p className="text-sm font-medium text-white/85">{q.question_text}</p>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/35">
                          <span>{FIELD_LABELS[q.field_type] ?? q.field_type}</span>
                          {q.options && q.options.length > 0 && (
                            <span>— {q.options.slice(0, 3).join(', ')}{q.options.length > 3 ? ` +${q.options.length - 3}` : ''}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── MANAGE LIBRARY TAB ── */}
      {activeTab === 'manage' && (
        <div className="space-y-5">
          {/* Seed button */}
          <div className="flex items-center justify-between rounded-2xl border border-gold/20 bg-gold/5 p-4">
            <div>
              <p className="text-sm font-semibold text-gold">Iconic Influencer Questions Seed Karo</p>
              <p className="text-xs text-white/40 mt-0.5">
                10 eligibility + 4 category-specific questions per award category add honge.
                Eligibility questions featured event me auto-assign honge.
              </p>
              {seedMsg && <p className="mt-1 text-xs text-green-400">{seedMsg}</p>}
            </div>
            <button
              onClick={seed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-sm font-bold text-ink shadow-gold hover:opacity-90 disabled:opacity-50 shrink-0 ml-4"
            >
              <Zap className="h-3.5 w-3.5" />
              {seeding ? 'Seeding…' : 'Seed Library'}
            </button>
          </div>

          {/* Type tabs */}
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
            {(['eligibility', 'category_specific', 'application'] as const).map(t => (
              <button
                key={t}
                onClick={() => setManageType(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${manageType === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
              >
                {t === 'category_specific' ? 'Category' : t}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <input
                value={manageSearch}
                onChange={e => setManageSearch(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
              />
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/60 hover:border-gold/40 hover:text-gold transition-colors ml-3"
            >
              <Plus className="h-3.5 w-3.5" /> Add Question
            </button>
          </div>

          <p className="text-xs text-white/30">{manageQuestions.length} questions</p>

          {manageQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm text-white/30">Koi question nahi. Seed karo ya manually add karo.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {manageQuestions.map((q, i) => (
                <div
                  key={q.id}
                  className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
                    q.is_active ? 'border-white/8 bg-white/[0.03]' : 'border-white/5 bg-white/[0.015] opacity-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white/25">Q{i + 1}</span>
                      <span className="text-sm text-white/85">{q.question_text}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/35">
                      <span>{FIELD_LABELS[q.field_type] ?? q.field_type}</span>
                      {q.source_category && <span>· {q.source_category}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleActive(q)} className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-gold/30 hover:text-gold transition-colors">
                      {q.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => openEdit(q)} className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-gold/30 hover:text-gold transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => del(q)} className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/40 hover:border-red-500/30 hover:text-red-400 transition-colors">
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
              <h3 className="font-display text-sm font-semibold text-white">{editId ? 'Edit Question' : 'Add Question'}</h3>
              {editId && <button onClick={cancelEdit} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/50">Question Text *</label>
                <textarea
                  value={form.question_text}
                  onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Type</label>
                  <select value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-ink/80 px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none">
                    <option value="eligibility">Eligibility</option>
                    <option value="category_specific">Category-Specific</option>
                    <option value="application">Application</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Answer Type</label>
                  <select value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-ink/80 px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none">
                    <option value="yes_no">Yes / No</option>
                    <option value="text">Short Text</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="select">Multiple Choice</option>
                    <option value="multi_select">Multi-Select</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Order</label>
                  <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none" />
                </div>
              </div>
              {['select', 'multi_select'].includes(form.field_type) && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Options <span className="text-white/25">(ek per line)</span></label>
                  <textarea value={form.options_raw} onChange={e => setForm(f => ({ ...f, options_raw: e.target.value }))} rows={4} placeholder={"Option A\nOption B\nOption C"} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input id="lib-req" type="checkbox" checked={form.is_required} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))} className="rounded border-white/20 bg-white/5 text-gold" />
                <label htmlFor="lib-req" className="text-sm text-white/60">Required</label>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink shadow-gold disabled:opacity-50">
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving…' : editId ? 'Update' : 'Add'}
              </button>
              {editId && <button onClick={cancelEdit} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/40 hover:text-white">Cancel</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
