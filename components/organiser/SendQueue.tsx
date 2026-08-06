'use client';

// Send queue dashboard. Shows each job's progress and the configurable cadence
// settings. While any job is still active this polls the process endpoint so
// the queue advances even without the Vercel cron (which drives it in the
// background when this page is closed).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, BarChart3, Ban, CheckCircle2, Clock, Copy, Loader2, Pause, Play, Plus, RefreshCw, Save, Send } from 'lucide-react';

export type Job = {
  id: number;
  name: string;
  status: string;
  sent: number;
  failed: number;
  total: number;
  batchSize: number;
  intervalSeconds: number;
  nextRun: string | null;
  created: string;
  kind: string;
  parentJobId: number | null;
  enrollOpen: boolean;
  archived: boolean;
};
export type Settings = {
  batchSize: number;
  intervalSeconds: number;
  smallThreshold: number;
  smallGapSeconds: number;
  sendWindowEnabled: boolean;
  sendWindowStart: string;
  sendWindowEnd: string;
  remindersEnabled: boolean;
  reminderDefaultDelayMinutes: number;
};
/** One SMTP mailbox in the sending pool, as shown to the browser (no password). */
export type SmtpAccountView = {
  host: string;
  port: number;
  user: string;
  secure: boolean;
  from: string;
  hasPass: boolean;
};
/** Editable account row in the provider form. `pass` blank = keep stored. */
type SmtpAccountDraft = {
  host: string;
  port: number;
  user: string;
  secure: boolean;
  from: string;
  pass: string;
  hasPass: boolean;
};
export type EmailConfigView = {
  provider: '' | 'resend' | 'mailgun' | 'smtp';
  from: string;
  replyTo: string;
  mailgunDomain: string;
  mailgunRegion: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  hasResendKey: boolean;
  hasMailgunKey: boolean;
  hasSmtpPass: boolean;
  /** SMTP sending pool (passwords never leave the server). */
  smtpAccounts: SmtpAccountView[];
  trackOpens: boolean;
  trackClicks: boolean;
  hasResendWebhookSecret: boolean;
  hasMailgunWebhookSigningKey: boolean;
  baseUrl: string;
};

const num = 'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none';

