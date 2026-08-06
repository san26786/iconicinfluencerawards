/* eslint-disable camelcase */

// Reminder email "flows": an ordered list of steps, each a follow-up email with
// a delay + an audience filter (engagement + potential-user attributes). A flow
// is attached to a campaign (email_flow_runs). Reminders are materialised as
// ordinary email_jobs (kind='reminder') and drained by the SAME queue worker,
// so cadence, send-window, tracking and pause/resume all apply unchanged.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('email_flows', {
    id: 'id',
    name: { type: 'varchar(200)', notNull: true },
    description: { type: 'text' },
    enabled: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('email_flow_steps', {
    id: 'id',
    flow_id: { type: 'integer', notNull: true, references: 'email_flows', onDelete: 'CASCADE' },
    position: { type: 'integer', notNull: true, default: 1 },
    name: { type: 'varchar(200)', notNull: true, default: '' },
    template_id: { type: 'integer', references: 'email_templates', onDelete: 'SET NULL' },
    delay_minutes: { type: 'integer', notNull: true, default: 240 },
    delay_from: { type: 'varchar(10)', notNull: true, default: 'initial' }, // initial|previous
    audience: { type: 'jsonb', notNull: true, default: '{}' },
    enabled: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('email_flow_steps', 'email_flow_steps_flow_position_unique', {
    unique: ['flow_id', 'position'],
  });
  pgm.createIndex('email_flow_steps', 'flow_id');

  pgm.createTable('email_flow_runs', {
    id: 'id',
    flow_id: { type: 'integer', notNull: true, references: 'email_flows', onDelete: 'CASCADE' },
    base_job_id: { type: 'integer', notNull: true, references: 'email_jobs', onDelete: 'CASCADE' },
    status: { type: 'varchar(10)', notNull: true, default: 'active' }, // active|done|cancelled
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('email_flow_runs', 'email_flow_runs_base_job_unique', {
    unique: ['base_job_id'],
  });
  pgm.createIndex('email_flow_runs', 'status');

  pgm.addColumns('email_jobs', {
    parent_job_id: { type: 'integer' }, // the SOURCE job a reminder draws from
    flow_id: { type: 'integer' },
    flow_run_id: { type: 'integer' },
    flow_step_id: { type: 'integer' },
    kind: { type: 'varchar(12)', notNull: true, default: 'campaign' }, // campaign|reminder
    enroll_open: { type: 'boolean', notNull: true, default: false }, // reminder still enrolling
  });
  // Exactly one reminder job per (run, step) — the scheduler's idempotency guard.
  pgm.createIndex('email_jobs', ['flow_run_id', 'flow_step_id'], {
    unique: true,
    where: 'flow_run_id IS NOT NULL',
    name: 'email_jobs_flow_run_step_unique',
  });
  pgm.createIndex('email_jobs', ['kind', 'enroll_open']);
};

exports.down = (pgm) => {
  pgm.dropIndex('email_jobs', ['kind', 'enroll_open']);
  pgm.dropIndex('email_jobs', ['flow_run_id', 'flow_step_id'], {
    name: 'email_jobs_flow_run_step_unique',
  });
  pgm.dropColumns('email_jobs', [
    'parent_job_id',
    'flow_id',
    'flow_run_id',
    'flow_step_id',
    'kind',
    'enroll_open',
  ]);
  pgm.dropTable('email_flow_runs');
  pgm.dropTable('email_flow_steps');
  pgm.dropTable('email_flows');
};
