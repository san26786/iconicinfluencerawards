/* eslint-disable camelcase */

// Campaign delivery + engagement tracking.
//
//  • email_recipients — one row per (job, email). Replaces the single
//    recipients JSONB blob as the unit of work: per-recipient status, retries,
//    provider message id (for webhook correlation), and a unique tracking token
//    (for the open pixel / click redirect / unsubscribe link).
//  • email_events — append-only log (sent/delivered/opened/clicked/bounced/…)
//    powering the stats view and an audit trail.
//  • email_suppressions — unsubscribed/bounced/complained addresses; checked
//    before every send so a dead or opted-out address is never re-mailed.
//
// Opens/clicks are tracked by us (pixel + link rewrite) so they work for EVERY
// provider including SMTP. Delivered/bounced/complained come from Resend/Mailgun
// webhooks only (raw SMTP can't report them).

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('email_recipients', {
    id: 'id',
    job_id: { type: 'integer', notNull: true, references: 'email_jobs', onDelete: 'CASCADE' },
    email: { type: 'varchar(320)', notNull: true },
    vars: { type: 'jsonb', notNull: true, default: '{}' },
    // pending|sending|sent|delivered|bounced|complained|failed|skipped|unsubscribed
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    attempts: { type: 'integer', notNull: true, default: 0 },
    provider: { type: 'varchar(20)' },
    provider_message_id: { type: 'text' },
    token: { type: 'varchar(64)', notNull: true, unique: true },
    error: { type: 'text' },
    sent_at: { type: 'timestamptz' },
    delivered_at: { type: 'timestamptz' },
    bounced_at: { type: 'timestamptz' },
    opened_at: { type: 'timestamptz' },
    clicked_at: { type: 'timestamptz' },
    open_count: { type: 'integer', notNull: true, default: 0 },
    click_count: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('email_recipients', ['job_id', 'status']);
  pgm.createIndex('email_recipients', 'provider_message_id');
  pgm.createIndex('email_recipients', 'email');

  pgm.createTable('email_events', {
    id: 'id',
    recipient_id: { type: 'integer', references: 'email_recipients', onDelete: 'CASCADE' },
    job_id: { type: 'integer', references: 'email_jobs', onDelete: 'CASCADE' },
    type: { type: 'varchar(20)', notNull: true },
    url: { type: 'text' },
    meta: { type: 'jsonb' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('email_events', ['job_id', 'type']);
  pgm.createIndex('email_events', 'recipient_id');

  pgm.createTable('email_suppressions', {
    id: 'id',
    email: { type: 'varchar(320)', notNull: true, unique: true }, // stored lowercased
    reason: { type: 'varchar(20)', notNull: true }, // bounced|complained|unsubscribed|manual
    job_id: { type: 'integer', references: 'email_jobs', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addColumns('app_settings', {
    resend_webhook_secret: { type: 'text', notNull: true, default: '' },
    mailgun_webhook_signing_key: { type: 'text', notNull: true, default: '' },
    track_opens: { type: 'boolean', notNull: true, default: true },
    track_clicks: { type: 'boolean', notNull: true, default: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('app_settings', [
    'resend_webhook_secret',
    'mailgun_webhook_signing_key',
    'track_opens',
    'track_clicks',
  ]);
  pgm.dropTable('email_events');
  pgm.dropTable('email_suppressions');
  pgm.dropTable('email_recipients');
};
