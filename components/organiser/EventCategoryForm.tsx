'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, AlertCircle } from 'lucide-react';

export interface CategoryFormValues {
  name: string;
  tagline: string;
  short_name: string;
  theme_id: number | '';
  short_summary: string;
  description: string;
  eligibility: string;
  judging_criteria: string;
  qualitative_criteria: string;
  metrics: string;
  additional_criteria: string;
  icon: string;
  entry_fee: string;
  display_order: string;
  is_active: boolean;
  promo: boolean;
}

interface Theme {
  id: number;
  name: string;
  icon?: string;
}

interface Props {
  eventId: number;
  categoryId?: number;
  initialValues?: Partial<CategoryFormValues>;
  themes: Theme[];
  backHref: string;
}

const EMPTY: CategoryFormValues = {
  name: '',
  tagline: '',
  short_name: '',
  theme_id: '',
  short_summary: '',
  description: '',
  eligibility: '',
  judging_criteria: '',
  qualitative_criteria: '',
  metrics: '',
  additional_criteria: '',
  icon: '',
  entry_fee: '0',
  display_order: '0',
  is_active: true,
  promo: false,
};

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';
const textareaCls = `${inputCls} resize-none`;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">
        {label}{required && <span className="ml-1 text-gold">*</span>}
      </span>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/25">{label}</span>
      <div className="flex-1 border-t border-white/8" />
    </div>
  );
}

export default function EventCategoryForm({ eventId, categoryId, initialValues, themes, backHref }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormValues>({ ...EMPTY, ...initialValues });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim() || null,
      short_name: form.short_name.trim() || null,
      theme_id: form.theme_id === '' ? null : Number(form.theme_id),
      short_summary: form.short_summary.trim() || null,
      description: form.description.trim() || null,
      eligibility: form.eligibility.trim() || null,
      judging_criteria: form.judging_criteria.trim() || null,
      qualitative_criteria: form.qualitative_criteria.trim() || null,
      metrics: form.metrics.trim() || null,
      additional_criteria: form.additional_criteria.trim() || null,
      icon: form.icon.trim() || null,
      entry_fee: parseFloat(form.entry_fee) || 0,
      display_order: parseInt(form.display_order) || 0,
      is_active: form.is_active,
      promo: form.promo,
    };

    const url = categoryId
      ? `/api/organiser/events/${eventId}/categories/${categoryId}`
      : `/api/organiser/events/${eventId}/categories`;
    const method = categoryId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to save. Please try again.');
      setSaving(false);
      return;
    }

    router.push(backHref);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl glass p-8 sm:p-10 space-y-6">

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Category Name" required>
          <input
            className={inputCls}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Business Growth Award"
            disabled={saving}
          />
        </Field>
        <Field label="Short Name">
          <input
            className={inputCls}
            value={form.short_name}
            onChange={e => set('short_name', e.target.value)}
            placeholder="Abbreviated name for compact displays"
            disabled={saving}
          />
        </Field>
      </div>

      <Field label="Default Tagline">
        <input
          className={inputCls}
          value={form.tagline}
          onChange={e => set('tagline', e.target.value)}
          placeholder="A short, punchy tagline for this category"
          disabled={saving}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Awards Excellence (Theme)">
          <select
            className={`${inputCls} bg-ink/80`}
            value={form.theme_id}
            onChange={e => set('theme_id', e.target.value === '' ? '' : Number(e.target.value))}
            disabled={saving}
          >
            <option value="">— No theme —</option>
            {themes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Icon">
          <input
            className={inputCls}
            value={form.icon}
            onChange={e => set('icon', e.target.value)}
            placeholder="e.g. Trophy, Star, Sparkles"
            disabled={saving}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Default Entry Fee (£)">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            value={form.entry_fee}
            onChange={e => set('entry_fee', e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Priority Order">
          <input
            type="number"
            min="0"
            className={inputCls}
            value={form.display_order}
            onChange={e => set('display_order', e.target.value)}
            disabled={saving}
          />
        </Field>
      </div>

      <div className="flex gap-6 flex-wrap">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-gold"
            checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            disabled={saving}
          />
          <span className="text-sm text-white/70">Active (visible to nominees)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-gold"
            checked={form.promo}
            onChange={e => set('promo', e.target.checked)}
            disabled={saving}
          />
          <span className="text-sm text-white/70">Promo (featured / promoted)</span>
        </label>
      </div>

      <Divider label="Content" />

      <Field label="Short Summary">
        <textarea
          className={textareaCls}
          rows={3}
          value={form.short_summary}
          onChange={e => set('short_summary', e.target.value)}
          placeholder="Brief summary shown in listings and cards"
          disabled={saving}
        />
      </Field>

      <Field label="Description / Overview">
        <textarea
          className={textareaCls}
          rows={5}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Full description of this award category"
          disabled={saving}
        />
      </Field>

      <Divider label="Evaluation Criteria" />

      <Field label="Eligibility">
        <textarea
          className={textareaCls}
          rows={4}
          value={form.eligibility}
          onChange={e => set('eligibility', e.target.value)}
          placeholder="Who is eligible to enter this category?"
          disabled={saving}
        />
      </Field>

      <Field label="Judging Criteria">
        <textarea
          className={textareaCls}
          rows={4}
          value={form.judging_criteria}
          onChange={e => set('judging_criteria', e.target.value)}
          placeholder="How will entries be judged?"
          disabled={saving}
        />
      </Field>

      <Field label="Qualitative Criteria">
        <textarea
          className={textareaCls}
          rows={4}
          value={form.qualitative_criteria}
          onChange={e => set('qualitative_criteria', e.target.value)}
          placeholder="Qualitative factors considered by judges"
          disabled={saving}
        />
      </Field>

      <Field label="Metrics">
        <textarea
          className={textareaCls}
          rows={4}
          value={form.metrics}
          onChange={e => set('metrics', e.target.value)}
          placeholder="Quantitative metrics and KPIs to include"
          disabled={saving}
        />
      </Field>

      <Field label="Additional Criteria">
        <textarea
          className={textareaCls}
          rows={4}
          value={form.additional_criteria}
          onChange={e => set('additional_criteria', e.target.value)}
          placeholder="Any other criteria or notes for entrants"
          disabled={saving}
        />
      </Field>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-4 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : categoryId ? 'Update Category' : 'Create Category'}
      </button>

      <p className="text-center text-xs text-white/35">
        You can edit this category at any time from the event&apos;s categories tab.
      </p>
    </form>
  );
}
