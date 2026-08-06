// HTML email templates for contact-form submissions.
//
// Two templates:
//   1. renderContactUserConfirmation — "We've received your message" reply
//      to the person who filled out the form. Reuses the brand shell with
//      the 'user' variant so it carries the full footer (site links,
//      unsubscribe stub, contact disclaimer).
//   2. renderContactAdminNotification — internal alert sent to the team
//      mailbox. Uses the 'admin' variant: trimmed footer, no unsubscribe,
//      richer body card with the full transcript + IP/UA metadata so the
//      on-call reader can triage and reply with one tap.
//
// Both designs come from a 3-way design judging round (luxe / clean / warm)
// where the clean/corporate proposal won as the base and editorial flourishes
// were grafted on top — see Workflow w18f7w7c5 in the commit history.

import { esc, shell, type BrandConfig } from './render';

/* ---------- Public types ---------- */

export type ContactSubmission = {
  /** Required. The sender's name. */
  name: string;
  /** Required. Reachable email address. */
  email: string;
  /** Required. Subject the user picked from the form's <select>. */
  subject: string;
  /** Required. Free-text message body from the form's <textarea>. */
  message: string;
  /** Optional. Company / organisation. */
  company?: string;
  /** Optional. Phone number. */
  phone?: string;
};

export type RenderContactUserArgs = {
  brand: BrandConfig;
  submission: ContactSubmission;
  /** ISO timestamp or human-formatted "Sun, 7 Jun 2026 14:32 BST" */
  submittedAt: string;
  /** Per-recipient unsubscribe link. Optional. */
  unsubscribeUrl?: string;
};

export type RenderContactAdminArgs = {
  brand: BrandConfig;
  submission: ContactSubmission;
  submittedAt: string;
  /** Originating IP, if known. Used in the metadata block. */
  ipAddress?: string;
  /** User-Agent header, if known. */
  userAgent?: string;
};

/* ---------- Theme tokens (mirrored from render.ts) ---------- */

const GOLD = '#bc9f60';
const GOLD_DARK = '#8d7338';
const INK = '#0e0f12';
const BORDER = '#e6e1d4';
const BG = '#f7f4ee';
const TEXT = '#2a2e36';
const TEXT_SOFT = '#5b6271';
const MUTED = '#8a8f9c';
const WHITE = '#ffffff';

/* ---------- User confirmation email ---------- */

/**
 * Body slot for the "we got your message" confirmation we send back to the
 * person who filled out the contact form. The shell wraps this with the
 * branded header + footer.
 */
function userConfirmationBody(args: RenderContactUserArgs): string {
  const { brand, submission, submittedAt } = args;

  return `<div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.32em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
  An acknowledgement &middot; from the awards desk
</div>

<div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT};line-height:1.6;">
  Hello ${esc(submission.name)},
</div>

<h1 style="margin:14px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${TEXT};font-weight:600;">
  Got it &mdash; <span style="color:${GOLD_DARK};">we'll be in touch</span>.
</h1>

<p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT_SOFT};">
  Thank you for getting in touch with <strong style="color:${TEXT};">${esc(brand.name)}</strong>. Your message has landed safely at the awards desk and a real person on our team will read it personally, typically within <strong style="color:${TEXT};">one business day</strong>.
</p>

<!-- Receipt-style summary card -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:26px;border:1px solid ${BORDER};border-radius:10px;background-color:${WHITE};">
  <tr><td style="padding:0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td style="height:3px;background-color:${GOLD};line-height:3px;font-size:3px;">&nbsp;</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 22px 6px 22px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
      Your message summary
    </div>
  </td></tr>
  <tr><td style="padding:6px 22px 18px 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td valign="top" style="width:90px;padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;color:${MUTED};text-transform:uppercase;font-weight:600;">Subject</td>
        <td valign="top" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${TEXT};font-weight:600;">${esc(submission.subject)}</td>
      </tr>
      <tr><td colspan="2" style="padding:0;"><div style="height:1px;background-color:${BORDER};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
      <tr>
        <td valign="top" style="width:90px;padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;color:${MUTED};text-transform:uppercase;font-weight:600;">Submitted</td>
        <td valign="top" style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${TEXT};">${esc(submittedAt)}</td>
      </tr>
      <tr><td colspan="2" style="padding:0;"><div style="height:1px;background-color:${BORDER};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
      <tr>
        <td colspan="2" valign="top" style="padding:14px 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;color:${MUTED};text-transform:uppercase;font-weight:600;">In your own words</td>
      </tr>
      <tr>
        <td colspan="2" valign="top" style="padding:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:${TEXT};font-style:italic;white-space:pre-wrap;">&ldquo;${esc(submission.message)}&rdquo;</td>
      </tr>
    </table>
  </td></tr>
</table>

<!-- What happens next -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:30px;border-top:1px solid ${BORDER};">
  <tr><td style="padding:22px 0 0 0;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
      What happens next
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;">
      ${[
        'Your enquiry is routed to the right person on our team based on its subject.',
        'We aim to reply within <strong>one business day</strong>, Monday to Friday.',
        `If your enquiry is urgent, reply directly to this email or write to <a href="mailto:${esc(
          brand.contactEmail,
        )}" style="color:${GOLD};text-decoration:none;font-weight:600;">${esc(
          brand.contactEmail,
        )}</a>.`,
      ]
        .map(
          (step, i) => `
      <tr>
        <td valign="top" style="width:32px;padding:6px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" style="width:24px;height:24px;background-color:${GOLD};color:${WHITE};border-radius:50%;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:600;line-height:24px;">${i + 1}</td></tr></table>
        </td>
        <td valign="top" style="padding:6px 0 6px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${TEXT};">
          ${step}
        </td>
      </tr>`,
        )
        .join('')}
    </table>
  </td></tr>
</table>

<!-- Personal signoff -->
<p style="margin:30px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:${TEXT};font-style:italic;">
  We will be back in touch shortly &mdash; usually much sooner than you would expect.
</p>

<p style="margin:22px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;color:${TEXT};">
  &mdash; The Team at <span style="color:${GOLD_DARK};font-weight:600;">${esc(brand.name)}</span>
</p>`;
}

