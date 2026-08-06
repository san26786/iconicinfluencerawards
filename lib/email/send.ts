// Provider-agnostic email sender. Supports Resend and Mailgun behind one
// interface so callers (lib/email/nomination.ts, lib/email/contact.ts) never
// care which backend is actually flying the message.
//
// =====================================================================
// Provider selection
// =====================================================================
//
//   EMAIL_PROVIDER = "resend"  (default — kept for backwards-compat)
//                  | "mailgun"
//
// Switching providers is a Vercel env var change + a redeploy. Nothing
// in the application code has to change.
//
// =====================================================================
// Required env vars — RESEND
// =====================================================================
//
//   RESEND_API_KEY       — secret key from https://resend.com/api-keys
//   EMAIL_FROM           — friendly From: header, sender domain MUST be
//                          verified in Resend (SPF + DKIM)
//
// =====================================================================
// Required env vars — MAILGUN
// =====================================================================
//
//   MAILGUN_API_KEY      — Private API key from
//                          https://app.mailgun.com/settings/api_security
//   MAILGUN_DOMAIN       — Sending domain registered in Mailgun
//                          (e.g. "mg.southenglandawards.com")
//   EMAIL_FROM           — friendly From: header. The address must be on
//                          MAILGUN_DOMAIN (or a verified subdomain)
//
//   Optional:
//   MAILGUN_REGION       — "us" (default) or "eu". The EU region uses a
//                          different API base (api.eu.mailgun.net).
//
// =====================================================================
// Optional env vars (apply to both providers)
// =====================================================================
//
//   EMAIL_BCC            — comma-separated audit/archive list
//   EMAIL_REPLY_TO       — global override; per-message replyTo wins
//   EMAIL_DRY_RUN        — "true" → log payload instead of calling the
//                           API. Useful for first verifications before
//                           turning on real sends.

// mailgun.js (~412 KB ESM) and its form-data peer are dynamic-imported on
// demand instead of statically imported. Default EMAIL_PROVIDER is 'resend',
// so on a typical send neither bundle is touched and serverless cold starts
// stay lean. Types are pulled in via `import type` (zero runtime cost) so
// the precise MailgunClient typing is preserved.
import type MailgunType from 'mailgun.js';
import { Resend } from 'resend';
import type { Transporter } from 'nodemailer';
import { getEmailConfig, type EmailConfig, type EmailProvider, type SmtpAccount } from './config';

type MailgunClient = ReturnType<InstanceType<typeof MailgunType>['client']>;

/* ---------- Public types ---------- */

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  /** Plaintext alternative — improves deliverability and accessibility. */
  text?: string;
  /** Per-message Reply-To. Overrides the EMAIL_REPLY_TO env. */
  replyTo?: string;
  /** Per-message override for the From header. */
  from?: string;
  /** Per-message BCC. Combined with EMAIL_BCC if both set. */
  bcc?: string | string[];
  /**
   * Resend Idempotency-Key (≤256 chars, 24h dedupe window). Pass a stable
   * per-attempt key when retrying so we don't double-send on transient
   * failures. Resend honours it natively; Mailgun has no equivalent so the
   * value is silently ignored on that path.
   */
  idempotencyKey?: string;
  /** Extra headers (e.g. List-Unsubscribe). Passed through on every provider. */
  headers?: Record<string, string>;
  /**
   * The tenant site this message belongs to. When set, sending prefers that
   * site's own SMTP mailbox (site_email_settings) over the platform default,
   * so the message goes out from — and is branded as — the site the
   * recipient actually interacted with. Omit for platform-level messages
   * (e.g. hub-wide notices) or when no site context exists (webhooks).
   */
  siteId?: number;
};

export type SendResult =
  | {
      ok: true;
      messageId: string;
      provider: EmailProvider;
      /** SMTP mailbox (username) that sent it — set only on the SMTP pool path. */
      account?: string;
    }
  | {
      ok: false;
      error: string;
      reason: 'no_api_key' | 'send_error' | 'dry_run' | 'thrown';
      provider: EmailProvider;
    };

