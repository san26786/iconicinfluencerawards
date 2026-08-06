'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, Save, Loader2, CheckCircle2 } from 'lucide-react';

type Question = {
  id: number;
  text: string;
  order: number;
  existingScore: number | null;
};

type Applicant = {
  nominationId: number;
  nomineeName: string;
  nomineeEmail: string | null;
  businessName: string | null;
  categories: string[];
  allocatedAt: string;
  score: number | null;
  notes: string | null;
  markedFirst: boolean;
  markedSemifinalist: boolean;
  markedFinalist: boolean;
  scoredAt: string | null;
  hasQuestions: boolean;
};

function ScoreButton({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
        selected
          ? 'bg-gold-gradient text-ink shadow-gold-sm scale-110'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
      }`}
    >
      {value}
    </button>
  );
}

/* ─── Per-question scoring panel ─────────────────────────────────────── */
function QuestionScoringPanel({
  applicant, judgeId, onSaved,
}: {
  applicant: Applicant;
  judgeId: number;
  onSaved: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState(applicant.notes ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/judge/question-scores?nominationId=${applicant.nominationId}&judgeId=${judgeId}`)
      .then(r => r.json())
      .then(data => {
        const qs: Question[] = data.questions ?? [];
        setQuestions(qs);
        const initial: Record<number, number> = {};
        for (const q of qs) {
          if (q.existingScore != null) initial[q.id] = q.existingScore;
        }
        setScores(initial);
      })
      .finally(() => setLoading(false));
  }, [applicant.nominationId, judgeId]);

  const allScored = questions.length > 0 && questions.every(q => scores[q.id] != null);
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  const maxTotal = questions.length * 10;

  async function save() {
    if (!allScored) return;
    setSaving(true);
    try {
      await fetch('/api/judge/question-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationId: applicant.nominationId,
          judgeId,
          scores: Object.entries(scores).map(([qId, score]) => ({ questionId: Number(qId), score })),
          notes,
        }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved(); }, 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/40 py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading questions…
      </div>
    );
  }

  if (questions.length === 0) {
    return <p className="text-sm text-white/40 py-2">No application questions found for this event. Contact the organiser.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Per-question scores */}
      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <p className="text-xs font-semibold text-white/70">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[0.6rem]">{i + 1}</span>
              {q.text}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
                <ScoreButton
                  key={v}
                  value={v}
                  selected={scores[q.id] === v}
                  onClick={() => setScores(prev => ({ ...prev, [q.id]: v }))}
                />
              ))}
              {scores[q.id] != null && (
                <span className="ml-1 text-xs text-white/40">{scores[q.id]}/10</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Running total */}
      {Object.keys(scores).length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
          <span className="text-xs text-white/50">Score so far:</span>
          <span className="text-lg font-bold text-gold">{total}</span>
          <span className="text-xs text-white/30">/ {maxTotal}</span>
          <span className="ml-auto text-xs text-white/40">
            ({maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0}%)
          </span>
        </div>
      )}

      {/* Notes */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">Notes (optional)</p>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Judging notes for this applicant…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40"
        />
      </div>

      <button
        onClick={save}
        disabled={!allScored || saving}
        className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : saved ? 'Saved!' : `Submit Scores (${total}/${maxTotal})`}
      </button>
      {!allScored && questions.length > 0 && (
        <p className="text-xs text-white/35">Score all {questions.length} questions to submit.</p>
      )}
    </div>
  );
}

