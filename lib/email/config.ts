// Resolves the effective email configuration at send time.
//
// Two layers, checked in order:
//   1. This SITE's own mailbox (site_email_settings, keyed by site_id) — lets
//      each tenant send from its own domain (proper SPF/DKIM alignment).
//   2. The platform-wide fallback (app_settings, singleton id=1) — used for
//      any site that hasn't configured its own mailbox yet, and for any
//      call site that doesn't pass a siteId at all (env vars as last resort).
//
// Cached briefly (per site) to avoid a DB read on every message; invalidate
// after a settings change.

import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSiteById } from '@/lib/site';

export type EmailProvider = 'resend' | 'mailgun' | 'smtp';

export type SmtpAccount = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  /** Per-account From header. Falls back to the global `from` when blank. */
  from: string;
};

export type EmailConfig = {
  provider: EmailProvider;
  from: string;
  replyTo: string;
  resendApiKey: string;
  mailgun: { apiKey: string; domain: string; region: string };
  smtp: { host: string; port: number; user: string; pass: string; secure: boolean };
  /**
   * SMTP sending pool. Always ≥1 element when SMTP is usable: either the
   * configured `smtp_accounts` array, or — when that's empty — the single
   * legacy smtp_* settings wrapped as a one-account pool. Empty only when no
   * SMTP host/user is configured at all.
   */
  smtpAccounts: SmtpAccount[];
};

// Last-resort From header when neither the site's own mailbox, the platform
// default, nor EMAIL_FROM is configured. Deliberately brand-neutral: this used
// to name a specific brand ("South England Awards <noreply@southenglandawards.com>"),
// which meant a misconfigured tenant sent mail signed as an unrelated company
// from a domain its SPF/DKIM could never align with.
export const DEFAULT_FROM = '';

type Row = Partial<{
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
}>;

// Normalise a raw smtp_accounts JSON value into a clean SmtpAccount[]. Drops
// any entry missing host or user so a half-filled row can never break a send.
function parseSmtpAccounts(raw: unknown): SmtpAccount[] {
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out: SmtpAccount[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const a = item as Record<string, unknown>;
    const host = typeof a.host === 'string' ? a.host.trim() : '';
    const user = typeof a.user === 'string' ? a.user.trim() : '';
    if (!host || !user) continue;
    const port = Number(a.port) || 587;
    out.push({
      host,
      user,
      port,
      pass: typeof a.pass === 'string' ? a.pass : '',
      secure: a.secure === true || port === 465,
      from: typeof a.from === 'string' ? a.from.trim() : '',
    });
  }
  return out;
}

const cacheMap = new Map<string, { cfg: EmailConfig; at: number }>();
const TTL_MS = 30_000;

/** Clear the cache. Pass a siteId to invalidate just that site's entry. */
export function invalidateEmailConfig(siteId?: number): void {
  if (siteId == null) { cacheMap.clear(); return; }
  cacheMap.delete(String(siteId));
}

async function loadGlobalConfig(): Promise<EmailConfig> {
  let row: Row = {};
  try {
    const { rows } = await query<Row>('SELECT * FROM app_settings WHERE id = 1');
    row = rows[0] ?? {};
  } catch {
    row = {}; // settings table not migrated yet → fall back to env entirely
  }
  const env = process.env;
  const pick = (a: string | undefined, b: string | undefined) => (a && a.trim() ? a : b || '');

  const providerRaw = pick(row.email_provider, env.EMAIL_PROVIDER).toLowerCase();
  const provider: EmailProvider =
    providerRaw === 'mailgun' ? 'mailgun' : providerRaw === 'smtp' ? 'smtp' : 'resend';

  const cfg: EmailConfig = {
    provider,
    from: pick(row.email_from, env.EMAIL_FROM) || DEFAULT_FROM,
    replyTo: pick(row.email_reply_to, env.EMAIL_REPLY_TO),
    resendApiKey: pick(row.resend_api_key, env.RESEND_API_KEY),
    mailgun: {
      apiKey: pick(row.mailgun_api_key, env.MAILGUN_API_KEY),
      domain: pick(row.mailgun_domain, env.MAILGUN_DOMAIN),
      region: (pick(row.mailgun_region, env.MAILGUN_REGION) || 'us').toLowerCase(),
    },
    smtp: {
      host: pick(row.smtp_host, env.SMTP_HOST),
      port: Number(row.smtp_port || env.SMTP_PORT || 587),
      user: pick(row.smtp_user, env.SMTP_USER),
      pass: pick(row.smtp_pass, env.SMTP_PASS),
      secure: row.smtp_secure ?? env.SMTP_SECURE === 'true',
    },
    smtpAccounts: [],
  };

  // Resolve the SMTP sending pool: the configured accounts array, or — when
  // empty — the single legacy smtp settings as a one-account pool. The latter
  // keeps existing single-mailbox setups working with zero config change.
  const accounts = parseSmtpAccounts(row.smtp_accounts);
  if (accounts.length > 0) {
    cfg.smtpAccounts = accounts;
  } else if (cfg.smtp.host && cfg.smtp.user) {
    cfg.smtpAccounts = [{ ...cfg.smtp, from: '' }];
  }

  return cfg;
}