/* ---------- Helpers shared between providers ---------- */

function combineBcc(perMessage?: string | string[]): string[] {
  const envBcc = process.env.EMAIL_BCC?.trim();
  const envList = envBcc
    ? envBcc.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const msgList = Array.isArray(perMessage)
    ? perMessage
    : perMessage
    ? [perMessage]
    : [];
  return Array.from(new Set([...envList, ...msgList]));
}

function toRecipientList(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/* ---------- Resend backend ---------- */

let cachedResend: { key: string; client: Resend } | null = null;

function getResendClient(key: string): Resend | null {
  if (!key) return null;
  if (!cachedResend || cachedResend.key !== key) cachedResend = { key, client: new Resend(key) };
  return cachedResend.client;
}

async function sendViaResend(
  args: SendArgs,
  from: string,
  replyTo: string | undefined,
  bcc: string[],
  apiKey: string,
): Promise<SendResult> {
  const client = getResendClient(apiKey);
  if (!client) {
    console.warn(
      '[email/send] RESEND_API_KEY not configured — skipping send to',
      args.to,
    );
    return {
      ok: false,
      error: 'resend_api_key_not_set',
      reason: 'no_api_key',
      provider: 'resend',
    };
  }

  try {
    // Resend's emails.send accepts both camelCase and snake_case keys; we
    // use camelCase throughout. The optional idempotencyKey is passed as
    // the second argument and becomes the Idempotency-Key header (24h
    // dedupe window).
    const sendOpts: Parameters<typeof client.emails.send>[1] | undefined =
      args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : undefined;

    const { data, error } = await client.emails.send(
      {
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        replyTo,
        bcc: bcc.length ? bcc : undefined,
        headers: args.headers,
      },
      sendOpts,
    );

    if (error) {
      console.error('[email/send] resend error', error.name, error.message);
      return {
        ok: false,
        error: error.message,
        reason: 'send_error',
        provider: 'resend',
      };
    }
    return { ok: true, messageId: data?.id ?? '', provider: 'resend' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[email/send] resend threw to', args.to, '—', msg);
    return { ok: false, error: msg, reason: 'thrown', provider: 'resend' };
  }
}

/* ---------- Mailgun backend ---------- */

// Mailgun client is constructed lazily because:
//   - We only want to instantiate it when EMAIL_PROVIDER === 'mailgun'
//   - Construction reads env (region, key) which can change between cold
//     starts; caching the resolved client across warm invocations is fine
type MailgunCacheEntry = {
  key: string;
  domain: string;
  region: string;
  client: MailgunClient;
};
let cachedMailgun: MailgunCacheEntry | null = null;

// Async because mailgun.js + form-data are dynamic-imported on first use.
// The cost is paid exactly once per warm Lambda; subsequent calls hit
// the cachedMailgun branch and the await resolves synchronously.
async function getMailgunClient(
  mg: EmailConfig['mailgun'],
): Promise<{ client: MailgunClient; domain: string } | null> {
  const key = mg.apiKey;
  const domain = mg.domain;
  if (!key || !domain) return null;

  const region = (mg.region || 'us').toLowerCase();
  const url =
    region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';

  if (
    cachedMailgun &&
    cachedMailgun.key === key &&
    cachedMailgun.domain === domain &&
    cachedMailgun.region === region
  ) {
    return { client: cachedMailgun.client, domain: cachedMailgun.domain };
  }

  // Load Mailgun + form-data lazily — only when this branch executes.
  // Resend-default deployments never touch this code path and thus never
  // pull these modules into the function bundle.
  const [{ default: Mailgun }, { default: formData }] = await Promise.all([
    import('mailgun.js'),
    import('form-data'),
  ]);

  const mailgun = new Mailgun(formData);
  const client = mailgun.client({ username: 'api', key, url });
  cachedMailgun = { key, domain, region, client };
  return { client, domain };
}

async function sendViaMailgun(
  args: SendArgs,
  from: string,
  replyTo: string | undefined,
  bcc: string[],
  mg: EmailConfig['mailgun'],
): Promise<SendResult> {
  const ctx = await getMailgunClient(mg);
  if (!ctx) {
    console.warn(
      '[email/send] Mailgun env not configured (MAILGUN_API_KEY/MAILGUN_DOMAIN) — skipping send to',
      args.to,
    );
    return {
      ok: false,
      error: 'mailgun_env_not_set',
      reason: 'no_api_key',
      provider: 'mailgun',
    };
  }

  try {
    // Mailgun expects a flat object. Reply-To, custom headers and bcc all
    // ride along as top-level keys. The `to` field accepts an array.
    //
    // We avoid Mailgun's "recipient-variables" templating because all
    // our messages are individually rendered server-side already.
    const message: Parameters<
      MailgunClient['messages']['create']
    >[1] = {
      from,
      to: toRecipientList(args.to),
      subject: args.subject,
      html: args.html,
      ...(args.text ? { text: args.text } : {}),
      ...(replyTo ? { 'h:Reply-To': replyTo } : {}),
      ...(bcc.length ? { bcc } : {}),
      // Custom headers ride along as Mailgun "h:" prefixed keys.
      ...(args.headers
        ? Object.fromEntries(Object.entries(args.headers).map(([k, v]) => [`h:${k}`, v]))
        : {}),
    };

    const response = await ctx.client.messages.create(ctx.domain, message);

    // Mailgun returns { id: '<...>', message: 'Queued. Thank you.', status: 200 }
    // on success. `id` is a Message-Id wrapped in angle brackets.
    const messageId = response?.id ?? '';
    return { ok: true, messageId, provider: 'mailgun' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[email/send] mailgun threw to', args.to, '—', msg);
    return { ok: false, error: msg, reason: 'thrown', provider: 'mailgun' };
  }
}

/* ---------- SMTP backend (nodemailer) ---------- */

// nodemailer is dynamic-imported on first SMTP send so non-SMTP deployments
// never pull it into the function bundle. One pooled transporter is cached PER
// ACCOUNT (keyed by its settings signature) so a multi-mailbox sending pool can
// hold open connections to every host at once and send in parallel.
const smtpTransporters = new Map<string, Transporter>();

function smtpSig(a: SmtpAccount): string {
  return `${a.host}|${a.port}|${a.user}|${a.secure}|${a.pass}`;
}

async function getSmtpTransporter(account: SmtpAccount): Promise<Transporter | null> {
  if (!account.host || !account.user) return null;
  const sig = smtpSig(account);
  const cached = smtpTransporters.get(sig);
  if (cached) return cached;

  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    // Port 465 is implicit TLS and MUST be secure; 587/25 use STARTTLS. Derive
    // it from the port so a wrong "secure" toggle can't cause a silent hang.
    secure: account.secure || account.port === 465,
    auth: { user: account.user, pass: account.pass },
    // Pooled connections let each mailbox push several messages over a few
    // reused TCP/TLS connections instead of reconnecting per email.
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    // Fail fast instead of hanging when the host/port is unreachable (common on
    // serverless hosts that block outbound SMTP, or when a firewall drops 465).
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  smtpTransporters.set(sig, transporter);
  return transporter;
}

async function sendViaSmtp(
  args: SendArgs,
  from: string,
  replyTo: string | undefined,
  bcc: string[],
  account: SmtpAccount,
): Promise<SendResult> {
  const transporter = await getSmtpTransporter(account);
  if (!transporter) {
    console.warn('[email/send] SMTP not configured (host/user) — skipping send to', args.to);
    return { ok: false, error: 'smtp_not_configured', reason: 'no_api_key', provider: 'smtp' };
  }
  // Per-message From wins, then the account's own From, then the global From.
  const effectiveFrom = args.from || account.from || from;
  try {
    const info = await transporter.sendMail({
      from: effectiveFrom,
      to: toRecipientList(args.to),
      subject: args.subject,
      html: args.html,
      ...(args.text ? { text: args.text } : {}),
      ...(replyTo ? { replyTo } : {}),
      ...(bcc.length ? { bcc } : {}),
      ...(args.headers ? { headers: args.headers } : {}),
    });
    return { ok: true, messageId: info.messageId ?? '', provider: 'smtp', account: account.user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[email/send] smtp threw to', args.to, '—', msg);
    return { ok: false, error: msg, reason: 'thrown', provider: 'smtp' };
  }
}

// Resolve the SMTP pool, always returning at least the legacy single account
// when one is configured. Empty array means SMTP isn't usable at all.
function smtpPool(cfg: EmailConfig): SmtpAccount[] {
  if (cfg.smtpAccounts.length > 0) return cfg.smtpAccounts;
  if (cfg.smtp.host && cfg.smtp.user) return [{ ...cfg.smtp, from: '' }];
  return [];
}

// Campaign batch over the SMTP pool: assign each message to an account
// round-robin (account = index % poolSize), then send every account's share
// CONCURRENTLY. With four mailboxes a 100-message batch goes out as four ~25
// groups in parallel, each over that account's pooled connections. Results are
// returned in the original input order.
async function sendSmtpPool(
  messages: SendArgs[],
  from: string,
  replyTo: string,
  pool: SmtpAccount[],
): Promise<SendResult[]> {
  const results: SendResult[] = new Array(messages.length);
  // Bucket message indices per account (round-robin).
  const buckets: number[][] = pool.map(() => []);
  messages.forEach((_, i) => buckets[i % pool.length].push(i));

  // Each account drains its bucket; the per-account pooled transporter caps
  // real concurrency (maxConnections), so we can fire the whole bucket here.
  await Promise.all(
    buckets.map((indices, acctIdx) =>
      Promise.all(
        indices.map(async (i) => {
          const m = messages[i];
          results[i] = await sendViaSmtp(
            m,
            from,
            m.replyTo || replyTo || undefined,
            combineBcc(m.bcc),
            pool[acctIdx],
          );
        }),
      ),
    ),
  );
  return results;
}

/* ---------- Public API ---------- */

/**
 * Send a single email through the currently-selected provider (resolved from
 * organiser settings, falling back to env). Never throws — failures return a
 * structured SendResult so the caller can log and decide whether to surface.
 */
export async function sendMail(args: SendArgs): Promise<SendResult> {
  const cfg = await getEmailConfig(args.siteId);
  const provider = cfg.provider;
  const dryRun = process.env.EMAIL_DRY_RUN === 'true';
  const from = args.from || cfg.from;
  const replyTo = args.replyTo || cfg.replyTo || undefined;
  const bcc = combineBcc(args.bcc);

  if (dryRun) {
    console.log('[email/send] DRY_RUN', {
      provider,
      from,
      to: args.to,
      subject: args.subject,
      replyTo,
      bcc: bcc.length ? bcc : undefined,
      htmlLength: args.html.length,
      textLength: args.text?.length ?? 0,
      idempotencyKey: args.idempotencyKey,
    });
    return { ok: false, error: 'dry_run', reason: 'dry_run', provider };
  }

  if (provider === 'mailgun') return sendViaMailgun(args, from, replyTo, bcc, cfg.mailgun);
  if (provider === 'smtp') {
    const pool = smtpPool(cfg);
    if (pool.length === 0) {
      console.warn('[email/send] SMTP not configured (host/user) — skipping send to', args.to);
      return { ok: false, error: 'smtp_not_configured', reason: 'no_api_key', provider: 'smtp' };
    }
    // Transactional one-offs always go through the primary (first) account so a
    // confirmation email has a single, predictable sender.
    return sendViaSmtp(args, from, replyTo, bcc, pool[0]);
  }
  return sendViaResend(args, from, replyTo, bcc, cfg.resendApiKey);
}

/**
 * Send a batch of emails in parallel. Returns one SendResult per input;
 * never rejects. Each message goes through the active provider one-by-one
 * so per-message Reply-To / BCC / idempotency key are honoured.
 */
export async function sendMany(messages: SendArgs[]): Promise<SendResult[]> {
  return Promise.all(messages.map(sendMail));
}

/* ---------- Campaign batch sender (queue worker) ---------- */

// Run `messages` through a worker pool so we don't fire an unbounded number of
// concurrent provider calls (which would blow rate limits / function memory).
async function sendPooled(messages: SendArgs[], concurrency: number): Promise<SendResult[]> {
  const results: SendResult[] = new Array(messages.length);
  let next = 0;
  const worker = async () => {
    while (next < messages.length) {
      const i = next++;
      results[i] = await sendMail(messages[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, messages.length) }, worker));
  return results;
}

// Resend's Batch API sends up to 100 messages in ONE request — far fewer
// API/rate-limit hits than one call per recipient, and it fits inside a single
// serverless invocation. Strict mode (default) is all-or-nothing per chunk.
async function sendResendBatch(messages: SendArgs[], cfg: EmailConfig): Promise<SendResult[]> {
  const client = getResendClient(cfg.resendApiKey);
  if (!client) {
    return messages.map(() => ({
      ok: false as const,
      error: 'resend_api_key_not_set',
      reason: 'no_api_key' as const,
      provider: 'resend' as const,
    }));
  }

  const results: SendResult[] = new Array(messages.length);
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const payloads = chunk.map((m) => ({
      from: m.from || cfg.from,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      replyTo: m.replyTo || cfg.replyTo || undefined,
      bcc: (() => {
        const b = combineBcc(m.bcc);
        return b.length ? b : undefined;
      })(),
      headers: m.headers,
    }));
    const idempotencyKey = chunk[0]?.idempotencyKey;
    try {
      const { data, error } = await client.batch.send(
        payloads,
        idempotencyKey ? { idempotencyKey } : undefined,
      );
      if (error || !data) {
        const msg = error?.message || 'resend_batch_error';
        chunk.forEach((_, j) => {
          results[i + j] = { ok: false, error: msg, reason: 'send_error', provider: 'resend' };
        });
      } else {
        chunk.forEach((_, j) => {
          results[i + j] = { ok: true, messageId: data.data?.[j]?.id ?? '', provider: 'resend' };
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      chunk.forEach((_, j) => {
        results[i + j] = { ok: false, error: msg, reason: 'thrown', provider: 'resend' };
      });
    }
  }
  return results;
}

/**
 * Send a campaign batch. Uses Resend's Batch API when the active provider is
 * Resend (1 request per 100 recipients); otherwise a small worker pool. Returns
 * one SendResult per input, in order. Never rejects.
 *
 * `siteId` resolves the sending site's own mailbox (see getEmailConfig) —
 * pass the site the campaign/job belongs to so its recipients see mail from
 * that site's own domain rather than the platform default.
 */
export async function sendCampaign(messages: SendArgs[], siteId?: number): Promise<SendResult[]> {
  if (messages.length === 0) return [];
  if (process.env.EMAIL_DRY_RUN === 'true') {
    return Promise.all(messages.map(m => sendMail(siteId != null ? { ...m, siteId } : m)));
  }
  const cfg = await getEmailConfig(siteId);
  if (cfg.provider === 'resend') return sendResendBatch(messages, cfg);
  if (cfg.provider === 'smtp') {
    const pool = smtpPool(cfg);
    // No SMTP configured → let sendMail produce the structured no_api_key result.
    if (pool.length === 0) return sendPooled(messages, 5);
    // Split the batch across every mailbox and send the shares in parallel.
    return sendSmtpPool(messages, cfg.from, cfg.replyTo, pool);
  }
  // Mailgun: render+send per message, bounded concurrency.
  return sendPooled(messages, 5);
}