/* ─── Single overall score panel (fallback when no questions) ────────── */
function SingleScorePanel({
  applicant, judgeId, onSaved,
}: {
  applicant: Applicant;
  judgeId: number;
  onSaved: () => void;
}) {
  const [score, setScore] = useState(applicant.score ?? 0);
  const [notes, setNotes] = useState(applicant.notes ?? '');
  const [markedFirst, setMarkedFirst]               = useState(applicant.markedFirst);
  const [markedSemifinalist, setMarkedSemifinalist] = useState(applicant.markedSemifinalist);
  const [markedFinalist, setMarkedFinalist]         = useState(applicant.markedFinalist);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function save() {
    if (!score) return;
    setSaving(true);
    try {
      await fetch('/api/judge/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationId: applicant.nominationId,
          judgeId,
          score,
          notes,
          markedFirst,
          markedSemifinalist,
          markedFinalist,
        }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved(); }, 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
          Overall Score (1–10) <span className="text-gold">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map((v) => (
            <ScoreButton key={v} value={v} selected={score === v} onClick={() => setScore(v)} />
          ))}
        </div>
        {score > 0 && (
          <p className="mt-2 text-xs text-white/40">
            {score <= 3 ? 'Below expectations' : score <= 6 ? 'Meets expectations' : score <= 8 ? 'Exceeds expectations' : 'Outstanding'}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Shortlist / First', state: markedFirst,       set: setMarkedFirst },
          { label: 'Semi-finalist',     state: markedSemifinalist, set: setMarkedSemifinalist },
          { label: 'Finalist',          state: markedFinalist,    set: setMarkedFinalist },
        ].map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => f.set(!f.state)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              f.state ? 'bg-gold-gradient text-ink shadow-gold-sm' : 'glass text-white/60 hover:text-white'
            }`}
          >
            <Star className="h-3 w-3" /> {f.label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">Notes</p>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional judging notes…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40"
        />
      </div>

      <button
        onClick={save}
        disabled={!score || saving}
        className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Score'}
      </button>
    </div>
  );
}

/* ─── Applicant Row ──────────────────────────────────────────────────── */
function ApplicantRow({ applicant, judgeId }: { applicant: Applicant; judgeId: number }) {
  const [expanded, setExpanded] = useState(!applicant.score && !applicant.scoredAt);
  const [scored, setScored]     = useState(!!(applicant.scoredAt || applicant.score));

  return (
    <div className={`rounded-2xl glass overflow-hidden ${scored ? 'border-l-2 border-green-500/50' : ''}`}>
      <div className="flex flex-wrap items-start gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{applicant.nomineeName}</p>
            {scored && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-300">
                <CheckCircle2 className="h-3 w-3" /> Scored
              </span>
            )}
            {applicant.hasQuestions && (
              <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[0.6rem] font-semibold text-gold/70">
                Per-question
              </span>
            )}
          </div>
          {applicant.businessName && <p className="text-sm text-white/55">{applicant.businessName}</p>}
          {applicant.categories.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {applicant.categories.map((c) => (
                <span key={c} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/45">{c}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          {applicant.score != null && (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-ink">
              {applicant.score}
            </span>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:text-white"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-5">
          {applicant.hasQuestions ? (
            <QuestionScoringPanel
              applicant={applicant}
              judgeId={judgeId}
              onSaved={() => setScored(true)}
            />
          ) : (
            <SingleScorePanel
              applicant={applicant}
              judgeId={judgeId}
              onSaved={() => setScored(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────── */
export function JudgeBoardClient({ applicants, judgeId }: { applicants: Applicant[]; judgeId: number }) {
  if (applicants.length === 0) {
    return (
      <div className="mt-10 py-16 text-center">
        <p className="text-sm text-white/40">No applicants have been allocated to you yet.</p>
        <p className="mt-1 text-xs text-white/25">Check back after the organiser has made allocations.</p>
      </div>
    );
  }

  const unscored = applicants.filter((a) => !a.scoredAt && !a.score);
  const scored   = applicants.filter((a) => a.scoredAt || a.score);

  return (
    <div className="mt-6 space-y-6">
      {unscored.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-white/60">
            To score <span className="ml-1.5 rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold">{unscored.length}</span>
          </h2>
          <div className="space-y-3">
            {unscored.map((a) => <ApplicantRow key={a.nominationId} applicant={a} judgeId={judgeId} />)}
          </div>
        </section>
      )}
      {scored.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-white/60">
            Scored <span className="ml-1.5 rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-300">{scored.length}</span>
          </h2>
          <div className="space-y-3">
            {scored.map((a) => <ApplicantRow key={a.nominationId} applicant={a} judgeId={judgeId} />)}
          </div>
        </section>
      )}
    </div>
  );
}
