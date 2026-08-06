// HTML email templates for nomination notifications.
//
// Two templates:
//   1. renderNomineeEmail   — congratulations + multiple application links
//   2. renderNominatorEmail — thank you for nominating
//
// Design constraints (because email clients are awful):
//   - Tables for layout, never flex/grid
//   - All CSS inlined on elements
//   - 600px max content width
//   - Web-safe fonts only (Georgia for headings, Arial/Helvetica body)
//   - No external CSS, no JS, no <style> reliance (some clients strip it)
//   - Images limited; we lean on coloured tables/cells instead
//
// Anonymity rule: when the nominator marks themselves anonymous, we MUST NOT
// leak their name, email, phone or organisation into the NOMINEE'S email. The
// reason quote is still shown — just attributed to "an anonymous nominator".

const GOLD = '#bc9f60';
const GOLD_DARK = '#8d7338';
const INK = '#0e0f12';
const INK_SOFT = '#1a1c22';
const BORDER = '#e6e1d4';
const BG = '#f7f4ee';
const TEXT = '#2a2e36';
const TEXT_SOFT = '#5b6271';
const MUTED = '#8a8f9c';
const WHITE = '#ffffff';

/* ---------- Types ---------- */

export type SocialLink = {
  label: string;
  href: string;
};

export type BrandConfig = {
  /** Full brand name e.g. "Bournemouth Business Awards" */
  name: string;
  /** Awards year e.g. "2026" */
  year: string;
  /** Public site root URL (no trailing slash) e.g. "https://bournemouthbusinessawards.com" */
  siteUrl: string;
  /** Contact email shown in signatures */
  contactEmail: string;
  /** Display phone e.g. "+44 20 3451 7166" */
  contactPhone: string;
  /** Venue line (single string) */
  venue: string;
  /** Event date for human display */
  eventDate: string;
  /** Social links */
  social: SocialLink[];
  /** Footer legal/attribution text */
  legal: string;
  /** Path to nomination guideline page on the same domain (no host) */
  guidelinePath: string;
};

/**
 * One application card in the nominee email — represents a THEME the
 * nominee was nominated under (e.g. "Iconic Influencer Awards"), the list
 * of categories they were nominated for within that theme, and the single
 * application URL the entrant clicks to begin one application that covers
 * all of those categories.
 *
 * We intentionally never render per-category cards: a nominee chosen for
 * 20 categories would otherwise see 20 buttons. There are exactly four
 * themes in the taxonomy, so we cap the card count at four naturally.
 */
export type ThemeApplication = {
  /** Stable theme id (e.g. "influencer"). Used in the application URL query. */
  themeId: string;
  /** Display name of the theme (e.g. "Iconic Influencer Awards") */
  themeName: string;
  /** Category names nominated under this theme, in selection order */
  categories: string[];
  /** Pre-built absolute URL the recipient clicks to start their application */
  applicationUrl: string;
};

export type RenderNomineeArgs = {
  brand: BrandConfig;
  nomineeFirstName: string;
  /** Theme-grouped application cards — at most four (one per theme). */
  themes: ThemeApplication[];
  /** Total category count across all themes — used in copy and the subject. */
  categoryCount: number;
  /** Reason/opening statement supplied by the nominator (or by the nominee if self-nom) */
  reason: string;
  /** When true, hide everything about the nominator's identity */
  anonymous: boolean;
  /** Used to greet the nominee in the email body */
  isSelfNomination: boolean;
  /** Nominator display name — only used if !anonymous */
  nominatorName?: string;
  /** Per-recipient unsubscribe link */
  unsubscribeUrl: string;
};

export type RenderNominatorArgs = {
  brand: BrandConfig;
  nominatorFirstName: string;
  nomineeName: string;
  categories: { name: string }[];
  unsubscribeUrl: string;
};

/* ---------- Helpers ---------- */

