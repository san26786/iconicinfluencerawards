'use client';

import { useState } from 'react';
import { ArrowRight, Phone, Mail, Building2, MessageSquare } from 'lucide-react';

interface Props {
  siteId: number;
  siteName: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/55">
        <Icon className="h-3 w-3 text-gold" />
        {label}
      </span>
      {children}
    </label>
  );
}

export function PreLaunchForm({ siteName }: Props) {
  const [form, setForm] = useState({
    phone: '',
    email: '',
    organisation: '',
    message: '',
    consented: false,
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/pre-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full glass-gold">
          <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="font-display text-xl font-semibold text-white">You&apos;re on the list!</h4>
        <p className="mt-2 max-w-xs text-sm text-white/55">
          Thank you for registering your interest in the {siteName} Pre-Launch. We&apos;ll be in
          touch with exclusive early-access details soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Phone + Email */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Phone" icon={Phone}>
          <input
            type="tel"
            placeholder="+44 20 0000 0000"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={inputBase}
          />
        </Field>
        <Field label="Email *" icon={Mail}>
          <input
            type="email"
            placeholder="you@company.com"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputBase}
          />
        </Field>
      </div>

      {/* Organisation */}
      <Field label="Organisation" icon={Building2}>
        <input
          type="text"
          placeholder="Your company or organisation"
          value={form.organisation}
          onChange={(e) => set('organisation', e.target.value)}
          className={inputBase}
        />
      </Field>

      {/* Message */}
      <Field label="Message" icon={MessageSquare}>
        <textarea
          placeholder="Tell us how we can help…"
          rows={4}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          className={`${inputBase} resize-none`}
        />
      </Field>

      {/* Consent */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <input
          type="checkbox"
          required
          checked={form.consented}
          onChange={(e) => set('consented', e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-gold cursor-pointer"
        />
        <span className="text-xs leading-relaxed text-white/55">
          I confirm my details are accurate and consent to being contacted via email, phone, or
          WhatsApp about {siteName} events and news.
        </span>
      </label>

      {/* Error */}
      {status === 'error' && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {errorMsg}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient px-8 py-4 text-[0.95rem] font-semibold tracking-wide text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          aria-hidden="true"
        />
        <span className="relative z-10">
          {status === 'submitting' ? 'Sending…' : 'Get Your Ticket'}
        </span>
        {status !== 'submitting' && (
          <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </button>

    </form>
  );
}
