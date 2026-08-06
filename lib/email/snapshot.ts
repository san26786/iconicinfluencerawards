// Shared recipient-snapshot logic for campaigns AND reminders. Given a set of
// potential_users rows, it dedupes by lowercased email, drops suppressed
// addresses, builds each recipient's template variables (incl. a stable
// {{nominationLink}}) and a unique tracking token, then either creates a new
// email_jobs row with its email_recipients (snapshotJob) or appends recipients
// to an existing reminder job (enrollRecipients).
//
// Both accept an optional `client` so the caller can run the snapshot inside
// its own transaction (the reminder scheduler does this to keep job creation +
// flow-run advancement atomic).

import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { query, withTransaction } from "@/lib/db";
import { ensureOnce } from "@/lib/ensureOnce";
import { getBrandConfig } from "@/lib/email/brand";
import type { SiteData } from "@/lib/site";
import { varsForPotentialUser } from "@/lib/email/template";
import {
  getOrCreatePrefillTokens,
  getPublicBaseUrl,
  prefillLink,
} from "@/lib/email/prefill";

export function ensureSiteIdColumn() {
  return ensureOnce('email_jobs-site_id', () =>
    query(`ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL`).then(() => {}),
  );
}

export type SnapshotUser = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  title: string | null;
  position: string | null;
  gender: string | null;
  custom: Record<string, unknown> | null;
};

export type SnapshotTemplate = {
  templateId: number;
  name: string;
  subject: string;
  html: string;
};

export type FlowLinkage = {
  kind: "campaign" | "reminder";
  parentJobId?: number | null;
  flowId?: number | null;
  flowRunId?: number | null;
  flowStepId?: number | null;
  enrollOpen?: boolean;
};

type RecipientRow = { email: string; vars: string; token: string };

// Query through the caller's transaction client when given, else the pool.
function runner(client?: PoolClient) {
  return <T extends Record<string, unknown>>(text: string, params?: unknown[]) =>
    client
      ? client.query<T>(text, params as never)
      : query<T>(text, params);
}

/** Dedupe by email, drop suppressed, build {email, vars, token} per survivor. */
async function buildRecipientRows(
  users: SnapshotUser[],
  client?: PoolClient,
  site?: SiteData,
): Promise<{ rows: RecipientRow[]; candidates: number }> {
  const run = runner(client);
  const brand = getBrandConfig(site);
  const brandCtx = {
    siteName: brand.name,
    siteUrl: brand.siteUrl,
    year: brand.year,
  };

  const byEmail = new Map<string, SnapshotUser>();
  for (const u of users) {
    const e = (u.email || "").trim().toLowerCase();
    if (e && !byEmail.has(e)) byEmail.set(e, u);
  }
  const candidateEmails = [...byEmail.keys()];
  if (candidateEmails.length === 0) return { rows: [], candidates: 0 };

  const supRes = await run<{ email: string }>(
    "SELECT email FROM email_suppressions WHERE email = ANY($1::text[]) AND deleted_at IS NULL",
    [candidateEmails],
  );
  const suppressed = new Set(supRes.rows.map((r) => r.email));
  const survivorEmails = candidateEmails.filter((e) => !suppressed.has(e));

  const baseUrl = getPublicBaseUrl(brand.siteUrl);
  const prefillTokens = baseUrl
    ? await getOrCreatePrefillTokens(
        "potential_user",
        survivorEmails.map((e) => byEmail.get(e)!.id),
      )
    : new Map<number, string>();

  const rows: RecipientRow[] = survivorEmails.map((e) => {
    const u = byEmail.get(e)!;
    const v = varsForPotentialUser(u, brandCtx);
    const tok = prefillTokens.get(u.id);
    if (baseUrl && tok) v.nominationLink = prefillLink(baseUrl, tok);
    return {
      email: e,
      vars: JSON.stringify(v),
      token: crypto.randomBytes(24).toString("base64url"),
    };
  });
  return { rows, candidates: candidateEmails.length };
}

