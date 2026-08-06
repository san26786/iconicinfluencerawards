'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Printer, MessageSquare, Mail, Calendar, Star,
  Clock, CheckCircle, AlertCircle, Send, Loader2,
  User, Building, Phone, Award, FileText,
} from 'lucide-react';
import { SITE } from '@/lib/content';

/* ─── Shared Application type (mirrors ApplicationsListClient) ─────────── */
export type AppRecord = {
  id: number;
  ref_number: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
  job_title: string | null;
  org_name: string | null;
  industry: string | null;
  event_title: string | null;
  created_at: string;
};

export type ModalType =
  | 'preview'
  | 'certificate'
  | 'comments'
  | 'add-comment'
  | 'email-trail'
  | 'schedule'
  | 'score';

/* ─── Base wrapper ──────────────────────────────────────────────────────── */
function BaseModal({
  title, onClose, children, maxW = 'max-w-3xl',
}: {
  title: string; onClose: () => void; children: React.ReactNode; maxW?: string;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className={`relative w-full ${maxW} rounded-3xl border border-white/10 bg-[#0f0f1a] shadow-2xl flex flex-col`}
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4 flex-shrink-0">
          <h2 className="font-display text-base font-semibold uppercase tracking-wider text-gold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm text-white/30">{text}</p>;
}

/* ─── 1. Application Preview ────────────────────────────────────────────── */
type FullApp = AppRecord & {
  phone?: string;
  application_answers?: Record<string, string> | Array<{ question: string; answer: string }> | null;
  eligibility_answers?: Record<string, unknown> | null;
};

export function PreviewModal({ app, onClose }: { app: AppRecord; onClose: () => void }) {
  const [detail, setDetail] = useState<FullApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organiser/application-detail?id=${app.id}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => setDetail(app as FullApp))
      .finally(() => setLoading(false));
  }, [app]);

  const fullName = `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim() || '—';

  function renderAnswers(answers: FullApp['application_answers']) {
    if (!answers) return null;
    if (Array.isArray(answers)) {
      return answers.map((qa, i) => (
        <div key={i} className="space-y-1">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{qa.question}</p>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{qa.answer || '—'}</p>
        </div>
      ));
    }
    return Object.entries(answers).map(([k, v]) => (
      <div key={k} className="space-y-1">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{k.replace(/_/g, ' ')}</p>
        <p className="text-sm text-white/80 whitespace-pre-wrap">{String(v) || '—'}</p>
      </div>
    ));
  }

  return (
    <BaseModal title="Preview Application" onClose={onClose} maxW="max-w-2xl">
      {loading ? <Loader /> : (
        <div className="p-6 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: User,     label: 'Full Name',    val: fullName },
              { icon: Mail,     label: 'Email',        val: app.email ?? '—' },
              { icon: Phone,    label: 'Mobile',       val: app.mobile ?? '—' },
              { icon: Building, label: 'Organisation', val: app.org_name ?? '—' },
              { icon: FileText, label: 'Job Title',    val: app.job_title ?? '—' },
              { icon: Award,    label: 'Category',     val: app.industry ?? '—' },
              { icon: FileText, label: 'Reference',    val: app.ref_number },
              { icon: Clock,    label: 'Applied',      val: app.created_at?.slice(0, 10) ?? '—' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                <p className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 mb-1">
                  <Icon className="h-3 w-3" />{label}
                </p>
                <p className="text-sm text-white/80 break-words">{val}</p>
              </div>
            ))}
          </div>

          {/* Application Q&A */}
          {detail?.application_answers && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 border-b border-white/8 pb-2">
                Application Answers
              </p>
              <div className="space-y-4">{renderAnswers(detail.application_answers)}</div>
            </div>
          )}

          {/* Print */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:border-gold/30 transition-colors"
            >
              <Printer className="h-4 w-4" /> Print / Download PDF
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

/* ─── 2. Certificate ────────────────────────────────────────────────────── */
export function CertificateModal({ app, onClose }: { app: AppRecord; onClose: () => void }) {
  const fullName = `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim() || 'Applicant';
  const year = new Date().getFullYear();

  function printCertificate() {
    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><title>Certificate – ${fullName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0a14; display:flex; justify-content:center; align-items:center; min-height:100vh; font-family:'Inter',sans-serif; }
  .cert { width:820px; padding:60px; border:2px solid #c9a84c; border-radius:16px; background:linear-gradient(145deg,#12122a,#0a0a14); text-align:center; color:#fff; position:relative; }
  .cert::before { content:''; position:absolute; inset:8px; border:1px solid rgba(201,168,76,0.3); border-radius:10px; pointer-events:none; }
  .logo { font-family:'Playfair Display',serif; font-size:13px; letter-spacing:4px; color:#c9a84c; text-transform:uppercase; margin-bottom:32px; }
  h1 { font-family:'Playfair Display',serif; font-size:42px; color:#c9a84c; margin-bottom:20px; }
  .presents { font-size:13px; letter-spacing:3px; color:rgba(255,255,255,0.5); text-transform:uppercase; margin-bottom:28px; }
  .name { font-family:'Playfair Display',serif; font-size:36px; color:#fff; border-bottom:1px solid rgba(201,168,76,0.4); display:inline-block; padding-bottom:8px; margin-bottom:20px; min-width:400px; }
  .org { font-size:16px; color:rgba(255,255,255,0.7); margin-bottom:28px; }
  .award-label { font-size:11px; letter-spacing:3px; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:10px; }
  .award { font-family:'Playfair Display',serif; font-size:22px; color:#c9a84c; margin-bottom:40px; }
  .footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:48px; }
  .sig { text-align:center; }
  .sig-line { border-top:1px solid rgba(255,255,255,0.3); padding-top:8px; font-size:11px; color:rgba(255,255,255,0.4); letter-spacing:1px; }
  .year { font-size:28px; font-family:'Playfair Display',serif; color:rgba(201,168,76,0.5); }
  @media print { body { background:#fff; } .cert { border-color:#c9a84c; background:#fff; color:#000; } h1,.name,.award,.year { color:#8b6914; } }
</style></head>
<body>
<div class="cert">
  <div class="logo">${SITE.name}</div>
  <h1>Certificate of Recognition</h1>
  <p class="presents">This is to certify that</p>
  <div class="name">${fullName}</div>
  <p class="org">${app.org_name ?? ''}</p>
  <p class="award-label">Has been recognised in the category of</p>
  <div class="award">${app.industry ?? 'Award of Excellence'}</div>
  <div class="footer">
    <div class="sig"><div class="sig-line" style="width:180px">Authorised Signatory</div></div>
    <div class="year">${year}</div>
    <div class="sig"><div class="sig-line" style="width:180px">Programme Director</div></div>
  </div>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
    win.document.close();
  }

  return (
    <BaseModal title="Certificate" onClose={onClose} maxW="max-w-lg">
      <div className="p-6 space-y-6">
        {/* Preview card */}
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-8 text-center space-y-3">
          <p className="text-[0.6rem] tracking-[4px] uppercase text-gold/60">{SITE.name}</p>
          <p className="font-display text-2xl font-semibold text-gold">Certificate of Recognition</p>
          <p className="text-xs text-white/40 uppercase tracking-widest">This is to certify that</p>
          <p className="font-display text-xl text-white border-b border-gold/30 pb-2 inline-block min-w-48">
            {`${app.first_name ?? ''} ${app.last_name ?? ''}`.trim() || 'Applicant'}
          </p>
          {app.org_name && <p className="text-sm text-white/60">{app.org_name}</p>}
          <p className="text-xs text-white/35 uppercase tracking-widest">has been recognised in the category of</p>
          <p className="font-display text-base text-gold">{app.industry ?? 'Award of Excellence'}</p>
          <p className="text-xs text-white/25 mt-4">{new Date().getFullYear()}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/50 hover:text-white transition-colors">
            Close
          </button>
          <button onClick={printCertificate}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink">
            <Printer className="h-4 w-4" /> Download / Print
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

/* ─── 3. Comments ───────────────────────────────────────────────────────── */
type Comment = { id: number; user_name: string; comment: string; created_at: string };

export function CommentsModal({ app, onClose, focusAdd = false }: { app: AppRecord; onClose: () => void; focusAdd?: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [saving, setSaving]     = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/organiser/application-comments?id=${app.id}`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [app.id]);

  useEffect(() => {
    if (focusAdd && textRef.current) textRef.current.focus();
  }, [focusAdd]);

  async function addComment() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/organiser/application-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: app.id, comment: text.trim() }),
      });
      const d = await res.json();
      if (d.ok) {
        setComments(prev => [d.comment, ...prev]);
        setText('');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <BaseModal title={`Comments — ${app.first_name ?? ''} ${app.last_name ?? ''}`.trim()} onClose={onClose} maxW="max-w-xl">
      <div className="p-6 space-y-5">
        {/* Add comment */}
        <div className="space-y-2">
          <textarea
            ref={textRef}
            value={text} onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Add a comment…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none resize-none"
          />
          <div className="flex justify-end">
            <button onClick={addComment} disabled={!text.trim() || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink disabled:opacity-40">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Post Comment
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-3">
          {loading ? <Loader /> : comments.length === 0 ? (
            <EmptyState text="No comments yet. Add the first one above." />
          ) : comments.map(c => (
            <div key={c.id} className="rounded-xl border border-white/6 bg-white/[0.03] p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gold/80">
                  <MessageSquare className="h-3 w-3" />{c.user_name}
                </span>
                <span className="text-[0.65rem] text-white/30">{c.created_at?.slice(0, 16).replace('T', ' ')}</span>
              </div>
              <p className="text-sm text-white/75 whitespace-pre-wrap">{c.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
}

/* ─── 4. Email Trail ────────────────────────────────────────────────────── */
type EmailRow = {
  id: number; subject: string; template_name: string;
  status: string; sent_at: string | null; delivered_at: string | null;
  opened_at: string | null; error: string | null;
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  sent:      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
  delivered: <CheckCircle className="h-3.5 w-3.5 text-blue-400" />,
  failed:    <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
  bounced:   <AlertCircle className="h-3.5 w-3.5 text-orange-400" />,
};

export function EmailTrailModal({ app, onClose }: { app: AppRecord; onClose: () => void }) {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app.email) { setLoading(false); return; }
    fetch(`/api/organiser/application-email-trail?email=${encodeURIComponent(app.email)}`)
      .then(r => r.json())
      .then(d => setEmails(d.emails ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [app.email]);

  return (
    <BaseModal title={`Email Trail — ${app.email ?? ''}`} onClose={onClose} maxW="max-w-2xl">
      <div className="p-6">
        {loading ? <Loader /> : emails.length === 0 ? (
          <EmptyState text="No emails have been sent to this applicant yet." />
        ) : (
          <div className="space-y-3">
            {emails.map(e => (
              <div key={e.id} className="rounded-xl border border-white/6 bg-white/[0.03] p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {STATUS_ICON[e.status] ?? <Mail className="h-3.5 w-3.5 text-white/40" />}
                    <span className="text-sm font-semibold text-white/80">{e.subject || e.template_name || 'Email'}</span>
                  </div>
                  <span className={`text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    e.status === 'sent' || e.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400' :
                    e.status === 'failed' || e.status === 'bounced'  ? 'bg-red-500/15 text-red-400' :
                    'bg-white/8 text-white/40'
                  }`}>{e.status}</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/35">
                  {e.sent_at      && <span>Sent: {e.sent_at.slice(0, 16).replace('T', ' ')}</span>}
                  {e.delivered_at && <span className="text-blue-400/60">Delivered: {e.delivered_at.slice(0, 16).replace('T', ' ')}</span>}
                  {e.opened_at    && <span className="text-emerald-400/60">Opened: {e.opened_at.slice(0, 16).replace('T', ' ')}</span>}
                  {e.error        && <span className="text-red-400/60">Error: {e.error}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

/* ─── 5. Score ──────────────────────────────────────────────────────────── */
type QuestionScore = { question_id: number; question_text: string; score: number };
type ScoreRow = {
  score: number; notes: string | null; scored_at: string;
  judge_first: string; judge_last: string; judge_email: string;
  questionScores: QuestionScore[];
};

export function ScoreModal({ app, onClose }: { app: AppRecord; onClose: () => void }) {
  const [data, setData] = useState<{ scores: ScoreRow[]; average: number | null; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!app.email) { setLoading(false); return; }
    fetch(`/api/organiser/application-score?email=${encodeURIComponent(app.email)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [app.email]);

  return (
    <BaseModal title={`Judge Scores — ${app.first_name ?? ''} ${app.last_name ?? ''}`.trim()} onClose={onClose} maxW="max-w-xl">
      <div className="p-6 space-y-5">
        {loading ? <Loader /> : !data || data.count === 0 ? (
          <EmptyState text="No judge scores recorded for this applicant yet." />
        ) : (
          <>
            {/* Average */}
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center space-y-1">
              <p className="text-xs uppercase tracking-widest text-white/40">Average Score</p>
              <p className="font-display text-5xl font-bold text-gold">{data.average}</p>
              <p className="text-xs text-white/30">out of 10 · {data.count} judge{data.count !== 1 ? 's' : ''}</p>
            </div>

            {/* Per-judge breakdown */}
            <div className="space-y-3">
              {data.scores.map((s, i) => {
                const hasQS = s.questionScores?.length > 0;
                const isOpen = expanded[i];
                return (
                  <div key={i} className="rounded-xl border border-white/6 bg-white/[0.03] overflow-hidden">
                    <div className="p-4 flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <span className="font-display text-xl font-bold text-gold">{s.score}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-gold/60" />
                          {s.judge_first} {s.judge_last}
                        </p>
                        {s.notes && <p className="text-xs text-white/45 mt-0.5 truncate">{s.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[0.65rem] text-white/30">{s.scored_at?.slice(0, 10)}</span>
                        {hasQS && (
                          <button
                            onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                            className="text-[0.65rem] text-gold/60 hover:text-gold underline"
                          >
                            {isOpen ? 'Hide' : `${s.questionScores.length} questions`}
                          </button>
                        )}
                      </div>
                    </div>
                    {hasQS && isOpen && (
                      <div className="border-t border-white/5 px-4 py-3 space-y-2 bg-white/[0.015]">
                        {s.questionScores.map((q) => (
                          <div key={q.question_id} className="flex items-start gap-3 text-xs">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/8 flex items-center justify-center font-bold text-gold">{q.score}</span>
                            <span className="text-white/55 leading-relaxed pt-0.5">{q.question_text}</span>
                          </div>
                        ))}
                        <p className="text-right text-[0.6rem] text-white/25 pt-1">
                          Total: {s.questionScores.reduce((a, q) => a + q.score, 0)} / {s.questionScores.length * 10}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}

/* ─── 6. Schedule ───────────────────────────────────────────────────────── */
type EventRow = { id: number; title: string; event_date: string | null; event_date_label: string | null; venue: string | null };

export function ScheduleModal({ app, onClose }: { app: AppRecord; onClose: () => void }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch('/api/organiser/events')
      .then(r => r.json())
      .then(d => setEvents(Array.isArray(d) ? d : d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/organiser/application-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: app.id, comment: `📅 Schedule note: ${note.trim()}` }),
      });
      if ((await res.json()).ok) { setSaved(true); setNote(''); }
    } finally { setSaving(false); }
  }

  return (
    <BaseModal title={`Book Schedule — ${app.first_name ?? ''} ${app.last_name ?? ''}`.trim()} onClose={onClose} maxW="max-w-xl">
      <div className="p-6 space-y-5">
        {/* Upcoming events */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-3">Upcoming Events</p>
          {loading ? <Loader /> : events.length === 0 ? (
            <EmptyState text="No upcoming events configured." />
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="rounded-xl border border-white/6 bg-white/[0.03] p-3 flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gold/60 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white/80">{e.title}</p>
                    <p className="text-xs text-white/40">
                      {e.event_date_label ?? e.event_date?.slice(0, 10) ?? 'Date TBC'}
                      {e.venue && ` · ${e.venue}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule note */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/35">Add Schedule Note</p>
          {saved ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="h-4 w-4" /> Note saved to comments.
            </div>
          ) : (
            <>
              <textarea
                value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder={`e.g. Confirmed attendance for ${app.first_name ?? 'applicant'} at the awards ceremony on 15 Nov…`}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none resize-none"
              />
              <div className="flex justify-end">
                <button onClick={saveNote} disabled={!note.trim() || saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink disabled:opacity-40">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Save Note
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

/* ─── Master dispatcher ─────────────────────────────────────────────────── */
export function ApplicationModal({
  type, app, onClose,
}: {
  type: ModalType;
  app: AppRecord;
  onClose: () => void;
}) {
  switch (type) {
    case 'preview':     return <PreviewModal     app={app} onClose={onClose} />;
    case 'certificate': return <CertificateModal app={app} onClose={onClose} />;
    case 'comments':    return <CommentsModal    app={app} onClose={onClose} />;
    case 'add-comment': return <CommentsModal    app={app} onClose={onClose} focusAdd />;
    case 'email-trail': return <EmailTrailModal  app={app} onClose={onClose} />;
    case 'schedule':    return <ScheduleModal    app={app} onClose={onClose} />;
    case 'score':       return <ScoreModal       app={app} onClose={onClose} />;
    default:            return null;
  }
}
