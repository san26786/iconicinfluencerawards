// HTML email template for the "Email me my Find My Award results" flow.
//
// The user has just completed the Find My Award quiz on the home page and
// asked to receive their recommended-category list by email. The body
// renders inside the existing brand shell (lib/email/render.ts → shell())
// — gold-rule top, dark-ink brand header, social pills + venue/legal
// footer — so it stays visually identical to the nominee / contact emails.
//
// Design derived from a 3-way judge panel (luxe / clean / compact) where
// the clean/compact proposal won and editorial flourishes were grafted in.
// See Workflow wsgmobrxp in the commit history.
//
// Layout:
//   1. Greeting + Georgia headline ("Your Find My Award results.")
//   2. Summary strip — gold dot + counts at a glance
//   3. "MOST POPULAR FOR YOU" eyebrow + count
//      → numbered rows on cream BG with gold left rule, solid gold
//        "Nominate" pill aligned right
//   4. "&" gold-rule divider
//   5. "ALSO WORTH CONSIDERING" eyebrow + count
//      → flat white rows with gold-outline "Nominate" pill
//   6. Full-width gold "Nominate All ({count})" CTA
//   7. "First time nominating?" guideline link card
//   8. Italic editorial closing line

import { esc, shell, type BrandConfig } from './render';

/* ---------- Public types ---------- */

export type RecommendedCategory = {
  /** Display name of the award category */
  name: string;
  /** Pre-built absolute URL that opens the nomination form with this
   *  single category pre-selected. */
  nominateUrl: string;
};

export type RenderFindMyAwardArgs = {
  brand: BrandConfig;
  /** Optional first name — when blank we greet "Dear Friend,". */
  firstName?: string;
  /** Top picks — get the highlighted (cream + gold rule + index number) treatment. */
  topCategories: RecommendedCategory[];
  /** Secondary recommendations — flatter visual treatment. */
  otherCategories: RecommendedCategory[];
  /** URL that opens the nomination form with ALL recommended categories
   *  pre-selected. */
  nominateAllUrl: string;
  /** Per-recipient unsubscribe link. Optional. */
  unsubscribeUrl?: string;
};

/* ---------- Theme tokens (mirrored from render.ts) ---------- */

const GOLD = '#bc9f60';
const GOLD_DARK = '#8d7338';
const BORDER = '#e6e1d4';
const BG = '#f7f4ee';
const TEXT = '#2a2e36';
const TEXT_SOFT = '#5b6271';
const MUTED = '#8a8f9c';
const WHITE = '#ffffff';

/* ---------- Body builder ---------- */

