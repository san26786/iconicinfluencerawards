import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getBrandConfig } from '@/lib/email/brand';
import { ukMinutesNow, parseHHMM, isWithinWindow } from '@/lib/email/sendWindow';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { SendQueue, type Job, type Settings, type EmailConfigView, type SmtpAccountView } from '@/components/organiser/SendQueue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Send Queue' };

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});
const fmt = (d: Date | string | null) => (d ? timeFmt.format(new Date(d)) : null);

// Shape the stored smtp_accounts JSON for the browser: never expose passwords,
// only whether each account has one set.
function smtpAccountsView(raw: unknown): SmtpAccountView[] {
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  const out: SmtpAccountView[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const a = item as Record<string, unknown>;
    const host = typeof a.host === 'string' ? a.host : '';
    const user = typeof a.user === 'string' ? a.user : '';
    if (!host || !user) continue;
    out.push({
      host,
      user,
      port: Number(a.port) || 587,
      secure: a.secure === true,
      from: typeof a.from === 'string' ? a.from : '',
      hasPass: typeof a.pass === 'string' && a.pass.length > 0,
    });
  }
  return out;
}

export default async function EmailJobsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const [jobsRes, setRes] = await Promise.all([
    query<{
      id: number;
      name: string | null;
      status: string;
      sent_count: number;
      fail_count: number;
      total: number;
      batch_size: number;
      interval_seconds: number;
      next_run_at: Date | null;
      created_at: Date;
      kind: string;
      parent_job_id: number | null;
      enroll_open: boolean;
      archived_at: Date | null;
    }>(`SELECT id, name, status, sent_count, fail_count, total, batch_size, interval_seconds, next_run_at, created_at,
              kind, parent_job_id, enroll_open, archived_at
        FROM email_jobs ORDER BY created_at DESC LIMIT 100`),
    query<{
      email_batch_size: number;
      email_interval_seconds: number;
      email_small_threshold: number;
      email_small_gap_seconds: number;
      email_provider: string;
      email_from: string;
      email_reply_to: string;
      resend_api_key: string;
      mailgun_api_key: string;
      mailgun_domain: string;
      mailgun_region: string;
      smtp_host: string;
      smtp_port: number;
      smtp_user: string;
      smtp_pass: string;
      smtp_secure: boolean;
      smtp_accounts: unknown;
      resend_webhook_secret: string;
      mailgun_webhook_signing_key: string;
      track_opens: boolean;
      track_clicks: boolean;
      send_window_enabled: boolean;
      send_window_start: string;
      send_window_end: string;
      reminders_enabled: boolean;
      reminder_default_delay_minutes: number;
    }>('SELECT * FROM app_settings WHERE id=1'),
  ]);

  const jobs: Job[] = jobsRes.rows.map((j) => ({
    id: j.id,
    name: j.name ?? '',
    status: j.status,
    sent: j.sent_count,
    failed: j.fail_count,
    total: j.total,
    batchSize: j.batch_size,
    intervalSeconds: j.interval_seconds,
    nextRun: fmt(j.next_run_at),
    created: fmt(j.created_at) ?? '',
    kind: j.kind || 'campaign',
    parentJobId: j.parent_job_id,
    enrollOpen: j.enroll_open,
    archived: !!j.archived_at,
  }));

  const s = setRes.rows[0];
  const settings: Settings = {
    batchSize: s.email_batch_size,
    intervalSeconds: s.email_interval_seconds,
    smallThreshold: s.email_small_threshold,
    smallGapSeconds: s.email_small_gap_seconds,
    sendWindowEnabled: s.send_window_enabled,
    sendWindowStart: s.send_window_start,
    sendWindowEnd: s.send_window_end,
    remindersEnabled: s.reminders_enabled,
    reminderDefaultDelayMinutes: s.reminder_default_delay_minutes,
  };
  // Is the queue auto-paused right now (outside the configured UK send window)?
  const autoPaused =
    s.send_window_enabled &&
    !isWithinWindow(
      ukMinutesNow(),
      parseHHMM(s.send_window_start, 540),
      parseHHMM(s.send_window_end, 1110),
    );
  // Never send secrets to the browser — only whether each is configured.
  const emailConfig: EmailConfigView = {
    provider: (s.email_provider || '') as EmailConfigView['provider'],
    from: s.email_from || '',
    replyTo: s.email_reply_to || '',
    mailgunDomain: s.mailgun_domain || '',
    mailgunRegion: s.mailgun_region || 'us',
    smtpHost: s.smtp_host || '',
    smtpPort: s.smtp_port || 587,
    smtpUser: s.smtp_user || '',
    smtpSecure: !!s.smtp_secure,
    smtpAccounts: smtpAccountsView(s.smtp_accounts),
    hasResendKey: !!s.resend_api_key,
    hasMailgunKey: !!s.mailgun_api_key,
    hasSmtpPass: !!s.smtp_pass,
    trackOpens: s.track_opens ?? true,
    trackClicks: s.track_clicks ?? true,
    hasResendWebhookSecret: !!s.resend_webhook_secret,
    hasMailgunWebhookSigningKey: !!s.mailgun_webhook_signing_key,
    // Base URL for the webhook endpoints shown to copy into Resend/Mailgun.
    baseUrl: (process.env.PUBLIC_BASE_URL || getBrandConfig().siteUrl || '').replace(/\/$/, ''),
  };

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-4xl">
        <OrganiserNav />
        <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Organiser</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Send Queue</h1>
        <p className="mb-6 mt-2 text-sm text-white/55">
          Track outgoing email jobs. This page advances the queue while open; a background cron handles it otherwise.
        </p>
        <SendQueue jobs={jobs} settings={settings} emailConfig={emailConfig} autoPaused={autoPaused} />
      </div>
    </main>
  );
}