export function renderContactUserConfirmation(args: RenderContactUserArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const { brand, submission } = args;
  const subject = `We've received your message · ${brand.name}`;

  const html = shell({
    brand: args.brand,
    preheader: `Thanks for getting in touch — we'll reply within one business day.`,
    bodyHtml: userConfirmationBody(args),
    variant: 'user',
    unsubscribeUrl: args.unsubscribeUrl,
    disclaimer: `You are receiving this email because someone submitted a message via the contact form on ${brand.siteUrl}.`,
  });

  const text = [
    `Hello ${submission.name},`,
    '',
    `Got it — we'll be in touch.`,
    '',
    `Thank you for getting in touch with ${brand.name}. Your message has landed safely at the awards desk and a real person on our team will read it personally, typically within one business day.`,
    '',
    `--- Your message summary ---`,
    `Subject:    ${submission.subject}`,
    `Submitted:  ${args.submittedAt}`,
    '',
    `In your own words:`,
    `"${submission.message}"`,
    '',
    `What happens next:`,
    `1. Your enquiry is routed to the right person on our team based on its subject.`,
    `2. We aim to reply within one business day, Monday to Friday.`,
    `3. If urgent, reply directly to this email or write to ${brand.contactEmail}.`,
    '',
    `— The Team at ${brand.name}`,
    `${brand.siteUrl}`,
  ].join('\n');

  return { subject, html, text };
}

/* ---------- Admin notification email ---------- */