export function SendQueue({
  jobs,
  settings,
  emailConfig,
  autoPaused = false,
}: {
  jobs: Job[];
  settings: Settings;
  emailConfig: EmailConfigView;
  autoPaused?: boolean;
}) {
  const router = useRouter();
  // While auto-paused (outside the send window) nothing sends, so stop polling.
  const active = !autoPaused && jobs.some((j) => !j.archived && (j.status === 'queued' || j.status === 'sending'));
  const busyRef = useRef(false);
  const [processing, setProcessing] = useState(false);

  // Tabs: in-flight (Active), finished (Done), and Archived.
  const [tab, setTab] = useState<'active' | 'done' | 'archived'>('active');
  const buckets = {
    active: jobs.filter((j) => !j.archived && j.status !== 'done'),
    done: jobs.filter((j) => !j.archived && j.status === 'done'),
    archived: jobs.filter((j) => j.archived),
  };
  const shown = buckets[tab];
  const TABS: { key: 'active' | 'done' | 'archived'; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'done', label: 'Done' },
    { key: 'archived', label: 'Archived' },
  ];

  const processNow = async () => {
    setProcessing(true);
    try {
      await fetch('/api/organiser/email-jobs/process', { method: 'POST' });
      router.refresh();
    } finally {
      setProcessing(false);
    }
  };

  // Drive the queue while the page is open and something is in flight.
  useEffect(() => {
    if (!active) return;
    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch('/api/organiser/email-jobs/process', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.processed) && data.processed.length > 0) router.refresh();
      } catch {
        /* ignore — try again next tick */
      } finally {
        busyRef.current = false;
      }
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [active, router]);

  return (
    <div className="space-y-6">
      <EmailProviderForm config={emailConfig} />
      <SettingsForm settings={settings} />

      {autoPaused && settings.sendWindowEnabled && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <p>
            Sending is auto-paused right now — outside the {settings.sendWindowStart}–{settings.sendWindowEnd} UK
            send window. Queued campaigns will resume automatically at {settings.sendWindowStart}.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Jobs</h2>
          {jobs.length > 0 && (
            <button type="button" onClick={processNow} disabled={processing} className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-gold/40 disabled:opacity-60">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-gold" />}
              Process now
            </button>
          )}
        </div>
        {jobs.length === 0 ? (
          <div className="rounded-3xl glass px-6 py-12 text-center text-sm text-white/55">
            No sends yet. Queue one from <span className="text-gold">Potential Users</span>.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => {
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      on
                        ? 'border-gold/60 bg-gold/[0.12] text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-gold/40 hover:text-white'
                    }`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 text-[0.65rem] ${on ? 'bg-gold/20 text-white' : 'bg-white/10 text-white/55'}`}>
                      {buckets[t.key].length}
                    </span>
                  </button>
                );
              })}
            </div>
            {shown.length === 0 ? (
              <div className="rounded-3xl glass px-6 py-12 text-center text-sm text-white/55">
                {tab === 'archived'
                  ? 'No archived jobs. Archive a completed job to tuck it away here.'
                  : tab === 'done'
                    ? 'No completed jobs yet.'
                    : 'No active jobs. Queue one from Potential Users.'}
              </div>
            ) : (
              shown.map((j) => <JobRow key={j.id} job={j} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const pct = job.total ? Math.round(((job.sent + job.failed) / job.total) * 100) : 0;
  const done = job.status === 'done';
  const paused = job.status === 'paused';
  // Active jobs (queued/sending) can be paused; paused jobs can be resumed.
  const canPause = job.status === 'queued' || job.status === 'sending';
  const perHour = Math.floor((Math.max(1, job.batchSize) * 3600) / Math.max(1, job.intervalSeconds));

  const toggle = async (action: 'pause' | 'resume' | 'archive' | 'unarchive', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/organiser/email-jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link
      href={`/organiser/email-jobs/${job.id}`}
      className="block rounded-2xl glass p-5 transition-colors hover:border-gold/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-white">{job.name || `Job #${job.id}`}</p>
          <p className="text-xs text-white/45">
            Queued {job.created} · {job.batchSize} every {job.intervalSeconds}s · about {perHour.toLocaleString()} emails/hour
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
            job.kind === 'reminder'
              ? 'border-sky-300/40 bg-sky-400/10 text-sky-100'
              : 'border-white/15 bg-white/[0.03] text-white/65'
          }`}>
            {job.kind === 'reminder' ? 'Reminder' : 'Campaign'}
          </span>
          {(canPause || paused) && (
            <button
              type="button"
              onClick={(e) => toggle(paused ? 'resume' : 'pause', e)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-gold/40 hover:text-white disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : paused ? (
                <Play className="h-3.5 w-3.5 text-gold" />
              ) : (
                <Pause className="h-3.5 w-3.5 text-gold" />
              )}
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          {(done || job.archived) && (
            <button
              type="button"
              onClick={(e) => toggle(job.archived ? 'unarchive' : 'archive', e)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-gold/40 hover:text-white disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : job.archived ? (
                <ArchiveRestore className="h-3.5 w-3.5 text-gold" />
              ) : (
                <Archive className="h-3.5 w-3.5 text-gold" />
              )}
              {job.archived ? 'Unarchive' : 'Archive'}
            </button>
          )}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${done ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : paused ? 'border-amber-400/40 bg-amber-500/10 text-amber-200' : 'border-gold/40 bg-gold/10 text-white'}`}>
            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : paused ? <Pause className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {done ? 'Done' : paused ? 'Paused' : job.status === 'sending' ? 'Sending' : 'Queued'}
          </span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gold-gradient transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-white/55">
        {job.sent} sent{job.failed > 0 && <span className="text-red-300"> · {job.failed} failed</span>} · {job.total} total ({pct}%)
        {!done && !paused && job.nextRun && <span className="text-white/40"> · next batch {job.nextRun}</span>}
        {paused && <span className="text-amber-200/70"> · paused</span>}
        {job.enrollOpen && <span className="text-sky-200/75"> · enrolling</span>}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
          <BarChart3 className="h-3.5 w-3.5" /> View stats &amp; recipients →
        </p>
        {job.kind === 'reminder' && job.parentJobId && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/organiser/email-jobs/${job.parentJobId}`);
            }}
            className="text-xs font-semibold text-white/50 underline-offset-4 hover:text-white hover:underline"
          >
            Parent campaign
          </button>
        )}
      </div>
    </Link>
  );
}

function EmailProviderForm({ config }: { config: EmailConfigView }) {
  const router = useRouter();
  const [provider, setProvider] = useState(config.provider);
  const [from, setFrom] = useState(config.from);
  const [replyTo, setReplyTo] = useState(config.replyTo);
  const [mgDomain, setMgDomain] = useState(config.mailgunDomain);
  const [mgRegion, setMgRegion] = useState(config.mailgunRegion);
  // SMTP sending pool. Seeded from the saved accounts, or — for an existing
  // single-mailbox setup — from the legacy smtp_* fields as one row.
  const [accounts, setAccounts] = useState<SmtpAccountDraft[]>(() => {
    if (config.smtpAccounts.length) {
      return config.smtpAccounts.map((a) => ({ ...a, pass: '' }));
    }
    if (config.smtpHost && config.smtpUser) {
      return [{
        host: config.smtpHost, port: config.smtpPort, user: config.smtpUser,
        secure: config.smtpSecure, from: '', pass: '', hasPass: config.hasSmtpPass,
      }];
    }
    return [{ host: '', port: 587, user: '', secure: false, from: '', pass: '', hasPass: false }];
  });
  const patchAccount = (i: number, patch: Partial<SmtpAccountDraft>) =>
    setAccounts((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const addAccount = () =>
    setAccounts((prev) => [...prev, { host: '', port: 587, user: '', secure: false, from: '', pass: '', hasPass: false }]);
  const removeAccount = (i: number) =>
    setAccounts((prev) => prev.filter((_, idx) => idx !== i));
  // Secrets — blank means "keep existing".
  const [resendKey, setResendKey] = useState('');
  const [mgKey, setMgKey] = useState('');
  const [resendWebhookSecret, setResendWebhookSecret] = useState('');
  const [mgWebhookKey, setMgWebhookKey] = useState('');
  const [trackOpens, setTrackOpens] = useState(config.trackOpens);
  const [trackClicks, setTrackClicks] = useState(config.trackClicks);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);

  const save = async () => {
    setBusy(true);
    setToast(null);
    try {
      const body: Record<string, unknown> = { provider, from, replyTo, trackOpens, trackClicks };
      if (provider === 'resend') {
        if (resendKey.trim()) body.resendApiKey = resendKey.trim();
        if (resendWebhookSecret.trim()) body.resendWebhookSecret = resendWebhookSecret.trim();
      }
      if (provider === 'mailgun') {
        body.mailgunDomain = mgDomain;
        body.mailgunRegion = mgRegion;
        if (mgKey.trim()) body.mailgunApiKey = mgKey.trim();
        if (mgWebhookKey.trim()) body.mailgunWebhookSigningKey = mgWebhookKey.trim();
      }
      if (provider === 'smtp') {
        // Send the whole pool. A blank password is preserved server-side
        // (matched by username) so we never round-trip stored secrets.
        body.smtpAccounts = accounts
          .filter((a) => a.host.trim() && a.user.trim())
          .map((a) => ({
            host: a.host.trim(),
            port: a.port,
            user: a.user.trim(),
            secure: a.secure,
            from: a.from.trim(),
            pass: a.pass.trim(),
          }));
      }
      const res = await fetch('/api/organiser/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { setToast({ ok: false, msg: 'Could not save provider settings.' }); return; }
      setResendKey(''); setMgKey(''); setResendWebhookSecret(''); setMgWebhookKey('');
      setAccounts((prev) => prev.map((a) => ({ ...a, pass: '', hasPass: a.hasPass || a.pass.trim().length > 0 })));
      setToast({ ok: true, msg: 'Provider settings saved.' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setToast(null);
    try {
      const res = await fetch('/api/organiser/email-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: testTo }) });
      const data = await res.json().catch(() => ({}));
      setToast({ ok: res.ok, msg: res.ok ? data.message : data.error || 'Test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const secretPh = (set: boolean) => (set ? 'Configured — leave blank to keep' : 'Not set');

  return (
    <div className="rounded-3xl glass p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-white">Email provider</h2>
      <p className="mt-1 text-sm text-white/55">
        Choose how emails are sent. Leave on “Default” to use server environment variables. Secrets are stored securely and never shown again.
      </p>

      {toast && (
        <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm ${toast.ok ? 'border-gold/30 bg-gold/[0.06] text-white/85' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
          {toast.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" /> : <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Labeled label="Provider">
          <select value={provider} onChange={(e) => setProvider(e.target.value as EmailConfigView['provider'])} className={`${num} [&_option]:bg-ink`}>
            <option value="">Default (environment)</option>
            <option value="resend">Resend (API)</option>
            <option value="mailgun">Mailgun (API)</option>
            <option value="smtp">SMTP</option>
          </select>
        </Labeled>
        <Labeled label="From address">
          <input className={num} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Awards <noreply@yourdomain.com>" />
        </Labeled>
        <Labeled label="Reply-to address (optional)">
          <input className={num} value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="hello@yourdomain.com" />
        </Labeled>

        {provider === 'resend' && (
          <>
            <Labeled label="Resend API key">
              <input type="password" autoComplete="off" className={num} value={resendKey} onChange={(e) => setResendKey(e.target.value)} placeholder={secretPh(config.hasResendKey)} />
            </Labeled>
            <Labeled label="Resend webhook signing secret">
              <input type="password" autoComplete="off" className={num} value={resendWebhookSecret} onChange={(e) => setResendWebhookSecret(e.target.value)} placeholder={secretPh(config.hasResendWebhookSecret)} />
            </Labeled>
            <div className="sm:col-span-2"><WebhookHint url={`${config.baseUrl}/api/webhooks/resend`} provider="Resend" /></div>
          </>
        )}

        {provider === 'mailgun' && (
          <>
            <Labeled label="Mailgun API key">
              <input type="password" autoComplete="off" className={num} value={mgKey} onChange={(e) => setMgKey(e.target.value)} placeholder={secretPh(config.hasMailgunKey)} />
            </Labeled>
            <Labeled label="Mailgun domain">
              <input className={num} value={mgDomain} onChange={(e) => setMgDomain(e.target.value)} placeholder="mg.yourdomain.com" />
            </Labeled>
            <Labeled label="Mailgun region">
              <select value={mgRegion} onChange={(e) => setMgRegion(e.target.value)} className={`${num} [&_option]:bg-ink`}>
                <option value="us">US</option>
                <option value="eu">EU</option>
              </select>
            </Labeled>
            <Labeled label="Mailgun webhook signing key">
              <input type="password" autoComplete="off" className={num} value={mgWebhookKey} onChange={(e) => setMgWebhookKey(e.target.value)} placeholder={secretPh(config.hasMailgunWebhookSigningKey)} />
            </Labeled>
            <div className="sm:col-span-2"><WebhookHint url={`${config.baseUrl}/api/webhooks/mailgun`} provider="Mailgun" /></div>
          </>
        )}

        {provider === 'smtp' && (
          <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/55">
            Raw SMTP can report <span className="text-white/80">sent, opens and clicks</span> (tracked by us), but
            not delivery or bounces. For bounce/complaint data, send via Resend or Mailgun.
          </div>
        )}

        {/* Engagement tracking — works on every provider, including SMTP. */}
        <div className="sm:col-span-2 flex flex-wrap gap-5 border-t border-white/10 pt-4">
          <label className="flex items-center gap-2 text-sm text-white/75">
            <input type="checkbox" checked={trackOpens} onChange={(e) => setTrackOpens(e.target.checked)} className="h-4 w-4 accent-[#caa24a]" />
            Track opens (tracking pixel)
          </label>
          <label className="flex items-center gap-2 text-sm text-white/75">
            <input type="checkbox" checked={trackClicks} onChange={(e) => setTrackClicks(e.target.checked)} className="h-4 w-4 accent-[#caa24a]" />
            Track clicks (link wrapping)
          </label>
        </div>

        {provider === 'smtp' && (
          <div className="sm:col-span-2 space-y-4 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">SMTP sending accounts</h3>
                <p className="mt-0.5 text-xs text-white/55">
                  Add multiple mailboxes to split large sends. Recipients are divided evenly
                  and sent in parallel — e.g. 8,000 emails across 4 accounts = ~2,000 each, at once.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
                {accounts.length} account{accounts.length === 1 ? '' : 's'}
              </span>
            </div>

            {accounts.map((a, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-luxe text-gold">
                    Account {i + 1}{i === 0 ? ' · primary' : ''}
                  </span>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAccount(i)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-400/40 px-2.5 py-1 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      <Ban className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Labeled label="SMTP host"><input className={num} value={a.host} onChange={(e) => patchAccount(i, { host: e.target.value })} placeholder="smtp.yourhost.com" /></Labeled>
                  <Labeled label="SMTP port"><input type="number" className={num} value={a.port} onChange={(e) => patchAccount(i, { port: Number(e.target.value) })} /></Labeled>
                  <Labeled label="SMTP username"><input className={num} value={a.user} onChange={(e) => patchAccount(i, { user: e.target.value })} autoComplete="off" placeholder="mailbox@yourdomain.com" /></Labeled>
                  <Labeled label="SMTP password"><input type="password" autoComplete="off" className={num} value={a.pass} onChange={(e) => patchAccount(i, { pass: e.target.value })} placeholder={secretPh(a.hasPass)} /></Labeled>
                  <Labeled label="From address (optional)"><input className={num} value={a.from} onChange={(e) => patchAccount(i, { from: e.target.value })} placeholder={from || 'Awards <mailbox@yourdomain.com>'} /></Labeled>
                  <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-white/75">
                    <input type="checkbox" checked={a.secure} onChange={(e) => patchAccount(i, { secure: e.target.checked })} className="h-4 w-4 accent-[#caa24a]" />
                    TLS/SSL (port 465)
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addAccount}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-gold/40 hover:text-white"
            >
              <Plus className="h-4 w-4" /> Add sending account
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save provider
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-white/10 pt-5">
        <div className="min-w-[220px] flex-1">
          <Labeled label="Send a test email to">
            <input className={num} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
          </Labeled>
        </div>
        <button type="button" onClick={test} disabled={testing || !testTo} className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-gold/40 disabled:opacity-60">
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-gold" />} Send test
        </button>
      </div>
    </div>
  );
}

function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => { setSaved(false); setS((v) => ({ ...v, [k]: Number(e.target.value) })); };
  const largePerHour = Math.floor((Math.max(1, s.batchSize) * 3600) / Math.max(1, s.intervalSeconds));
  const smallPerHour = Math.floor(3600 / Math.max(1, s.smallGapSeconds));

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/organiser/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      if (res.ok) { setSaved(true); router.refresh(); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl glass p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-white">Send cadence</h2>
      <p className="mt-1 text-sm text-white/55">
        Small lists (≤ threshold) send one-by-one with the short gap. Larger lists send in batches on the interval.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Labeled label="Small list threshold"><input type="number" min={1} className={num} value={s.smallThreshold} onChange={set('smallThreshold')} /></Labeled>
        <Labeled label="Small list gap (seconds)"><input type="number" min={1} className={num} value={s.smallGapSeconds} onChange={set('smallGapSeconds')} /></Labeled>
        <Labeled label="Batch size (large lists)"><input type="number" min={1} className={num} value={s.batchSize} onChange={set('batchSize')} /></Labeled>
        <Labeled label="Interval (seconds)"><input type="number" min={10} className={num} value={s.intervalSeconds} onChange={set('intervalSeconds')} /></Labeled>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-white/45">Small-list pace</p>
          <p className="mt-1 font-display text-xl font-semibold text-white">{smallPerHour.toLocaleString()} emails/hour</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-white/45">Large-list pace</p>
          <p className="mt-1 font-display text-xl font-semibold text-white">{largePerHour.toLocaleString()} emails/hour</p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            checked={s.sendWindowEnabled}
            onChange={(e) => { setSaved(false); setS((v) => ({ ...v, sendWindowEnabled: e.target.checked })); }}
            className="h-4 w-4 accent-[#caa24a]"
          />
          Auto-pause outside a daily send window (UK time)
        </label>
        <p className="mt-1 text-xs text-white/50">
          When on, every campaign only sends between these times and pauses automatically outside them
          (handles BST/GMT). For an overnight window, set start later than end.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Labeled label="Resume at (start)">
            <input
              type="time"
              disabled={!s.sendWindowEnabled}
              className={`${num} disabled:opacity-50`}
              value={s.sendWindowStart}
              onChange={(e) => { setSaved(false); setS((v) => ({ ...v, sendWindowStart: e.target.value })); }}
            />
          </Labeled>
          <Labeled label="Pause at (end)">
            <input
              type="time"
              disabled={!s.sendWindowEnabled}
              className={`${num} disabled:opacity-50`}
              value={s.sendWindowEnd}
              onChange={(e) => { setSaved(false); setS((v) => ({ ...v, sendWindowEnd: e.target.value })); }}
            />
          </Labeled>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            checked={s.remindersEnabled}
            onChange={(e) => { setSaved(false); setS((v) => ({ ...v, remindersEnabled: e.target.checked })); }}
            className="h-4 w-4 accent-[#caa24a]"
          />
          Process automated reminder flows
        </label>
        <p className="mt-1 text-xs text-white/50">
          When on, the queue worker enrolls eligible recipients into any reminder flow attached to a campaign.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Labeled label="Default reminder delay (minutes)">
            <input
              type="number"
              min={1}
              max={43200}
              className={num}
              value={s.reminderDefaultDelayMinutes}
              onChange={set('reminderDefaultDelayMinutes')}
            />
          </Labeled>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
        </button>
        {saved && <span className="inline-flex items-center gap-1.5 text-sm text-white/70"><CheckCircle2 className="h-4 w-4 text-gold" /> Saved</span>}
      </div>
    </div>
  );
}

function WebhookHint({ url, provider }: { url: string; provider: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-white/55">
        Add this {provider} webhook (delivered / bounced / complained events), then paste its signing
        secret above:
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-gold">
          {url || '(set PUBLIC_BASE_URL to show the full URL)'}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 hover:border-gold/40 hover:text-white"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-gold" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">{label}</span>
      {children}
    </label>
  );
}