// Lightweight HTML escape so we can splice user-controlled text safely into
// the template. Email clients are tolerant of broken HTML but we still don't
// want, e.g., a nominee with `<` in their name to break the layout — and we
// definitely want to defuse any HTML injection in the reason text.
export function esc(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Wrap a "Complete Your Application" button. Used once per category.
function applicationButton(label: string, href: string): string {
  return `<a href="${esc(href)}" target="_blank" style="
    background-color: ${GOLD};
    color: ${WHITE};
    display: inline-block;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    padding: 12px 22px;
    font-size: 13px;
    line-height: 1.2;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-radius: 6px;
    font-family: Arial, Helvetica, sans-serif;
    mso-padding-alt: 12px 22px;
  ">${esc(label)}</a>`;
}

function socialPills(brand: BrandConfig): string {
  if (!brand.social.length) return '';
  return brand.social
    .map(
      (s) => `<a href="${esc(s.href)}" target="_blank" style="
        color: ${GOLD};
        text-decoration: none;
        font-size: 12px;
        font-family: Arial, Helvetica, sans-serif;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 6px 14px;
        margin: 0 4px;
        border: 1px solid ${GOLD};
        border-radius: 999px;
        display: inline-block;
      ">${esc(s.label)}</a>`,
    )
    .join('');
}

/* ---------- Shared chrome ---------- */

export type ShellArgs = {
  brand: BrandConfig;
  preheader: string;
  bodyHtml: string;
  /**
   * 'user'  — outward-facing email: full footer with social pills, site
   *           links, per-recipient unsubscribe and the "you are receiving"
   *           disclaimer block. Use for confirmations, notifications to
   *           nominees, contact confirmations, etc.
   * 'admin' — internal notification: minimal footer with just the brand
   *           band (no unsubscribe, no disclaimer). Use for ops alerts
   *           routed to the team mailbox.
   */
  variant?: 'user' | 'admin';
  /** Per-recipient unsubscribe URL. Required when variant === 'user'. */
  unsubscribeUrl?: string;
  /**
   * Optional override for the disclaimer paragraph below the card. Defaults
   * to the nomination wording for backwards-compat; pass a custom string to
   * tailor the language to non-nomination emails. Ignored when variant
   * is 'admin'.
   */
  disclaimer?: string;
};

// Outer scaffolding: gold rule, brand header, body slot, footer.
// `bodyHtml` is the per-template inner content.
//
// Exported so non-nomination templates (contact form, etc.) can reuse the
// same chrome and stay visually identical across email types.
export function shell({
  brand,
  preheader,
  bodyHtml,
  variant = 'user',
  unsubscribeUrl,
  disclaimer,
}: ShellArgs): string {
  // Preheader: the snippet shown in the inbox preview after the subject line.
  // Hidden visually but readable by mail clients.
  const preheaderHtml = `<div style="display:none;font-size:1px;color:${BG};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${esc(preheader)}</div>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${esc(brand.name)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:Arial,Helvetica,sans-serif;color:${TEXT};-webkit-font-smoothing:antialiased;">
  ${preheaderHtml}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:${WHITE};border-radius:14px;overflow:hidden;border:1px solid ${BORDER};box-shadow:0 2px 4px rgba(0,0,0,0.04);">

        <!-- Top gold rule -->
        <tr><td style="height:6px;background:linear-gradient(90deg, ${GOLD} 0%, ${GOLD_DARK} 100%);background-color:${GOLD};line-height:6px;font-size:6px;">&nbsp;</td></tr>

        <!-- Brand header -->
        <tr><td style="background-color:${INK};padding:28px 32px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.32em;color:${GOLD};text-transform:uppercase;font-weight:600;padding-bottom:8px;">
              The ${esc(brand.year)} Awards
            </td></tr>
            <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${WHITE};font-weight:600;letter-spacing:0.04em;line-height:1.2;">
              ${esc(brand.name)}
            </td></tr>
          </table>
        </td></tr>

        <!-- Body slot -->
        <tr><td style="padding:36px 36px 28px 36px;">
          ${bodyHtml}
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 36px;"><div style="height:1px;background-color:${BORDER};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>

        <!-- Sign-off + contact -->
        <tr><td style="padding:24px 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT_SOFT};line-height:1.6;">
          Warm regards,<br />
          <strong style="color:${TEXT};">The ${esc(brand.name)} Team</strong><br />
          <span style="color:${MUTED};font-size:13px;">Phone: ${esc(brand.contactPhone)} &nbsp;·&nbsp; Email: <a href="mailto:${esc(brand.contactEmail)}" style="color:${GOLD};text-decoration:none;">${esc(brand.contactEmail)}</a></span>
        </td></tr>

        <!-- Social row -->
        <tr><td align="center" style="padding:20px 24px 28px 24px;">
          ${socialPills(brand)}
        </td></tr>

        <!-- Brand footer band -->
        <tr><td style="background-color:${INK_SOFT};padding:22px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0ad;line-height:1.65;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.18em;color:${GOLD};text-transform:uppercase;font-weight:600;padding-bottom:8px;">
            ${esc(brand.name)}
          </div>
          <div>${esc(brand.venue)}</div>
          <div style="padding-top:4px;">Award Ceremony · ${esc(brand.eventDate)}</div>
          <div style="padding-top:10px;color:#7d8290;">${esc(brand.legal)}</div>
          ${
            variant === 'user'
              ? `<div style="padding-top:14px;font-size:11px;">
            <a href="${esc(brand.siteUrl)}" style="color:${GOLD};text-decoration:none;">Visit website</a>
            &nbsp;·&nbsp;
            <a href="${esc(brand.siteUrl + brand.guidelinePath)}" style="color:${GOLD};text-decoration:none;">Nomination guideline</a>
            ${
              unsubscribeUrl
                ? `&nbsp;·&nbsp;<a href="${esc(unsubscribeUrl)}" style="color:#9aa0ad;text-decoration:underline;">Unsubscribe</a>`
                : ''
            }
          </div>`
              : ''
          }
        </td></tr>

      </table>
      ${
        variant === 'user'
          ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding:18px 16px 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${MUTED};line-height:1.5;">
          ${esc(
            disclaimer ??
              `You are receiving this email because someone (you, or a third party) submitted a nomination on ${brand.siteUrl}.`,
          )}<br />
          If you believe this is a mistake, please ignore this email or contact us at <a href="mailto:${esc(brand.contactEmail)}" style="color:${MUTED};">${esc(brand.contactEmail)}</a>.
        </td></tr>
      </table>`
          : ''
      }
    </td></tr>
  </table>
</body>
</html>`;
}

/* ---------- Nominee template ---------- */

export function renderNomineeEmail(args: RenderNomineeArgs): {
  subject: string;
  html: string;
} {
  const {
    brand,
    nomineeFirstName,
    themes,
    categoryCount,
    reason,
    anonymous,
    isSelfNomination,
    nominatorName,
    unsubscribeUrl,
  } = args;

  const themeCount = themes.length;
  const singleCategory = categoryCount === 1;
  const singleTheme = themeCount === 1;

  // Subject line — keep it short, include the brand for context. The user-
  // visible count is the CATEGORY count (that's what they care about);
  // theme count only matters for the layout downstream.
  const subject = isSelfNomination
    ? `Your entry was received · ${brand.name}`
    : singleCategory
    ? `Congratulations — you've been nominated · ${brand.name}`
    : `Congratulations — ${categoryCount} nominations · ${brand.name}`;

  // Build the per-theme card list. Each card shows:
  //   - The theme name (e.g. "Iconic Influencer Awards")
  //   - Every category nominated under that theme, as a tidy bullet list
  //   - One "Complete Your Application" button that deep-links into the
  //     application flow for THAT theme (the application page then covers
  //     all categories under it in a single form).
  // Capped at 4 cards because the taxonomy has exactly four themes.
  const themeCards = themes
    .map((t, i) => {
      const catBullets = t.categories
        .map(
          (name) => `
          <tr>
            <td valign="top" style="width:18px;padding:5px 0;">
              <div style="width:6px;height:6px;background-color:${GOLD};border-radius:50%;margin-top:7px;"></div>
            </td>
            <td valign="top" style="padding:4px 0 4px 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${TEXT};">
              ${esc(name)}
            </td>
          </tr>`,
        )
        .join('');

      return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${i === 0 ? '0' : '16px'} 0 0 0;border:1px solid ${BORDER};border-left:4px solid ${GOLD};border-radius:10px;background-color:${BG};">
        <tr><td style="padding:20px 22px 22px 22px;">

          <!-- Theme label + name -->
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
            ${singleTheme ? 'Theme' : `Theme ${i + 1} of ${themeCount}`}
          </div>
          <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:${TEXT};line-height:1.3;font-weight:600;">
            ${esc(t.themeName)}
          </div>

          <!-- Categories under this theme -->
          <div style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.08em;color:${MUTED};text-transform:uppercase;font-weight:600;">
            ${t.categories.length === 1 ? 'Nominated category' : `Nominated categories (${t.categories.length})`}
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:4px;">
            ${catBullets}
          </table>

          <!-- One button per theme -->
          <div style="margin-top:18px;">
            ${applicationButton('Complete Your Application', t.applicationUrl)}
          </div>

        </td></tr>
      </table>`;
    })
    .join('');

  // Greeting + headline copy. Self-nomination flows past the "you've been
  // nominated" narrative — that copy makes no sense when the entrant is also
  // the nominator. We say "your entry was received" instead.
  const headline = isSelfNomination
    ? `Your entry to the<br /><span style="color:${GOLD_DARK};">${esc(brand.year)} ${esc(brand.name)}</span> is in.`
    : singleCategory
    ? `You've been nominated for the<br /><span style="color:${GOLD_DARK};">${esc(brand.year)} ${esc(brand.name)}</span>.`
    : `You've been nominated for <span style="color:${GOLD_DARK};">${categoryCount} awards</span> at the ${esc(brand.year)} ${esc(brand.name)}.`;

  const reasonBlock = reason
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;border-radius:8px;background-color:${BG};">
        <tr><td style="padding:20px 22px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
            ${isSelfNomination ? 'Your opening statement' : 'Why you were nominated'}
          </div>
          <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${TEXT};line-height:1.5;font-style:italic;">
            &ldquo;${esc(reason)}&rdquo;
          </div>
          ${
            !isSelfNomination && !anonymous && nominatorName
              ? `<div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_SOFT};">— Nominated by ${esc(nominatorName)}</div>`
              : ''
          }
          ${
            !isSelfNomination && anonymous
              ? `<div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};font-style:italic;">— Submitted anonymously</div>`
              : ''
          }
        </td></tr>
      </table>`
    : '';

  // Copy block for the theme-grouped section. Phrased so the recipient
  // immediately understands the application count is ≤4 even when they were
  // nominated across many categories.
  const themeCopy = singleTheme
    ? singleCategory
      ? `To progress your nomination and be considered by the judging panel, please complete your application using the button below.`
      : `You've been nominated across <strong style="color:${TEXT};">${categoryCount}</strong> categories under one theme. One application covers them all — please complete the application below.`
    : `Your ${categoryCount} nominations span <strong style="color:${TEXT};">${themeCount}</strong> themes. Each theme has its own application that covers every category nominated under it — so just <strong style="color:${TEXT};">${themeCount}</strong> application${themeCount === 1 ? '' : 's'} total, not ${categoryCount}.`;

  // Inner body content (the bit that sits inside `shell`'s body slot)
  const body = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT};line-height:1.6;">
      Dear ${esc(nomineeFirstName) || 'Friend'},
    </div>

    <h1 style="margin:14px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${TEXT};font-weight:600;">
      ${headline}
    </h1>

    <p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT_SOFT};">
      ${
        isSelfNomination
          ? `Thank you for entering. Your nomination has been received and we look forward to learning more about your work and the impact you have made.`
          : singleCategory
          ? `${
              anonymous
                ? 'Someone'
                : nominatorName
                ? esc(nominatorName)
                : 'A nominator'
            } has put your name forward in recognition of the contribution and excellence you have demonstrated within your field.`
          : `${
              anonymous
                ? 'A nominator'
                : nominatorName
                ? esc(nominatorName)
                : 'A nominator'
            } has put your name forward across multiple categories in recognition of the contribution and excellence you have demonstrated within your field.`
      }
    </p>

    ${reasonBlock}

    <!-- Theme-grouped application cards -->
    <div style="margin-top:30px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
        ${singleTheme ? 'Your application' : 'Your applications'}
      </div>
      <p style="margin:6px 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${TEXT_SOFT};">
        ${themeCopy}
      </p>
      ${themeCards}
    </div>

    <!-- What happens next -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:30px;border-top:1px solid ${BORDER};">
      <tr><td style="padding:22px 0 0 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
          What happens next
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;">
          ${[
            singleTheme
              ? 'Complete your application using the button above.'
              : 'Complete your applications using the buttons above — one per theme.',
            'Our independent judging panel reviews every submission against the published criteria.',
            'Shortlisted finalists are notified by email ahead of the Award Ceremony.',
          ]
            .map(
              (step, i) => `
            <tr>
              <td valign="top" style="width:32px;padding:6px 0;">
                <div style="width:24px;height:24px;background-color:${GOLD};color:${WHITE};border-radius:50%;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:600;line-height:24px;">
                  ${i + 1}
                </div>
              </td>
              <td valign="top" style="padding:6px 0 6px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${TEXT};">
                ${esc(step)}
              </td>
            </tr>`,
            )
            .join('')}
        </table>
      </td></tr>
    </table>
  `;

  const preheader = singleCategory
    ? `You've been nominated. Tap to complete your application.`
    : singleTheme
    ? `${categoryCount} nominations — one application covers them all.`
    : `${categoryCount} nominations across ${themeCount} themes. Tap to apply.`;

  return { subject, html: shell({ brand, preheader, bodyHtml: body, unsubscribeUrl }) };
}

