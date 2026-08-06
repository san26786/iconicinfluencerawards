// Provider-agnostic open/click/unsubscribe tracking. We inject our own tracking
// pixel and rewrite links through a signed redirect, so engagement works for
// EVERY provider — including plain SMTP, which can't report anything itself.
//
// Signatures use AUTH_SECRET (HMAC-SHA256). Click URLs are signed so the
// redirect can't be abused as an open redirector.

import crypto from 'node:crypto';

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is required for email tracking signatures.');
  }
  return s;
}

export function sign(value: string): string {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function verifySig(value: string, sig: string): boolean {
  const expected = sign(value);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Base URL for tracking links (open pixels, click redirects, unsubscribe).
 *
 * `siteUrl` — the canonical URL of the site the campaign belongs to — wins,
 * because this is multi-tenant: every recipient's links must resolve on the
 * domain they actually signed up on. Falling back to a single global constant
 * (as this used to, via OFFICIAL_SITE) pointed every tenant's tracking and
 * unsubscribe links at one hardcoded domain.
 *
 * We deliberately do NOT prefer the request origin: the queue is often drained
 * by the Vercel cron, whose origin is the per-deployment `*.vercel.app` URL
 * guarded by Deployment Protection — using it would send SSO-gated
 * ("You Need Access") links to recipients. It's only a last resort.
 */
export function trackingBaseUrl(reqUrl?: string, siteUrl?: string | null): string {
  if (siteUrl) return siteUrl.replace(/\/$/, '');
  const env = process.env.PUBLIC_BASE_URL || process.env.PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  if (reqUrl) {
    try {
      return new URL(reqUrl).origin;
    } catch {
      /* fall through */
    }
  }
  return '';
}

export function openPixelUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/api/track/open?e=${encodeURIComponent(token)}`;
}

export function clickUrl(baseUrl: string, token: string, target: string): string {
  const s = sign(`${token}:${target}`);
  return `${baseUrl}/api/track/click?e=${encodeURIComponent(token)}&u=${encodeURIComponent(
    target,
  )}&s=${s}`;
}

export function unsubscribeUrl(baseUrl: string, token: string): string {
  const s = sign(`unsub:${token}`);
  return `${baseUrl}/api/unsubscribe?e=${encodeURIComponent(token)}&s=${s}`;
}

type InjectOpts = {
  baseUrl: string;
  token: string;
  trackOpens: boolean;
  trackClicks: boolean;
};

/**
 * Rewrite outbound links (click tracking) and append an invisible pixel (open
 * tracking). Skips our own tracking/unsubscribe links and non-http targets
 * (mailto:, tel:, #anchors). Only double-quoted http(s) hrefs are rewritten,
 * which covers the email templates we generate.
 */
export function injectTracking(html: string, opts: InjectOpts): string {
  let out = html;

  if (opts.trackClicks && opts.baseUrl) {
    out = out.replace(/href\s*=\s*"(https?:\/\/[^"]+)"/gi, (m, url: string) => {
      if (url.includes('/api/track/') || url.includes('/api/unsubscribe')) return m;
      return `href="${clickUrl(opts.baseUrl, opts.token, url)}"`;
    });
  }

  if (opts.trackOpens && opts.baseUrl) {
    const pixel = `<img src="${openPixelUrl(opts.baseUrl, opts.token)}" alt="" width="1" height="1" style="display:none;max-height:0;overflow:hidden" />`;
    out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, `${pixel}</body>`) : out + pixel;
  }

  return out;
}

/** A 1×1 transparent GIF for the open-tracking pixel response. */
export const TRACKING_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);
