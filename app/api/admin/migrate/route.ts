import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Each step is { name, sql } — all statements are idempotent.
const STEPS = [
  {
    name: '033_judge-role',
    sql: `
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('visitor', 'organiser', 'judge'));
    `,
  },
  {
    name: '034_judges',
    sql: `
      CREATE TABLE IF NOT EXISTS judges (
        id            serial PRIMARY KEY,
        site_id       integer NOT NULL REFERENCES sites ON DELETE CASCADE,
        user_id       integer REFERENCES users ON DELETE SET NULL,
        first_name    varchar(120) NOT NULL,
        last_name     varchar(120) NOT NULL,
        email         varchar(255) NOT NULL,
        phone         varchar(50),
        company       varchar(200),
        job_title     varchar(200),
        bio           text,
        expertise     text,
        linkedin      varchar(255),
        status        varchar(20) NOT NULL DEFAULT 'pending',
        applied_at    timestamptz NOT NULL DEFAULT now(),
        approved_at   timestamptz,
        approved_by   integer REFERENCES users ON DELETE SET NULL,
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now()
      );
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'judges_status_check'
        ) THEN
          ALTER TABLE judges ADD CONSTRAINT judges_status_check
            CHECK (status IN ('pending', 'approved', 'rejected'));
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS judges_site_id_idx  ON judges (site_id);
      CREATE INDEX IF NOT EXISTS judges_status_idx   ON judges (status);
      CREATE INDEX IF NOT EXISTS judges_email_idx    ON judges (email);
    `,
  },
  {
    name: '035_award-categories',
    sql: `
      CREATE TABLE IF NOT EXISTS award_categories (
        id                       serial PRIMARY KEY,
        site_id                  integer NOT NULL REFERENCES sites ON DELETE CASCADE,
        category_id              varchar(120) NOT NULL,
        category_name            varchar(200),
        include_in_eligibility   boolean NOT NULL DEFAULT true,
        nominations_count        integer NOT NULL DEFAULT 0,
        applications_count       integer NOT NULL DEFAULT 0,
        judges_count             integer NOT NULL DEFAULT 0,
        include_in_graph         boolean NOT NULL DEFAULT true,
        applicant_level_judging  boolean NOT NULL DEFAULT false,
        excluded_in_stats        boolean NOT NULL DEFAULT false,
        created_at               timestamptz NOT NULL DEFAULT now(),
        updated_at               timestamptz NOT NULL DEFAULT now()
      );
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'award_categories_site_category_unique'
        ) THEN
          ALTER TABLE award_categories ADD CONSTRAINT award_categories_site_category_unique
            UNIQUE (site_id, category_id);
        END IF;
      END $$;
    `,
  },
  {
    name: '036_judge-categories',
    sql: `
      CREATE TABLE IF NOT EXISTS judge_categories (
        id           serial PRIMARY KEY,
        judge_id     integer NOT NULL REFERENCES judges ON DELETE CASCADE,
        site_id      integer NOT NULL REFERENCES sites  ON DELETE CASCADE,
        category_id  varchar(120) NOT NULL,
        allocated_at timestamptz NOT NULL DEFAULT now()
      );
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'judge_categories_unique'
        ) THEN
          ALTER TABLE judge_categories ADD CONSTRAINT judge_categories_unique
            UNIQUE (judge_id, category_id);
        END IF;
      END $$;
    `,
  },
  {
    name: '037_judge-applicants',
    sql: `
      CREATE TABLE IF NOT EXISTS judge_applicants (
        id            serial PRIMARY KEY,
        judge_id      integer NOT NULL REFERENCES judges      ON DELETE CASCADE,
        nomination_id integer NOT NULL REFERENCES nominations ON DELETE CASCADE,
        site_id       integer NOT NULL REFERENCES sites       ON DELETE CASCADE,
        allocated_at  timestamptz NOT NULL DEFAULT now()
      );
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'judge_applicants_unique'
        ) THEN
          ALTER TABLE judge_applicants ADD CONSTRAINT judge_applicants_unique
            UNIQUE (judge_id, nomination_id);
        END IF;
      END $$;
    `,
  },
  {
    name: '038_judge-scores',
    sql: `
      CREATE TABLE IF NOT EXISTS judge_scores (
        id            serial PRIMARY KEY,
        judge_id      integer NOT NULL REFERENCES judges      ON DELETE CASCADE,
        nomination_id integer NOT NULL REFERENCES nominations ON DELETE CASCADE,
        site_id       integer NOT NULL REFERENCES sites       ON DELETE CASCADE,
        score               integer,
        notes               text,
        marked_first        boolean NOT NULL DEFAULT false,
        marked_semifinalist boolean NOT NULL DEFAULT false,
        marked_finalist     boolean NOT NULL DEFAULT false,
        scored_at   timestamptz,
        updated_at  timestamptz NOT NULL DEFAULT now()
      );
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'judge_scores_unique') THEN
          ALTER TABLE judge_scores ADD CONSTRAINT judge_scores_unique UNIQUE (judge_id, nomination_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'judge_scores_score_range') THEN
          ALTER TABLE judge_scores ADD CONSTRAINT judge_scores_score_range
            CHECK (score IS NULL OR (score >= 1 AND score <= 10));
        END IF;
      END $$;
    `,
  },
  {
    name: '039_nominations-judging',
    sql: `
      ALTER TABLE nominations
        ADD COLUMN IF NOT EXISTS avg_score       numeric(5,2),
        ADD COLUMN IF NOT EXISTS is_shortlisted  boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_semifinalist boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_finalist     boolean NOT NULL DEFAULT false;
    `,
  },
  {
    name: '040_judge-social',
    sql: `
      ALTER TABLE judges
        ADD COLUMN IF NOT EXISTS facebook varchar(255),
        ADD COLUMN IF NOT EXISTS twitter  varchar(255);
    `,
  },
  {
    name: '041_judge-terms',
    sql: `
      ALTER TABLE judges
        ADD COLUMN IF NOT EXISTS agreed_to_terms boolean NOT NULL DEFAULT false;
    `,
  },
  {
    name: '042_judge-profile-pic',
    sql: `
      ALTER TABLE judges
        ADD COLUMN IF NOT EXISTS profile_pic_url text;
    `,
  },
  // 043 seeded another tenant's `sites` row. This repo shares its Postgres
  // with the other awards sites, so running it from here would overwrite that
  // tenant's branding — it is deliberately not carried over. Schema migrations
  // are safe to share; tenant data seeds are not.
  {
    name: '044_events',
    sql: `
      CREATE TABLE IF NOT EXISTS events (
        id            serial PRIMARY KEY,
        site_id       integer NOT NULL REFERENCES sites ON DELETE CASCADE,
        title         varchar(200) NOT NULL,
        description   text,
        event_date    timestamptz,
        event_date_label varchar(100),
        venue         varchar(200),
        venue_address text,
        ticket_url    varchar(500),
        is_featured   boolean NOT NULL DEFAULT false,
        status        varchar(20) NOT NULL DEFAULT 'upcoming',
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now()
      );
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_status_check') THEN
          ALTER TABLE events ADD CONSTRAINT events_status_check
            CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'));
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS events_site_id_idx ON events (site_id);
    `,
  },
  {
    // 039 added is_shortlisted / is_semifinalist / is_finalist but stopped short
    // of the result itself, leaving the public /winners page nothing to read.
    name: '054_nominations-is-winner',
    sql: `
      ALTER TABLE nominations
        ADD COLUMN IF NOT EXISTS is_winner boolean NOT NULL DEFAULT false;
    `,
  },
];

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { name: string; ok: boolean; error?: string }[] = [];

  for (const step of STEPS) {
    try {
      await query(step.sql);
      results.push({ name: step.name, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name: step.name, ok: false, error: message });
      // Continue with remaining steps — some may already exist
    }
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({ ok: failed.length === 0, results }, {
    status: failed.length === 0 ? 200 : 207,
  });
}
