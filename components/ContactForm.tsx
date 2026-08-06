'use client';

// Contact form. Posts to /api/contact, which:
//   1. Validates the payload server-side
//   2. (optionally) forwards to the upstream PHP endpoint when
//      CONTACT_UPSTREAM_URL is configured
//   3. Fires two emails via Resend — confirmation to the visitor + a richly
//      formatted notification to the team mailbox
// See app/api/contact/route.ts for the full JSON payload schema.

import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

const SUBJECTS = [
  'Entering the awards',
  'Nominating a business',
  'Sponsorship & partnerships',
  'Press & media',
  'General enquiry',
];

type Status = 'idle' | 'submitting' | 'sent' | 'error';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      company: String(fd.get('company') ?? '').trim() || undefined,
      phone: String(fd.get('phone') ?? '').trim() || undefined,
      subject: String(fd.get('subject') ?? '').trim(),
      message: String(fd.get('message') ?? '').trim(),
      // Honeypot — invisible to humans, bots fill anything they see
      website: String(fd.get('website') ?? '').trim() || undefined,
      consent: true,
    };

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to surface a useful message from the structured error body
        let detail = `Server returned ${res.status}`;
        try {
          const body = (await res.json()) as { error?: string; fields?: string[] };
          if (body.error === 'validation' && body.fields?.length) {
            detail = `Please check: ${body.fields.join(', ')}`;
          } else if (body.error) {
            detail = body.error;
          }
        } catch {
          /* response wasn't JSON */
        }
        throw new Error(detail);
      }

      setStatus('sent');
      form.reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ContactForm] submit failed:', msg);
      setErrorMessage(msg);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl glass-gold p-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
          <CheckCircle2 className="h-8 w-8 text-ink" />
        </span>
        <h3 className="mt-6 font-display text-2xl font-semibold text-white">Thank you</h3>
        <p className="mt-3 max-w-sm text-white/65">
          Your message has been received. A member of the team will be in touch shortly —
          usually within one business day. We have also sent a confirmation to your inbox.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm font-semibold text-gold hover:text-gold-light"
        >
          Send another message
        </button>
      </div>
    );
  }

  const submitting = status === 'submitting';

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl glass p-7 sm:p-9">
      {/* Honeypot: real users never see this, bots tend to fill every field. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jane Smith"
            className={inputBase}
            disabled={submitting}
          />
        </Field>
        <Field label="Company" htmlFor="company">
          <input
            id="company"
            name="company"
            type="text"
            placeholder="Your business"
            className={inputBase}
            disabled={submitting}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="jane@business.com"
            className={inputBase}
            disabled={submitting}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="07000 000000"
            className={inputBase}
            disabled={submitting}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="How can we help?" htmlFor="subject">
          <select
            id="subject"
            name="subject"
            className={`${inputBase} appearance-none`}
            defaultValue={SUBJECTS[0]}
            disabled={submitting}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s} className="bg-ink text-white">
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Message" htmlFor="message">
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            maxLength={5000}
            placeholder="Tell us a little about your enquiry…"
            className={`${inputBase} resize-none`}
            disabled={submitting}
          />
        </Field>
      </div>

      {status === 'error' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <strong className="block text-red-100">Something went wrong</strong>
            <span className="text-red-200/80">{errorMessage}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="group mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient py-4 text-sm font-semibold text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-12px_rgba(35,184,155,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-white/40">
        We typically respond within one business day.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}