function pluralise(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

function topRow(c: RecommendedCategory, index: number): string {
  // Highlighted treatment: cream background, gold left rule, italic
  // gold index number, solid gold "Nominate" pill.
  return `
  <tr>
    <td style="padding:14px 0 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG};border:1px solid ${BORDER};border-left:4px solid ${GOLD};border-radius:8px;">
        <tr>
          <td valign="middle" style="width:36px;padding:14px 0 14px 16px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.1;color:${GOLD};font-weight:700;font-style:italic;">${index}.</td>
          <td valign="middle" style="padding:14px 8px 14px 4px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;color:${TEXT};font-weight:600;">${esc(c.name)}</td>
          <td valign="middle" align="right" style="padding:10px 14px 10px 8px;">
            <a href="${esc(c.nominateUrl)}" target="_blank" style="background-color:${GOLD};color:${WHITE};display:inline-block;font-family:Arial,Helvetica,sans-serif;font-weight:600;text-align:center;text-decoration:none;padding:12px 20px;font-size:12px;line-height:1.2;letter-spacing:0.08em;text-transform:uppercase;border-radius:6px;mso-padding-alt:12px 20px;">Nominate</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function otherRow(c: RecommendedCategory): string {
  // Flatter treatment: white background, standard border,
  // gold-outline "Nominate" pill.
  return `
  <tr>
    <td style="padding:12px 0 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BORDER};border-radius:8px;background-color:${WHITE};">
        <tr>
          <td valign="middle" style="padding:12px 8px 12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${TEXT};font-weight:500;">${esc(c.name)}</td>
          <td valign="middle" align="right" style="padding:8px 14px 8px 8px;">
            <a href="${esc(c.nominateUrl)}" target="_blank" style="background-color:${WHITE};color:${GOLD_DARK};border:1px solid ${GOLD};display:inline-block;font-family:Arial,Helvetica,sans-serif;font-weight:600;text-align:center;text-decoration:none;padding:11px 18px;font-size:12px;line-height:1.2;letter-spacing:0.08em;text-transform:uppercase;border-radius:6px;mso-padding-alt:11px 18px;">Nominate</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function findMyAwardBody(args: RenderFindMyAwardArgs): string {
  const { brand, firstName, topCategories, otherCategories, nominateAllUrl } = args;
  const topCount = topCategories.length;
  const otherCount = otherCategories.length;
  const totalCount = topCount + otherCount;
  const hasOther = otherCount > 0;
  const greetingName = firstName?.trim() ? esc(firstName.trim()) : 'Friend';

  const topRows = topCategories.map((c, i) => topRow(c, i + 1)).join('');
  const otherRows = otherCategories.map(otherRow).join('');

  // Guideline page URL — same domain as the brand site.
  const guidelineUrl = `${brand.siteUrl}${brand.guidelinePath}`;

  return `<!-- Greeting -->
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT};line-height:1.6;">
  Dear ${greetingName},
</div>

<!-- Headline -->
<h1 style="margin:14px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${TEXT};font-weight:600;">
  Your <span style="color:${GOLD_DARK};">Find My Award</span> results.
</h1>

<p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT_SOFT};">
  Based on your answers, we have matched you with <strong style="color:${TEXT};">${totalCount}</strong> categories at the ${esc(brand.name)}. Tap <strong style="color:${TEXT};">Nominate</strong> on any single category, or use the <strong style="color:${TEXT};">Nominate All</strong> button at the bottom to enter every recommendation in one go.
</p>

<!-- Summary strip — at-a-glance counts before the lists -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:22px;border:1px solid ${BORDER};border-radius:10px;background-color:${BG};">
  <tr>
    <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_SOFT};line-height:1.5;">
      <span style="display:inline-block;width:8px;height:8px;background-color:${GOLD};border-radius:50%;vertical-align:middle;margin-right:8px;">&nbsp;</span>
      <strong style="color:${TEXT};">${topCount}</strong> most popular ${pluralise(topCount, 'pick', 'picks')}
      &nbsp;&middot;&nbsp;
      <strong style="color:${TEXT};">${otherCount}</strong> other ${pluralise(otherCount, 'recommendation', 'recommendations')}
    </td>
  </tr>
</table>

<!-- ============ TOP PICKS — eyebrow + count ============ -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:32px;">
  <tr><td style="padding-bottom:14px;border-bottom:1px solid ${BORDER};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
          Most popular for you
        </td>
        <td valign="middle" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;color:${MUTED};text-transform:uppercase;font-weight:600;">
          ${topCount} highlighted
        </td>
      </tr>
    </table>
    <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.5;color:${TEXT_SOFT};font-style:italic;">
      The categories that align most closely with your answers.
    </div>
  </td></tr>
</table>

<!-- Top picks rows: cream BG, gold left rule, solid gold "Nominate" pill -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:6px;">${topRows}
</table>

${
  hasOther
    ? `
<!-- Gold-rule "&" divider between sections -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:36px;">
  <tr>
    <td style="width:40%;padding:0;"><div style="height:1px;background-color:${GOLD};line-height:1px;font-size:1px;">&nbsp;</div></td>
    <td style="width:20%;padding:0 12px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:0.32em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">&amp;</td>
    <td style="width:40%;padding:0;"><div style="height:1px;background-color:${GOLD};line-height:1px;font-size:1px;">&nbsp;</div></td>
  </tr>
</table>

<!-- ============ OTHER RECOMMENDATIONS — eyebrow + count ============ -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
  <tr><td style="padding-bottom:14px;border-bottom:1px solid ${BORDER};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.22em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;">
          Also worth considering
        </td>
        <td valign="middle" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;color:${MUTED};text-transform:uppercase;font-weight:600;">
          ${otherCount} ${pluralise(otherCount, 'category', 'categories')}
        </td>
      </tr>
    </table>
    <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.5;color:${TEXT_SOFT};font-style:italic;">
      Quieter matches, but no less deserving of your story.
    </div>
  </td></tr>
</table>

<!-- Other rows: white BG, standard border, gold-outline "Nominate" pill -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:6px;">${otherRows}
</table>
`
    : ''
}

<!-- ============ NOMINATE ALL — full-width gold CTA ============ -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:40px;border-top:1px solid ${BORDER};">
  <tr><td align="center" style="padding:28px 0 4px 0;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.32em;color:${GOLD_DARK};text-transform:uppercase;font-weight:600;padding-bottom:12px;">
      One step, every category
    </div>
    <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${TEXT_SOFT};">
      Prefer to enter every recommended category in one sitting? We have pre-selected all ${totalCount} for you.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td align="center">
        <a href="${esc(nominateAllUrl)}" target="_blank" style="background-color:${GOLD};color:${WHITE};display:block;font-family:Arial,Helvetica,sans-serif;font-weight:700;text-align:center;text-decoration:none;padding:18px 28px;font-size:14px;line-height:1.2;letter-spacing:0.1em;text-transform:uppercase;border-radius:8px;mso-padding-alt:18px 28px;">
          Nominate All (${totalCount}) &rarr;
        </a>
      </td></tr>
    </table>

    <p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:${TEXT_SOFT};">
      One form, all <strong style="color:${TEXT};">${totalCount}</strong> categories pre-selected. You can still edit before submitting.
    </p>
  </td></tr>
</table>

<!-- ============ GUIDELINE LINK ============ -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:28px;">
  <tr><td style="padding:18px 20px;background-color:${BG};border:1px solid ${BORDER};border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${TEXT_SOFT};">
    <strong style="color:${TEXT};">First time nominating?</strong> Read the <a href="${esc(guidelineUrl)}" target="_blank" style="color:${GOLD_DARK};text-decoration:underline;font-weight:600;">nomination guideline</a> for tips on what makes a strong entry &mdash; it covers what the judges look for and how to write a memorable submission.
  </td></tr>
</table>

<!-- ============ EDITORIAL CLOSING ============ -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:30px;">
  <tr><td style="padding:20px 0 0 0;border-top:1px solid ${BORDER};">
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${TEXT_SOFT};font-style:italic;">
      Whichever path you choose, we are delighted you have stepped forward. The strongest nominations always begin with a single, considered moment &mdash; and yours has already begun.
    </p>
  </td></tr>
</table>`;
}

/* ---------- Public render entrypoint ---------- */

export function renderFindMyAwardResultsEmail(args: RenderFindMyAwardArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const { brand, topCategories, otherCategories } = args;
  const totalCount = topCategories.length + otherCategories.length;
  const subject = `Your Find My Award results · ${totalCount} ${pluralise(totalCount, 'category', 'categories')} · ${brand.name}`;

  const html = shell({
    brand: args.brand,
    preheader: `${totalCount} ${pluralise(totalCount, 'category', 'categories')} matched. Open to see your shortlist + one-tap nominate links.`,
    bodyHtml: findMyAwardBody(args),
    variant: 'user',
    unsubscribeUrl: args.unsubscribeUrl,
    disclaimer: `You are receiving this email because you finished the Find My Award quiz on ${brand.siteUrl} and asked for the results by email.`,
  });

  // Plaintext fallback — readable as a list and includes every URL.
  const text = [
    `Hello ${args.firstName?.trim() || 'Friend'},`,
    '',
    `Your Find My Award results — ${totalCount} ${pluralise(totalCount, 'category', 'categories')} matched at the ${brand.name}.`,
    '',
    '== Most popular for you ==',
    ...topCategories.map((c, i) => `${i + 1}. ${c.name}\n   Nominate: ${c.nominateUrl}`),
    ...(otherCategories.length
      ? ['', '== Also worth considering ==', ...otherCategories.map((c) => `• ${c.name}\n  Nominate: ${c.nominateUrl}`)]
      : []),
    '',
    `Nominate ALL (${totalCount} categories pre-selected): ${args.nominateAllUrl}`,
    '',
    `First time nominating? Read the guideline: ${brand.siteUrl}${brand.guidelinePath}`,
    '',
    `— The ${brand.name} Team`,
  ].join('\n');

  return { subject, html, text };
}