function adminNotificationBody(args: RenderContactAdminArgs): string {
  const { submission, submittedAt, ipAddress, userAgent } = args;

  // Pre-fill the mailto so a single tap opens a draft addressed to the
  // sender with "Re: <subject>" — saves the on-call reader a few seconds.
  const replyHref = `mailto:${encodeURIComponent(submission.email)}?subject=${encodeURIComponent(
    `Re: ${submission.subject}`,
  )}`;

  return `<div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.32em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
  Inbox &middot; Concierge desk
</div>

<h1 style="margin:8px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${TEXT};font-weight:600;">
  New <span style="color:${GOLD_DARK};">Contact Form Submission</span>
</h1>

<p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:${TEXT_SOFT};">
  A new message has just arrived through the website. Quick summary below &mdash; full details follow.
</p>

<!-- Top-line summary card -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:22px;border:1px solid ${BORDER};border-left:4px solid ${GOLD};border-radius:8px;background-color:${BG};">
  <tr><td style="padding:20px 24px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
      Subject
    </div>
    <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:${TEXT};line-height:1.35;font-weight:600;">
      ${esc(submission.subject)}
    </div>
    <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:${TEXT_SOFT};">
      From <strong style="color:${TEXT};">${esc(submission.name)}</strong>${
        submission.company
          ? ` &middot; <span style="color:${TEXT};">${esc(submission.company)}</span>`
          : ''
      }<br />
      <a href="mailto:${esc(submission.email)}" style="color:${GOLD};text-decoration:none;font-weight:600;">${esc(submission.email)}</a>
    </div>
  </td></tr>
</table>

<!-- Reply CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:22px;">
  <tr><td>
    <a href="${replyHref}" target="_blank" style="background-color:${GOLD};color:${WHITE};display:inline-block;font-weight:600;text-align:center;text-decoration:none;padding:14px 28px;font-size:13px;line-height:1.2;letter-spacing:0.08em;text-transform:uppercase;border-radius:6px;font-family:Arial,Helvetica,sans-serif;mso-padding-alt:14px 28px;">Reply to ${esc(submission.name)}</a>
  </td></tr>
</table>

<!-- Their message, as a real quote (dark INK panel for visual punch) -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:30px;">
  <tr><td>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
      Their message
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:12px;background-color:${INK};border-radius:10px;border-left:4px solid ${GOLD};">
      <tr><td style="padding:22px 26px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${WHITE};font-style:italic;white-space:pre-wrap;">
          &ldquo;${esc(submission.message)}&rdquo;
        </div>
        <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;color:${GOLD};text-transform:uppercase;font-weight:600;">
          &mdash; ${esc(submission.name)}
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- Submission details — Linear-style key/value table -->
<div style="margin-top:30px;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
  Submission details
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:12px;border:1px solid ${BORDER};border-radius:8px;border-collapse:separate;border-spacing:0;background-color:${WHITE};">
  ${[
    { label: 'Name', value: esc(submission.name), bold: true },
    { label: 'Company', value: esc(submission.company || '—') },
    {
      label: 'Email',
      value: `<a href="mailto:${esc(submission.email)}" style="color:${GOLD};text-decoration:none;font-weight:600;">${esc(submission.email)}</a>`,
    },
    { label: 'Phone', value: esc(submission.phone || '—') },
    { label: 'Subject', value: esc(submission.subject), bold: true },
  ]
    .map(
      (row, i, arr) => `
  <tr>
    <td valign="top" style="width:140px;padding:12px 16px;background-color:${BG};${i < arr.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;color:${TEXT_SOFT};text-transform:uppercase;font-weight:600;">${row.label}</td>
    <td valign="top" style="padding:12px 16px;${i < arr.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT};line-height:1.5;${row.bold ? 'font-weight:600;' : ''}">${row.value}</td>
  </tr>`,
    )
    .join('')}
</table>

<!-- Submission metadata -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:28px;border-top:1px solid ${BORDER};">
  <tr><td style="padding:18px 0 0 0;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
      Submission metadata
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;">
      <tr>
        <td valign="top" style="width:120px;padding:6px 12px 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};letter-spacing:0.04em;">Submitted at</td>
        <td valign="top" style="padding:6px 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:${TEXT};line-height:1.55;">${esc(submittedAt)}</td>
      </tr>
      <tr>
        <td valign="top" style="width:120px;padding:6px 12px 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};letter-spacing:0.04em;">IP address</td>
        <td valign="top" style="padding:6px 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:${TEXT};line-height:1.55;">${esc(ipAddress || '—')}</td>
      </tr>
      <tr>
        <td valign="top" style="width:120px;padding:6px 12px 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};letter-spacing:0.04em;">User agent</td>
        <td valign="top" style="padding:6px 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:${TEXT_SOFT};line-height:1.55;word-break:break-all;">${esc(userAgent || '—')}</td>
      </tr>
    </table>
  </td></tr>
</table>`;
}

export function renderContactAdminNotification(args: RenderContactAdminArgs): {
  subject: string;
  html: string;
  text: string;
  /** Used by the sender as Reply-To so a "Reply" from the inbox goes to the lead. */
  replyTo: string;
} {
  const { submission } = args;
  const subject = `New contact enquiry: ${submission.subject} — from ${submission.name}`;

  const html = shell({
    brand: args.brand,
    preheader: `New contact form submission from ${submission.name} — ${submission.subject}`,
    bodyHtml: adminNotificationBody(args),
    variant: 'admin',
  });

  const text = [
    `New contact form submission`,
    '',
    `Subject:   ${submission.subject}`,
    `From:      ${submission.name}${submission.company ? ` (${submission.company})` : ''}`,
    `Email:     ${submission.email}`,
    `Phone:     ${submission.phone || '—'}`,
    '',
    `--- Message ---`,
    submission.message,
    `--- end ---`,
    '',
    `Submitted: ${args.submittedAt}`,
    `IP:        ${args.ipAddress || '—'}`,
    `UA:        ${args.userAgent || '—'}`,
  ].join('\n');

  return { subject, html, text, replyTo: submission.email };
}
