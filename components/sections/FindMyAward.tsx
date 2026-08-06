'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowRight,
  Mail,
  RotateCcw,
  Sparkles,
  Star,
} from 'lucide-react';
import {
  AWARD_CATEGORIES,
  NOMINATION_STORAGE_KEY,
  SITE,
  type ThemeId,
} from '@/lib/content';

// Dynamically import the EmailResultsModal — it only renders after the user
// taps "Email me my results" on the results panel. Deferring its JS (~6 kB
// gzipped: form, network handling, four extra lucide icons) until that
// moment is a measurable win for the initial /find-my-award and home-page
// bundles.
const EmailResultsModal = dynamic(
  () => import('./EmailResultsModal').then((m) => m.EmailResultsModal),
  { ssr: false, loading: () => null },
);

// Hand-off the picked categories to the nomination form via sessionStorage
// (keeps URLs short — the form reads + clears on mount).
function presetCategories(list: string[]) {
  try {
    sessionStorage.setItem(NOMINATION_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* sessionStorage unavailable — link still navigates */
  }
}
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';

type Option<T extends string> = { label: string; val: T };

type AnswerKey = 'role' | 'goal' | 'stage' | 'outcome';

type Question = {
  key: AnswerKey;
  legend: string;
  hint?: string;
  opts: Option<ThemeId>[];
};

// Every question feeds the award-fit score. Each option votes for the theme
// its answer most strongly implies; the "what describes you" answer carries
// extra weight (see the ranking calculation below).
const QUESTIONS: Question[] = [
  {
    key: 'role',
    legend: 'What best describes your business?',
    opts: [
      { label: 'Estate or lettings agency', val: 'agency' },
      { label: 'Developer or housebuilder', val: 'development' },
      { label: 'Property management or surveying', val: 'services' },
      { label: 'PropTech or property platform', val: 'proptech' },
      { label: 'Legal, finance or lending', val: 'services' },
      { label: 'An individual professional', val: 'individual' },
    ],
  },
  {
    key: 'goal',
    legend: 'What do you want to be recognised for?',
    opts: [
      { label: 'Sales or lettings performance', val: 'agency' },
      { label: 'A completed scheme or project', val: 'development' },
      { label: 'Service and client care', val: 'services' },
      { label: 'Innovation or new technology', val: 'proptech' },
      { label: 'Personal achievement', val: 'individual' },
      { label: 'Team culture or community impact', val: 'team' },
    ],
  },
  {
    key: 'stage',
    legend: 'What stage are you at?',
    opts: [
      { label: 'Newly launched', val: 'proptech' },
      { label: 'Growing fast', val: 'agency' },
      { label: 'Well established', val: 'development' },
      { label: 'Independent or boutique', val: 'services' },
      { label: 'Early in my career', val: 'individual' },
      { label: 'A large multi-office team', val: 'team' },
    ],
  },
  {
    key: 'outcome',
    legend: 'Which outcome matters most?',
    opts: [
      { label: 'Winning more instructions', val: 'agency' },
      { label: 'Investor and partner confidence', val: 'development' },
      { label: 'Client trust and retention', val: 'services' },
      { label: 'Trade press and media visibility', val: 'proptech' },
      { label: 'Personal profile in the industry', val: 'individual' },
      { label: 'Attracting and keeping talent', val: 'team' },
    ],
  },
];

// Stable tie-breaker order
const AWARD_ORDER: ThemeId[] = [
  'agency',
  'development',
  'services',
  'proptech',
  'individual',
  'team',
];

// Only themes still present in the (possibly filtered) taxonomy can appear in
// results — hidden themes are dropped so a vote for one never surfaces it.
const VISIBLE_THEME_IDS = new Set<ThemeId>(AWARD_CATEGORIES.map((g) => g.id));

type Answers = Partial<Record<AnswerKey, string>>;

export function FindMyAward() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const totalSteps = QUESTIONS.length;
  const currentQ = QUESTIONS[step];
  const progress = done ? 100 : Math.round(((step + 1) / totalSteps) * 100);

  const ranking = useMemo(() => {
    // Score each theme: tally votes from role/goal/stage/outcome
    const scores = Object.fromEntries(
      AWARD_ORDER.map((id) => [id, 0]),
    ) as Record<ThemeId, number>;
    (['role', 'goal', 'stage', 'outcome'] as const).forEach((k) => {
      const v = answers[k] as ThemeId | undefined;
      if (v && v in scores) scores[v]++;
    });
    // The "what describes you" answer is the strongest signal
    const roleV = answers.role as ThemeId | undefined;
    if (roleV && roleV in scores) scores[roleV] += 0.5;

    return AWARD_ORDER
      .filter((k) => VISIBLE_THEME_IDS.has(k))
      .map((k) => ({ id: k, score: scores[k] }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return AWARD_ORDER.indexOf(a.id) - AWARD_ORDER.indexOf(b.id);
      });
  }, [answers]);

  const pick = (val: string) => {
    const key = currentQ.key;
    const next = { ...answers, [key]: val };
    setAnswers(next);
    if (step + 1 === totalSteps) {
      setDone(true);
    } else {
      setStep(step + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setDone(false);
  };

  return (
    <section
      id="find-my-award"
      className="relative overflow-hidden bg-slate950 py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-gold/15 blur-[150px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <SectionHeading
          eyebrow="Find My Award"
          title={
            <>
              Not sure which award <span className="text-gold-gradient">fits you?</span>
            </>
          }
          subtitle="Answer four quick questions and we will rank every award you are eligible for."
        />

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
          <div className="rounded-3xl glass p-7 sm:p-9">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-luxe text-white/55">
                <span>
                  {done ? 'Your best-fit awards' : `Question ${step + 1} of ${totalSteps}`}
                </span>
                <span className="text-gold">{progress}%</span>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gold-gradient transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {!done ? (
              <div>
                <p className="font-display text-xl font-semibold text-white sm:text-2xl">
                  {currentQ.legend}
                </p>
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {currentQ.opts.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => pick(o.val)}
                      className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/[0.07]"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {currentQ.hint && (
                  <p className="mt-4 text-xs leading-relaxed text-white/45">{currentQ.hint}</p>
                )}
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/45 transition-colors hover:text-gold"
                  >
                    ← Back
                  </button>
                )}
              </div>
            ) : (
              <Result ranking={ranking} onReset={reset} />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Result({
  ranking,
  onReset,
}: {
  ranking: { id: ThemeId; score: number }[];
  onReset: () => void;
}) {
  // Modal toggle for the "Email me my results" flow. Lives at the Result
  // level rather than globally so it tears down with the rest of the
  // results view when the user retakes the quiz.
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  if (!ranking.length) return null;
  const top = AWARD_CATEGORIES.find((g) => g.id === ranking[0].id)!;
  const others = ranking.slice(1).map((r) => AWARD_CATEGORIES.find((g) => g.id === r.id)!);

  const topCats = top.popular.slice(0, 3);
  const otherCats = others.flatMap((a) => a.popular.slice(0, 3));
  const allCats = [...topCats, ...otherCats];

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full glass-gold px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
        <Sparkles className="h-3 w-3" />
        Find My Award
      </span>
      <h3 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
        All your recommended awards
      </h3>

      <CategoryGroup title="Most popular categories" categories={topCats} highlight />

      {otherCats.length > 0 && (
        <CategoryGroup
          title="Other Premium categories recommended for you"
          categories={otherCats}
        />
      )}

      <p className="mt-6 text-xs italic text-white/55">
        These span every theme you are eligible for — browse all categories to
        fine-tune your route.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <Link
          href={SITE.nominateUrl}
          onClick={() => presetCategories(allCats)}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-3.5 text-sm font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
        >
          Nominate All ({allCats.length})
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Secondary CTA — sends the result list to the user's inbox.
            Outline button visually subordinated to "Nominate All" but
            still prominent so it doesn't get missed. */}
        <button
          type="button"
          onClick={() => setEmailModalOpen(true)}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/[0.05] py-3.5 text-sm font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/[0.12] hover:text-gold-light"
        >
          <Mail className="h-4 w-4" />
          Email me my results
        </button>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/45 transition-colors hover:text-gold"
      >
        <RotateCcw className="h-3 w-3" />
        Retake quiz
      </button>

      {emailModalOpen && (
        <EmailResultsModal
          topCats={topCats}
          otherCats={otherCats}
          onClose={() => setEmailModalOpen(false)}
        />
      )}
    </div>
  );
}


function CategoryGroup({
  title,
  categories,
  highlight = false,
}: {
  title: string;
  categories: string[];
  highlight?: boolean;
}) {
  return (
    <section className="mt-7">
      <h4
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-luxe ${
          highlight ? 'text-gold' : 'text-white/55'
        }`}
      >
        {highlight && <Star className="h-3 w-3 fill-current" />}
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {categories.map((c) => (
          <li
            key={c}
            className={`group flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors duration-200 ${
              highlight
                ? 'border-gold/30 bg-gold/[0.05] hover:border-gold/60'
                : 'border-white/10 bg-white/[0.025] hover:border-gold/30'
            }`}
          >
            <span className="text-sm font-medium leading-snug text-white">{c}</span>
            <Link
              href={SITE.nominateUrl}
              onClick={() => presetCategories([c])}
              aria-label={`Nominate for ${c}`}
              className="flex-shrink-0 rounded-full bg-gold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold opacity-80 transition-all duration-200 group-hover:bg-gold/25 group-hover:opacity-100"
            >
              Nominate →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
