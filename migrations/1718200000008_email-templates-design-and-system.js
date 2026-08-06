/* eslint-disable camelcase */

// Two things:
//  1. `design` jsonb + `slug` on email_templates. `design` stores the block
//     structure from the visual designer (so it can be re-edited); `html` is
//     the rendered output used for sending. `slug` identifies templates that
//     the app triggers automatically (welcome / nomination emails).
//  2. Seeds those automatic ("system process") templates so they exist — and
//     are editable — out of the box.

exports.shorthands = undefined;

const wrap = (body) => `<!doctype html><html><body style="margin:0;background:#0b0b12;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;padding-bottom:20px"><span style="font-size:20px;font-weight:bold;letter-spacing:2px;color:#caa24a">{{siteName}}</span></div>
  <div style="background:#ffffff;border-radius:16px;padding:32px;color:#1a1a1a">
${body}
  </div>
  <p style="text-align:center;margin:18px 0 0;font-size:11px;color:#777">© {{year}} {{siteName}} · <a href="{{siteUrl}}" style="color:#8a6d1f">{{siteUrl}}</a></p>
</div></body></html>`;

const btn = (label, href) =>
  `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#caa24a;color:#1a1a1a;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 26px;border-radius:999px">${label}</a></p>`;

const SYSTEM = [
  {
    slug: 'welcome',
    name: 'Welcome (new account)',
    description: 'Sent automatically when someone registers. Vars: firstName, lastName, email.',
    subject: 'Welcome to {{siteName}}, {{firstName}}!',
    html: wrap(
      `<h1 style="margin:0 0 12px;font-size:22px">Welcome, {{firstName}}!</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">Thanks for creating your account with {{siteName}}. You can now complete your awards profile and track your nominations any time.</p>
${btn('Go to my account', '{{siteUrl}}')}
<p style="margin:0;font-size:13px;color:#777">See you soon,<br>The {{siteName}} team</p>`,
    ),
  },
  {
    slug: 'nominee_confirmation',
    name: 'Nomination — nominee notice',
    description: 'Sent to the nominee when a nomination is submitted. Vars: nomineeName, nominatorName, categories.',
    subject: "You've been nominated for the {{siteName}}!",
    html: wrap(
      `<h1 style="margin:0 0 12px;font-size:22px">Congratulations, {{nomineeName}}!</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">You've been nominated for the {{siteName}} in: <strong>{{categories}}</strong>.</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">We'll be in touch with the next steps. In the meantime you can find out more below.</p>
${btn('Find out more', '{{siteUrl}}')}
<p style="margin:0;font-size:13px;color:#777">Warm regards,<br>The {{siteName}} team</p>`,
    ),
  },
  {
    slug: 'nominator_thankyou',
    name: 'Nomination — nominator thank-you',
    description: 'Sent to the person who submitted a nomination. Vars: nominatorName, nomineeName, categories.',
    subject: 'Thank you for your nomination',
    html: wrap(
      `<h1 style="margin:0 0 12px;font-size:22px">Thank you, {{nominatorName}}</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">Thanks for nominating <strong>{{nomineeName}}</strong> for the {{siteName}} in {{categories}}. Your support helps us celebrate the very best.</p>
${btn('Visit the awards', '{{siteUrl}}')}
<p style="margin:0;font-size:13px;color:#777">With thanks,<br>The {{siteName}} team</p>`,
    ),
  },
];

exports.up = (pgm) => {
  pgm.addColumns('email_templates', {
    design: { type: 'jsonb' },
    slug: { type: 'varchar(80)' },
  });
  pgm.addConstraint('email_templates', 'email_templates_slug_unique', { unique: 'slug' });

  for (const t of SYSTEM) {
    pgm.sql(
      `INSERT INTO email_templates (name, subject, html, description, is_system, slug)
       VALUES ($pga$${t.name}$pga$, $pga$${t.subject}$pga$, $pga$${t.html}$pga$, $pga$${t.description}$pga$, true, $pga$${t.slug}$pga$)
       ON CONFLICT (slug) DO NOTHING;`,
    );
  }
};

exports.down = (pgm) => {
  pgm.sql("DELETE FROM email_templates WHERE slug IN ('welcome','nominee_confirmation','nominator_thankyou');");
  pgm.dropConstraint('email_templates', 'email_templates_slug_unique');
  pgm.dropColumns('email_templates', ['design', 'slug']);
};
