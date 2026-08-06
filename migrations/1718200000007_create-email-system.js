/* eslint-disable camelcase */

// Email system: reusable templates (designed in the organiser UI), a send
// queue (email_jobs) processed in batches, and a singleton settings row that
// makes the queue cadence configurable. Seeds a few professional starter
// templates so the designer isn't empty on first use.

exports.shorthands = undefined;

// Compact, responsive, on-brand email shell. `body` is the inner HTML.
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

const btn = (label) =>
  `<p style="margin:24px 0"><a href="{{siteUrl}}" style="display:inline-block;background:#caa24a;color:#1a1a1a;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 26px;border-radius:999px">${label}</a></p>`;

const TEMPLATES = [
  {
    name: 'Awards Invitation',
    description: 'Invite a prospect to enter the awards.',
    subject: "{{firstName}}, you're invited to enter the {{siteName}}",
    html: wrap(
      `<h1 style="margin:0 0 12px;font-size:22px">Hello {{firstName}},</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">We'd love for {{company}} to be part of the {{siteName}}. Entering is free and takes only a few minutes — it's a brilliant way to gain recognition and visibility.</p>
${btn('Start your free entry')}
<p style="margin:0;font-size:13px;color:#777">Warm regards,<br>The {{siteName}} team</p>`,
    ),
  },
  {
    name: 'Nomination Reminder',
    description: 'Gentle reminder before the deadline.',
    subject: 'A quick reminder, {{firstName}} — nominations close soon',
    html: wrap(
      `<h1 style="margin:0 0 12px;font-size:22px">Don't miss out, {{firstName}}</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">Nominations for the {{siteName}} are closing soon. There's still time for {{company}} to put a name forward.</p>
${btn('Nominate now')}
<p style="margin:0;font-size:13px;color:#777">See you there,<br>The {{siteName}} team</p>`,
    ),
  },
  {
    name: 'Event Announcement',
    description: 'Announce the ceremony / event.',
    subject: '{{siteName}} — save the date',
    html: wrap(
      `<h1 style="margin:0 0 12px;font-size:22px">Save the date, {{firstName}}</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444">We're delighted to share details of the upcoming {{siteName}} ceremony. We hope you and {{company}} can join us.</p>
${btn('View the details')}
<p style="margin:0;font-size:13px;color:#777">Best wishes,<br>The {{siteName}} team</p>`,
    ),
  },
];

exports.up = (pgm) => {
  pgm.createTable('email_templates', {
    id: 'id',
    name: { type: 'varchar(200)', notNull: true },
    subject: { type: 'text', notNull: true, default: '' },
    html: { type: 'text', notNull: true, default: '' },
    description: { type: 'text' },
    is_system: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('email_jobs', {
    id: 'id',
    template_id: { type: 'integer', references: 'email_templates', onDelete: 'SET NULL' },
    name: { type: 'varchar(200)' },
    subject: { type: 'text', notNull: true, default: '' },
    html: { type: 'text', notNull: true, default: '' },
    recipients: { type: 'jsonb', notNull: true, default: '[]' }, // [{ email, vars }]
    status: { type: 'varchar(20)', notNull: true, default: 'queued' }, // queued|sending|done|paused
    cursor: { type: 'integer', notNull: true, default: 0 },
    sent_count: { type: 'integer', notNull: true, default: 0 },
    fail_count: { type: 'integer', notNull: true, default: 0 },
    total: { type: 'integer', notNull: true, default: 0 },
    batch_size: { type: 'integer', notNull: true, default: 10 },
    interval_seconds: { type: 'integer', notNull: true, default: 120 },
    next_run_at: { type: 'timestamptz' },
    last_error: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('email_jobs', 'status');

  pgm.createTable('app_settings', {
    id: { type: 'integer', primaryKey: true, default: 1 },
    email_batch_size: { type: 'integer', notNull: true, default: 25 },
    email_interval_seconds: { type: 'integer', notNull: true, default: 120 },
    email_small_threshold: { type: 'integer', notNull: true, default: 10 },
    email_small_gap_seconds: { type: 'integer', notNull: true, default: 6 },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql('INSERT INTO app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;');

  for (const t of TEMPLATES) {
    pgm.sql(
      `INSERT INTO email_templates (name, subject, html, description, is_system)
       VALUES ($pga$${t.name}$pga$, $pga$${t.subject}$pga$, $pga$${t.html}$pga$, $pga$${t.description}$pga$, true);`,
    );
  }
};

exports.down = (pgm) => {
  pgm.dropTable('email_jobs');
  pgm.dropTable('app_settings');
  pgm.dropTable('email_templates');
};
