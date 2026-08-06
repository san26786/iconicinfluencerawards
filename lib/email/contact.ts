// Orchestrates the two contact-form emails (user confirmation + admin
// notification) from a parsed contact submission. Keeps the route handler thin.

import { getBrandConfig } from './brand';
import {
  renderContactAdminNotification,
  renderContactUserConfirmation,
  type ContactSubmission,
} from './contact-render';
import { sendMany, type SendResult } from './send';
import { crytidEncryptForUrl } from '@/lib/crytid';
import type { SiteData } from '@/lib/site';

export type SendContactEmailsArgs = {
  submission: ContactSubmission;
  /** Timestamp of the submission as an ISO 8601 string. */
  submittedAt: string;
  /** Originating IP from request headers (x-forwarded-for, x-real-ip). */
  ipAddress?: string;
  /** User-Agent header. */
  userAgent?: string;
  /** The tenant site this submission came from — drives branding + sender mailbox. */
  site: SiteData;
};

export type SendContactEmailsResult = {
  userResult: SendResult | null;
  adminResult: SendResult | null;
};

/**
 * Format an ISO timestamp into a humanised string for display in the email
 * bodies. We deliberately render in en-GB locale + a UK timezone so the
 * format is consistent regardless of where the function runs.
 */
function humanTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

/**
 * Send both contact emails:
 *   1. User confirmation -> args.submission.email
 *   2. Admin notification -> SITE.email (from brand config) with Reply-To
 *      set to the user so the team can hit reply directly
 *
 * Never throws. Returns per-recipient SendResults so the caller can log.
 */
export async function sendContactEmails(
  args: SendContactEmailsArgs,
): Promise<SendContactEmailsResult> {
  const brand = getBrandConfig(args.site);
  const siteId = args.site.id;
  const submittedAt = humanTimestamp(args.submittedAt);
  const sub = args.submission;

  // Sanity: skip if the user supplied an unparseable email. Better to fail
  // silently here than to attempt to send to garbage and burn rate limit.
  if (!sub.email || !sub.email.includes('@')) {
    console.warn('[contact] no usable email on submission; skipping send');
    return { userResult: null, adminResult: null };
  }

  // --- Build messages ---------------------------------------------------
  const user = renderContactUserConfirmation({
    brand,
    submission: sub,
    submittedAt,
    unsubscribeUrl: `${brand.siteUrl}/unsubscribe?token=${crytidEncryptForUrl(
      sub.email,
    )}`,
  });

  const admin = renderContactAdminNotification({
    brand,
    submission: sub,
    submittedAt,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  // --- Dispatch both in parallel ---------------------------------------
  // We send in parallel and rely on `sendMany` to never reject — the route
  // handler reads the SendResults to log per-recipient outcome without
  // blocking the request on a slow Resend round-trip.
  const [userResult, adminResult] = await sendMany([
    {
      to: sub.email,
      subject: user.subject,
      html: user.html,
      text: user.text,
      // If the user replies to our confirmation, route it to the team mailbox
      replyTo: brand.contactEmail,
      siteId,
    },
    {
      to: brand.contactEmail,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
      // Hit Reply on the admin notification → drafts a message to the sender
      replyTo: admin.replyTo,
      siteId,
    },
  ]);

  return { userResult, adminResult };
}