/* ---------- Nominator template ---------- */

export function renderNominatorEmail(args: RenderNominatorArgs): {
  subject: string;
  html: string;
} {
  const { brand, nominatorFirstName, nomineeName, categories, unsubscribeUrl } = args;
  const count = categories.length;
  const single = count === 1;

  const subject = `Thank you for nominating ${nomineeName} · ${brand.name}`;

  const categoryList = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;">
      ${categories
        .map(
          (c, i) => `
        <tr>
          <td valign="top" style="width:20px;padding:8px 0;">
            <div style="width:8px;height:8px;background-color:${GOLD};border-radius:50%;margin-top:6px;"></div>
          </td>
          <td valign="top" style="padding:6px 0 6px 12px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.45;color:${TEXT};font-weight:500;">
            ${esc(c.name)}
          </td>
        </tr>${i < categories.length - 1 ? '' : ''}`,
        )
        .join('')}
    </table>
  `;

  const body = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT};line-height:1.6;">
      Dear ${esc(nominatorFirstName) || 'Friend'},
    </div>

    <h1 style="margin:14px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${TEXT};font-weight:600;">
      Thank you for nominating<br />
      <span style="color:${GOLD_DARK};">${esc(nomineeName)}</span>.
    </h1>

    <p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT_SOFT};">
      Your nomination is in. We received your submission for the <strong style="color:${TEXT};">${esc(brand.year)} ${esc(brand.name)}</strong> and your support means a great deal — both to the awards and to ${esc(nomineeName)}.
    </p>

    <!-- Categories block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:28px;border:1px solid ${BORDER};border-radius:8px;background-color:${BG};">
      <tr><td style="padding:22px 24px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
          ${single ? 'Nominated for' : `Nominated for ${count} categories`}
        </div>
        ${categoryList}
      </td></tr>
    </table>

    <!-- What happens next -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:30px;">
      <tr><td>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
          What happens next
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;">
          ${[
            `We have sent ${esc(nomineeName)} an email inviting them to complete their application${single ? '' : 's'}.`,
            'Our independent judging panel reviews every submission against the published criteria.',
            'Shortlisted finalists are announced ahead of the Award Ceremony — keep an eye on our channels for updates.',
          ]
            .map(
              (step, i) => `
            <tr>
              <td valign="top" style="width:32px;padding:6px 0;">
                <div style="width:24px;height:24px;background-color:${GOLD};color:${WHITE};border-radius:50%;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:600;line-height:24px;">
                  ${i + 1}
                </div>
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

    <!-- Inline CTA: visit site for live updates -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:30px;border-top:1px solid ${BORDER};">
      <tr><td style="padding:22px 0 0 0;text-align:center;">
        <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${TEXT_SOFT};">
          Stay connected for live updates, shortlist announcements and behind-the-scenes coverage.
        </p>
        ${applicationButton('Visit Our Website', brand.siteUrl)}
      </td></tr>
    </table>
  `;

  return {
    subject,
    html: shell({
      brand,
      preheader: `We received your nomination of ${nomineeName}. Here's what happens next.`,
      bodyHtml: body,
      unsubscribeUrl,
    }),
  };
}
