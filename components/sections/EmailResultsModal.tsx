'use client';

// "Email me my Find My Award results" modal — extracted from FindMyAward
// so it can be dynamic-imported. The modal only appears when the user
// taps the "Email me my results" button, so deferring its ~6 kB of code
// + its lucide-react icons until that moment is a clear perf win.
//
// All the form, honeypot, and async POST logic that used to live inside
// FindMyAward.tsx now lives here. The parent passes the picks + an onClose
// callback.

import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  X as CloseIcon,
} from 'lucide-react';

type ModalStatus = 'idle' | 'sending' | 'sent' | 'error';

export type EmailResultsModalProps = {
  topCats: string[];
  otherCats: string[];
  onClose: () => void;
};

export function EmailResultsModal({
  topCats,
  otherCats,
  onClose,
}: EmailResultsModalProps) {
  const [status, setStatus] = useState<ModalStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '').trim();
    const firstName = String(fd.get('firstName') ?? '').trim() || undefined;
    const website = String(fd.get('website') ?? '').trim(); // honeypot

    setStatus('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/find-my-award/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          topCategoryNames: topCats,
          otherCategoryNames: otherCats,
          website,
        }),
      });

      if (!res.ok) {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[EmailResultsModal] submit failed:', msg);
      setErrorMessage(msg);
      setStatus('error');
    }
  }

  const totalCount = topCats.length + otherCats.length;
  const sending = status === 'sending';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-results-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-gold/20 bg-slate950 p-6 shadow-glass sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />

        {status !== 'sending' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}

        {status === 'sent' ? (
          <div className="relative text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient">
              <CheckCircle2 className="h-7 w-7 text-ink" />
            </span>
            <h3 id="email-results-title" className="mt-5 font-display text-2xl font-semibold text-white">
              Check your inbox
            </h3>
            <p className="mx-auto mt-3 max-w-xs text-sm text-white/65">
              We have sent your {totalCount}-category shortlist with a one-tap
              Nominate link for each. Give it a minute — and check spam if
              nothing arrives.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
            >
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                <Mail className="h-5 w-5 text-ink" />
              </span>
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-luxe text-gold">
                  Email me my results
                </p>
                <h3
                  id="email-results-title"
                  className="font-display text-lg font-semibold text-white"
                >
                  {totalCount} categories, one inbox
                </h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/65">
              We will send your {totalCount}-category shortlist with a one-tap
              <strong className="text-white"> Nominate </strong> link for each
              and a <strong className="text-white">Nominate All</strong> link
              for the whole list.
            </p>

            {/* Honeypot — invisible to humans, bots tend to fill every field. */}
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
              <label htmlFor="fmaw-website">Website</label>
              <input
                id="fmaw-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>

            <div className="mt-5 space-y-3">
              <label htmlFor="fmaw-email" className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
                  Your email *
                </span>
                <input
                  id="fmaw-email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="jane@business.com"
                  disabled={sending}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40 disabled:opacity-60"
                />
              </label>

              <label htmlFor="fmaw-firstname" className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
                  First name (optional)
                </span>
                <input
                  id="fmaw-firstname"
                  name="firstName"
                  type="text"
                  placeholder="Jane"
                  disabled={sending}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40 disabled:opacity-60"
                />
              </label>
            </div>

            {status === 'error' && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <strong className="block text-red-100">Could not send</strong>
                  <span className="text-red-200/80">{errorMessage}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-3.5 text-sm font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send results to my inbox
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[0.7rem] text-white/40">
              We use this once to send your shortlist. No marketing. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
