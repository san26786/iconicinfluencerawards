'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Save, AlertCircle, Star, Globe } from 'lucide-react';

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">
        {label}{required && <span className="ml-1 text-gold">*</span>}
      </span>
      {children}
      {hint && <p className="text-xs text-white/30">{hint}</p>}
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

export type EventData = {
  id?: number;
  title: string;
  description: string;
  event_date: string;
  event_date_label: string;
  venue: string;
  venue_address: string;
  ticket_url: string;
  is_featured: boolean;
  is_public: boolean;
  status: string;
  pre_launch_date: string;
  nomination_opens: string;
  nomination_closes: string;
  application_deadline: string;
  judging_start: string;
  judging_end: string;
  winners_announced: string;
};

export function EventForm({ initial }: { initial?: Partial<EventData> }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'saving') return;
    setStatus('saving');
    setError('');

    const fd = new FormData(e.currentTarget);
    const payload = {
      title:                String(fd.get('title')                ?? '').trim(),
      description:          String(fd.get('description')          ?? '').trim(),
      event_date:           String(fd.get('event_date')           ?? '').trim() || null,
      event_date_label:     String(fd.get('event_date_label')     ?? '').trim(),
      venue:                String(fd.get('venue')                ?? '').trim(),
      venue_address:        String(fd.get('venue_address')        ?? '').trim(),
      ticket_url:           String(fd.get('ticket_url')           ?? '').trim(),
      is_featured:          fd.get('is_featured') === 'on',
      is_public:            fd.get('is_public') === 'on',
      status:               String(fd.get('status') ?? 'upcoming'),
      pre_launch_date:      String(fd.get('pre_launch_date')      ?? '').trim() || null,
      nomination_opens:     String(fd.get('nomination_opens')     ?? '').trim() || null,
      nomination_closes:    String(fd.get('nomination_closes')    ?? '').trim() || null,
      application_deadline: String(fd.get('application_deadline') ?? '').trim() || null,
      judging_start:        String(fd.get('judging_start')        ?? '').trim() || null,
      judging_end:          String(fd.get('judging_end')          ?? '').trim() || null,
      winners_announced:    String(fd.get('winners_announced')    ?? '').trim() || null,
    };

    try {
      const url    = isEdit ? `/api/organiser/events/${initial!.id}` : '/api/organiser/events';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setStatus('saved');
      setTimeout(() => router.push('/organiser/events'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  if (status === 'saved') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl glass-gold p-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
          <CheckCircle2 className="h-8 w-8 text-ink" />
        </span>
        <h3 className="mt-6 font-display text-2xl font-semibold text-white">
          {isEdit ? 'Event Updated' : 'Event Created'}
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
          {isEdit ? 'Your changes have been saved.' : 'The new event has been added.'} Redirecting…
        </p>
      </div>
    );
  }

  const saving = status === 'saving';

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl glass p-8 sm:p-10 space-y-6">

      {/* Event Title */}
      <Field label="Event Title" required>
        <input
          name="title"
          type="text"
          required
          defaultValue={initial?.title ?? ''}
          placeholder="e.g. Iconic Influencer Awards 2027"
          className={inputBase}
          disabled={saving}
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          name="description"
          rows={5}
          defaultValue={initial?.description ?? ''}
          placeholder="Describe this event — highlights, schedule, what attendees can expect…"
          className={`${inputBase} resize-none`}
          disabled={saving}
        />
      </Field>

      <Divider label="Date & Time" />

      {/* Date row */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date & Time" hint="Used for calendar and countdown displays">
          <input
            name="event_date"
            type="datetime-local"
            defaultValue={
              initial?.event_date
                ? new Date(initial.event_date).toISOString().slice(0, 16)
                : ''
            }
            className={inputBase}
            disabled={saving}
          />
        </Field>
        <Field label="Display Date Label" hint={'Shown publicly, e.g. "1 November 2026, 7pm"'}>
          <input
            name="event_date_label"
            type="text"
            defaultValue={initial?.event_date_label ?? ''}
            placeholder="e.g. 1 November 2026, 7pm"
            className={inputBase}
            disabled={saving}
          />
        </Field>
      </div>

      <Divider label="Award Timeline" />

      {/* Pre-launch date */}
      <Field label="Pre-Launch Date" hint="When the event is announced to the public ahead of nominations opening">
        <input
          name="pre_launch_date"
          type="date"
          defaultValue={initial?.pre_launch_date?.slice(0, 10) ?? ''}
          className="w-full sm:w-60 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40"
          disabled={saving}
        />
      </Field>

      {/* Nomination period */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nominations Open" hint="When applicants can start nominating">
          <input
            name="nomination_opens"
            type="date"
            defaultValue={initial?.nomination_opens?.slice(0, 10) ?? ''}
            className={inputBase}
            disabled={saving}
          />
        </Field>
        <Field label="Nominations Close" hint="Deadline for submitting nominations">
          <input
            name="nomination_closes"
            type="date"
            defaultValue={initial?.nomination_closes?.slice(0, 10) ?? ''}
            className={inputBase}
            disabled={saving}
          />
        </Field>
      </div>

      {/* Application + judging period */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Application Deadline" hint="Last day to complete the application">
          <input
            name="application_deadline"
            type="date"
            defaultValue={initial?.application_deadline?.slice(0, 10) ?? ''}
            className={inputBase}
            disabled={saving}
          />
        </Field>
        <Field label="Judging Opens" hint="When judges can start scoring">
          <input
            name="judging_start"
            type="date"
            defaultValue={initial?.judging_start?.slice(0, 10) ?? ''}
            className={inputBase}
            disabled={saving}
          />
        </Field>
        <Field label="Judging Closes">
          <input
            name="judging_end"
            type="date"
            defaultValue={initial?.judging_end?.slice(0, 10) ?? ''}
            className={inputBase}
            disabled={saving}
          />
        </Field>
      </div>

      <Field label="Winner Announcement Date" hint="When results are published">
        <input
          name="winners_announced"
          type="date"
          defaultValue={initial?.winners_announced?.slice(0, 10) ?? ''}
          className="w-full sm:w-60 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40"
          disabled={saving}
        />
      </Field>

      <Divider label="Venue & Tickets" />

      {/* Venue row */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Venue Name">
          <input
            name="venue"
            type="text"
            defaultValue={initial?.venue ?? ''}
            placeholder="e.g. The Leadenhall Building, London"
            className={inputBase}
            disabled={saving}
          />
        </Field>
        <Field label="Venue Address">
          <input
            name="venue_address"
            type="text"
            defaultValue={initial?.venue_address ?? ''}
            placeholder="Full street address"
            className={inputBase}
            disabled={saving}
          />
        </Field>
      </div>

      <Field label="Ticket / Registration URL">
        <input
          name="ticket_url"
          type="url"
          defaultValue={initial?.ticket_url ?? ''}
          placeholder="https://…"
          className={inputBase}
          disabled={saving}
        />
      </Field>

      <Divider label="Settings" />

      {/* Status + Featured */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status">
          <select
            name="status"
            defaultValue={initial?.status ?? 'upcoming'}
            className={`${inputBase} bg-ink/80`}
            disabled={saving}
          >
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>

        <div className="flex flex-col gap-3 justify-end pb-1">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              name="is_featured"
              type="checkbox"
              defaultChecked={initial?.is_featured ?? false}
              disabled={saving}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-gold"
            />
            <span className="text-sm text-white/70">
              <Star className="mr-1 inline h-3.5 w-3.5 text-gold" />
              Featured event
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              name="is_public"
              type="checkbox"
              defaultChecked={initial?.is_public ?? true}
              disabled={saving}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-gold"
            />
            <span className="text-sm text-white/70">
              <Globe className="mr-1 inline h-3.5 w-3.5 text-white/50" />
              Public (visible on site)
            </span>
          </label>
        </div>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-4 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
      </button>
    </form>
  );
}
