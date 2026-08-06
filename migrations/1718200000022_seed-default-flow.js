/* eslint-disable camelcase */

// Seed a default reminder flow: one step, ~4h after the initial send, to anyone
// who opened or clicked. All of it is editable later in the Email Flows UI.
// Idempotent (guarded by NOT EXISTS) so re-running migrations never duplicates.

exports.shorthands = undefined;

const wrap = (body) => `<!doctype html><html><body style="margin:0;background:#0b0b12;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;padding-bottom:20px">
    <span style="font-size:20px;font-weight:bold;letter-spacing:2px;color:#caa24a">{{siteName}}</span>
  </div>
  <div style="background:#ffffff;border-radius:16px;padding:32px;color:#1a1a1a">
${body}
  </div>
  <p style="text-align:center;margin:18px 0 0;font-size:11px;color:#777">© {{year}} {{siteName}} · <a href="{{siteUrl}}" style="color:#8a6d1f">{{siteUrl}}</a></p>
</div></body></html>`;

const REMINDER_NAME = '4-Hour Reminder';
const REMINDER_DESC =
  'Follow-up sent ~4 hours after the initial email to people who opened or clicked.';
const REMINDER_SUBJECT = 'Just checking in, {{firstName}}';
const REMINDER_HTML = wrap(
  `<h1 style="margin:0 0 12px;font-size:22px">Hi {{firstName}},</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">We noticed you had a look at our earlier email — thank you! If you'd like to put {{company}} forward, it only takes a few minutes and it's completely free.</p>
<p style="margin:24px 0"><a href="{{nominationLink}}" style="display:inline-block;background:#caa24a;color:#1a1a1a;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 26px;border-radius:999px">Complete your nomination</a></p>
<p style="margin:0;font-size:13px;color:#777">Warm regards,<br>The {{siteName}} team</p>`,
);

const FLOW_NAME = '4-hour reminder to engaged';
const FLOW_DESC =
  'Sends one reminder ~4 hours after the initial email to recipients who opened or clicked.';
const STEP_AUDIENCE = '{"engagement":"opened_or_clicked"}';

exports.up = (pgm) => {
  // 1. Reminder template (only if one with this name doesn't already exist).
  pgm.sql(`INSERT INTO email_templates (name, subject, html, description, is_system)
    SELECT $pga$${REMINDER_NAME}$pga$, $pga$${REMINDER_SUBJECT}$pga$, $pga$${REMINDER_HTML}$pga$, $pga$${REMINDER_DESC}$pga$, true
     WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = $pga$${REMINDER_NAME}$pga$);`);

  // 2. The flow.
  pgm.sql(`INSERT INTO email_flows (name, description, enabled)
    SELECT $pga$${FLOW_NAME}$pga$, $pga$${FLOW_DESC}$pga$, true
     WHERE NOT EXISTS (SELECT 1 FROM email_flows WHERE name = $pga$${FLOW_NAME}$pga$);`);

  // 3. Step 1 — 4h after the initial send, to openers/clickers.
  pgm.sql(`INSERT INTO email_flow_steps (flow_id, position, name, template_id, delay_minutes, delay_from, audience, enabled)
    SELECT f.id, 1, $pga$4-hour reminder$pga$,
           (SELECT id FROM email_templates WHERE name = $pga$${REMINDER_NAME}$pga$ ORDER BY id LIMIT 1),
           240, 'initial', $pga$${STEP_AUDIENCE}$pga$::jsonb, true
      FROM email_flows f
     WHERE f.name = $pga$${FLOW_NAME}$pga$
       AND NOT EXISTS (SELECT 1 FROM email_flow_steps s WHERE s.flow_id = f.id AND s.position = 1);`);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM email_flows WHERE name = $pga$${FLOW_NAME}$pga$;`); // cascades to steps
  pgm.sql(`DELETE FROM email_templates WHERE name = $pga$${REMINDER_NAME}$pga$ AND is_system = true;`);
};
