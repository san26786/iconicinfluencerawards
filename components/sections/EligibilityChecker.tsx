'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, AlertCircle, Loader2, UserCircle, ArrowRight } from 'lucide-react';

type Question = {
  id: number;
  question_text: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
};

type ApiResponse = {
  profileComplete: boolean;
  missingFields: string[];
  questions: Question[];
};

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none transition-colors';

export function EligibilityChecker() {
  const [state, setState] = useState<'loading' | 'incomplete' | 'questions' | 'done'>('loading');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/eligibility')
      .then(r => r.json())
      .then((d: ApiResponse) => {
        setData(d);
        if (!d.profileComplete) {
          setState('incomplete');
        } else if (d.questions.length === 0) {
          setState('done'); // no questions configured — straight to result
        } else {
          setState('questions');
        }
      })
      .catch(() => setError('Could not load eligibility check. Please try again.'));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  /* ── Profile incomplete ─────────────────────────────────────────────── */
  if (state === 'incomplete') {
    return (
      <div className="rounded-3xl border border-gold/20 bg-gold/[0.04] p-8 text-center">
        <UserCircle className="mx-auto h-12 w-12 text-gold/50" />
        <h2 className="mt-4 font-display text-xl font-bold text-white">
          Complete your profile first
        </h2>
        <p className="mt-3 max-w-md mx-auto text-sm leading-relaxed text-white/55">
          Before checking your eligibility, we need a few details about you. Please
          fill in the missing fields in your profile.
        </p>

        {data?.missingFields && data.missingFields.length > 0 && (
          <div className="mt-5 inline-flex flex-col gap-1.5 text-left">
            {data.missingFields.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gold/70">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {f} is missing
              </div>
            ))}
          </div>
        )}

        <Link
          href="/account/profile"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-sm font-bold text-ink shadow-gold transition hover:opacity-90"
        >
          Complete My Profile <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ── No questions configured ─────────────────────────────────────────── */
  if (state === 'done' || !data?.questions.length) {
    return (
      <div className="rounded-3xl border border-green-500/20 bg-green-500/[0.06] p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
        <h2 className="mt-4 font-display text-xl font-bold text-white">
          You&apos;re eligible to apply!
        </h2>
        <p className="mt-3 max-w-md mx-auto text-sm leading-relaxed text-white/55">
          Your profile is complete and you meet the eligibility criteria. Start your
          free nomination now.
        </p>
        <Link
          href="/nominate"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-sm font-bold text-ink shadow-gold transition hover:opacity-90"
        >
          Start My Nomination <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ── Eligibility questions ───────────────────────────────────────────── */
  const questions = data.questions;
  const current = questions[step];
  const progress = Math.round(((step + 1) / questions.length) * 100);
  const isLast = step === questions.length - 1;

  const handleAnswer = (val: string) => {
    setAnswers(prev => ({ ...prev, [current.id]: val }));
    if (!isLast) {
      setStep(s => s + 1);
    } else {
      setState('done');
    }
  };

  const handleNext = () => {
    if (!current.is_required || answers[current.id]) {
      if (!isLast) setStep(s => s + 1);
      else setState('done');
    }
  };

  return (
    <div className="rounded-3xl glass p-7 sm:p-9">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/55">
          <span>Question {step + 1} of {questions.length}</span>
          <span className="text-gold">{progress}%</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gold-gradient transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <p className="font-display text-xl font-semibold text-white sm:text-2xl">
        {current.question_text}
        {current.is_required && <span className="ml-1 text-gold">*</span>}
      </p>

      <div className="mt-5">
        {/* radio / select options */}
        {(current.field_type === 'radio' || current.field_type === 'select') && current.options ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {current.options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswer(opt)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                  answers[current.id] === opt
                    ? 'border-gold/50 bg-gold/[0.1] text-gold'
                    : 'border-white/10 bg-white/[0.025] text-white hover:border-gold/40 hover:bg-gold/[0.06]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : current.field_type === 'checkbox' && current.options ? (
          <div className="space-y-2.5">
            {current.options.map(opt => {
              const selected = (answers[current.id] ?? '').split('||').filter(Boolean);
              const checked = selected.includes(opt);
              const toggle = () => {
                const next = checked ? selected.filter(v => v !== opt) : [...selected, opt];
                setAnswers(prev => ({ ...prev, [current.id]: next.join('||') }));
              };
              return (
                <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white transition hover:border-gold/30">
                  <input type="checkbox" checked={checked} onChange={toggle} className="accent-gold" />
                  {opt}
                </label>
              );
            })}
            <button
              type="button"
              onClick={handleNext}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-bold text-ink shadow-gold transition hover:opacity-90"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : current.field_type === 'textarea' ? (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={answers[current.id] ?? ''}
              onChange={e => setAnswers(prev => ({ ...prev, [current.id]: e.target.value }))}
              placeholder="Type your answer here…"
              className={inputBase + ' resize-none'}
            />
            <button
              type="button"
              onClick={handleNext}
              disabled={current.is_required && !answers[current.id]}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-bold text-ink shadow-gold transition hover:opacity-90 disabled:opacity-40"
            >
              {isLast ? 'Submit' : 'Next'} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* text / number / date */
          <div className="space-y-3">
            <input
              type={current.field_type === 'number' ? 'number' : current.field_type === 'date' ? 'date' : 'text'}
              value={answers[current.id] ?? ''}
              onChange={e => setAnswers(prev => ({ ...prev, [current.id]: e.target.value }))}
              placeholder="Type your answer here…"
              className={inputBase}
            />
            <button
              type="button"
              onClick={handleNext}
              disabled={current.is_required && !answers[current.id]}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-bold text-ink shadow-gold transition hover:opacity-90 disabled:opacity-40"
            >
              {isLast ? 'Submit' : 'Next'} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/40 transition hover:text-gold"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