type SiteEmailRow = {
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  smtp_secure: boolean | null;
  email_from: string | null;
  email_reply_to: string | null;
};

async function ensureSiteEmailSettingsTable() {
  await ensureOnce('site_email_settings', () =>
    query(`
      CREATE TABLE IF NOT EXISTS site_email_settings (
        id             SERIAL PRIMARY KEY,
        site_id        INTEGER NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
        smtp_host      TEXT,
        smtp_port      INTEGER NOT NULL DEFAULT 587,
        smtp_user      TEXT,
        smtp_pass      TEXT,
        smtp_secure    BOOLEAN NOT NULL DEFAULT false,
        email_from     TEXT,
        email_reply_to TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(() => {}),
  );
}

/** Read this site's own mailbox row, or null if it hasn't configured one. */
export async function getSiteEmailRow(siteId: number): Promise<SiteEmailRow | null> {
  await ensureSiteEmailSettingsTable();
  const { rows } = await query<SiteEmailRow>(
    `SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, email_from, email_reply_to
       FROM site_email_settings WHERE site_id = $1`,
    [siteId],
  );
  return rows[0] ?? null;
}

/**
 * Resolve the effective email config for `siteId`. When that site has its
 * own SMTP mailbox configured (host + user present), sending happens via
 * that account, branded with its own From/Reply-To — falling back to the
 * platform default (app_settings) for whichever of those two fields it left
 * blank. When the site has no mailbox of its own, the platform default is
 * used in full, exactly as before per-site settings existed.
 *
 * Call with no siteId to get the platform default directly (unchanged
 * behaviour for callers not yet site-aware, and for contexts with no site,
 * e.g. inbound provider webhooks).
 */
export async function getEmailConfig(siteId?: number): Promise<EmailConfig> {
  const cacheKey = String(siteId ?? 'global');
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.cfg;

  const globalCfg = await loadGlobalConfig();
  let cfg = globalCfg;

  if (siteId != null) {
    const own = await getSiteEmailRow(siteId).catch(() => null);
    if (own?.smtp_host?.trim() && own?.smtp_user?.trim()) {
      const account = {
        host: own.smtp_host.trim(),
        port: own.smtp_port || 587,
        user: own.smtp_user.trim(),
        pass: own.smtp_pass || '',
        secure: own.smtp_secure ?? own.smtp_port === 465,
        from: '',
      };
      cfg = {
        ...globalCfg,
        provider: 'smtp',
        from: own.email_from?.trim() || globalCfg.from,
        replyTo: own.email_reply_to?.trim() || globalCfg.replyTo,
        smtp: account,
        smtpAccounts: [account],
      };
    }

    // Nothing configured a From header anywhere — derive one from the site's own
    // identity rather than falling back to some other brand's address.
    if (!cfg.from) {
      const site = await getSiteById(siteId).catch(() => null);
      if (site?.email) {
        cfg = { ...cfg, from: `${site.name} <${site.email}>` };
      }
    }
  }

  cacheMap.set(cacheKey, { cfg, at: Date.now() });
  return cfg;
}