/**
 * Create a new email_jobs (queued) + its email_recipients for `users`.
 * Returns null when there are no survivors (all suppressed / empty input).
 * When `client` is passed, runs inside that transaction; otherwise opens its
 * own (so the worker never sees a job before its recipients exist).
 */
export async function snapshotJob(args: {
  users: SnapshotUser[];
  template: SnapshotTemplate;
  cadence: { batchSize: number; intervalSeconds: number };
  flow?: FlowLinkage;
  jobName?: string;
  client?: PoolClient;
  /** The tenant site this campaign belongs to — drives its sender mailbox + branding. */
  site?: SiteData;
}): Promise<{ jobId: number; total: number; skipped: number } | null> {
  const flow: FlowLinkage = args.flow ?? { kind: "campaign" };
  const built = await buildRecipientRows(args.users, args.client, args.site);
  if (built.rows.length === 0) return null;
  const total = built.rows.length;
  const skipped = built.candidates - total;

  const insert = async (client: PoolClient): Promise<number> => {
    await ensureSiteIdColumn();
    const jobRes = await client.query<{ id: number }>(
      `INSERT INTO email_jobs
         (template_id, name, subject, html, status, total, batch_size, interval_seconds, next_run_at,
          kind, parent_job_id, flow_id, flow_run_id, flow_step_id, enroll_open, site_id)
       VALUES ($1,$2,$3,$4,'queued',$5,$6,$7, now(), $8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        args.template.templateId,
        args.jobName ?? args.template.name,
        args.template.subject,
        args.template.html,
        total,
        args.cadence.batchSize,
        args.cadence.intervalSeconds,
        flow.kind,
        flow.parentJobId ?? null,
        flow.flowId ?? null,
        flow.flowRunId ?? null,
        flow.flowStepId ?? null,
        flow.enrollOpen ?? false,
        args.site?.id ?? null,
      ],
    );
    const id = jobRes.rows[0].id;
    await client.query(
      `INSERT INTO email_recipients (job_id, email, vars, token)
       SELECT $1, x.email, x.vars::jsonb, x.token
         FROM unnest($2::text[], $3::text[], $4::text[]) AS x(email, vars, token)`,
      [
        id,
        built.rows.map((r) => r.email),
        built.rows.map((r) => r.vars),
        built.rows.map((r) => r.token),
      ],
    );
    return id;
  };

  const jobId = args.client
    ? await insert(args.client)
    : await withTransaction(insert);
  return { jobId, total, skipped };
}

/**
 * Append eligible recipients to an EXISTING reminder job (rolling enrollment).
 * Skips anyone already present in that job. Returns the number added.
 */
export async function enrollRecipients(args: {
  reminderJobId: number;
  users: SnapshotUser[];
  client?: PoolClient;
  /** The tenant site this job belongs to (branding for the enrolled recipients' vars). */
  site?: SiteData;
}): Promise<number> {
  const built = await buildRecipientRows(args.users, args.client, args.site);
  if (built.rows.length === 0) return 0;
  const run = runner(args.client);
  const res = await run(
    `INSERT INTO email_recipients (job_id, email, vars, token)
     SELECT $1, x.email, x.vars::jsonb, x.token
       FROM unnest($2::text[], $3::text[], $4::text[]) AS x(email, vars, token)
      WHERE NOT EXISTS (
        SELECT 1 FROM email_recipients r WHERE r.job_id = $1 AND r.email = x.email
      )`,
    [
      args.reminderJobId,
      built.rows.map((r) => r.email),
      built.rows.map((r) => r.vars),
      built.rows.map((r) => r.token),
    ],
  );
  const added = res.rowCount ?? 0;
  // Keep the job's `total` in sync with its (now larger) recipient set, so
  // every percentage/progress reading stays correct as enrollment rolls.
  if (added > 0) {
    await run(
      `UPDATE email_jobs
          SET total = (SELECT count(*) FROM email_recipients WHERE job_id = $1),
              updated_at = now()
        WHERE id = $1`,
      [args.reminderJobId],
    );
  }
  return added;
}
