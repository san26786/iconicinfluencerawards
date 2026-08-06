// Reminder flow scheduler. Called every worker tick (from the queue processor).
// For each active flow run + enabled step, it rolls per-recipient enrollment:
// recipients of the step's SOURCE job who crossed their personal
// `sent_at + delay` threshold and match the audience are appended to that
// step's reminder job (created lazily on the first eligible recipient). The
// existing worker then sends them — so reminders trickle out per-recipient, in
// parallel with the still-running base campaign, respecting cadence + window.
//
// Idempotency rests on the unique index email_jobs(flow_run_id, flow_step_id);
// double-enrollment is prevented by the audience query + an INSERT … NOT EXISTS.

import type { PoolClient } from "pg";
import { query, withTransaction } from "@/lib/db";
import {
  snapshotJob,
  enrollRecipients,
  ensureSiteIdColumn,
  type SnapshotUser,
  type SnapshotTemplate,
} from "@/lib/email/snapshot";
import { buildEligibleAudienceQuery, type AudienceSpec } from "@/lib/email/audience";
import { getSiteById, type SiteData } from "@/lib/site";

type RunRow = { id: number; flow_id: number; base_job_id: number };
type StepRow = {
  id: number;
  position: number;
  name: string;
  template_id: number | null;
  delay_minutes: number;
  delay_from: string;
  audience: AudienceSpec | null;
  enabled: boolean;
};

type Cadence = { batchSize: number; intervalSeconds: number };

export async function processFlows(): Promise<void> {
  const setRes = await query<{
    reminder_default_delay_minutes: number;
    email_batch_size: number;
    email_interval_seconds: number;
  }>(
    "SELECT reminder_default_delay_minutes, email_batch_size, email_interval_seconds FROM app_settings WHERE id=1",
  );
  const s = setRes.rows[0];
  const defaultDelay = s?.reminder_default_delay_minutes ?? 240;
  const cadence: Cadence = {
    batchSize: s?.email_batch_size ?? 25,
    intervalSeconds: s?.email_interval_seconds ?? 120,
  };

  const runs = await query<RunRow>(
    `SELECT r.id, r.flow_id, r.base_job_id
       FROM email_flow_runs r
       JOIN email_flows f ON f.id = r.flow_id
      WHERE r.status = 'active' AND f.enabled = true AND f.deleted_at IS NULL
      ORDER BY r.id
      LIMIT 50`,
  );

  for (const run of runs.rows) {
    try {
      await processRun(run, defaultDelay, cadence);
    } catch (err) {
      console.error("[flows] run failed", run.id, err);
    }
  }
}

async function processRun(
  run: RunRow,
  defaultDelay: number,
  cadence: Cadence,
): Promise<void> {
  const stepsRes = await query<StepRow>(
    `SELECT id, position, name, template_id, delay_minutes, delay_from, audience, enabled
       FROM email_flow_steps WHERE flow_id = $1 ORDER BY position`,
    [run.flow_id],
  );
  const steps = stepsRes.rows.filter((st) => st.enabled);
  if (steps.length === 0) return;

  // Reminder jobs inherit the base campaign's site, so follow-ups keep the
  // same sender mailbox + branding as the campaign they're chained from.
  await ensureSiteIdColumn();
  const baseSiteRes = await query<{ site_id: number | null }>(
    "SELECT site_id FROM email_jobs WHERE id = $1", [run.base_job_id],
  );
  const baseSiteId = baseSiteRes.rows[0]?.site_id ?? null;
  const site: SiteData | undefined = baseSiteId != null
    ? (await getSiteById(baseSiteId)) ?? undefined
    : undefined;

  let unresolved = false; // any step still able to produce / drain more later
  let prevReminderJobId: number | null = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    // Source: either the base campaign or the previous reminder, depending on
    // the step's configured anchor.
    const sourceJobId =
      i === 0 || step.delay_from === "initial" ? run.base_job_id : prevReminderJobId;
    if (sourceJobId == null) {
      // Previous step hasn't produced a reminder job yet → can't proceed.
      unresolved = true;
      break;
    }
    const delay = step.delay_minutes ?? defaultDelay;
    const audience = step.audience ?? {};
    const sourceExhausted = await sourceEnrollmentExhausted(sourceJobId, delay);

    const jobRes = await query<{ id: number; enroll_open: boolean }>(
      "SELECT id, enroll_open FROM email_jobs WHERE flow_run_id = $1 AND flow_step_id = $2",
      [run.id, step.id],
    );
    let reminderJobId: number | null = jobRes.rows[0]?.id ?? null;
    let enrollOpen: boolean = jobRes.rows[0]?.enroll_open ?? false;

    if (reminderJobId == null) {
      // Lazy creation — only once there's at least one eligible recipient.
      const elig = buildEligibleAudienceQuery(audience, sourceJobId, delay, null, run.id, site?.id ?? null);
      const users = await query<SnapshotUser>(elig.text, elig.params);
      if (users.rows.length > 0) {
        const tpl = await loadTemplate(step.template_id);
        if (!tpl) {
          // Misconfigured step (no/deleted template) — can't proceed past it.
          unresolved = true;
          break;
        }
        const created = await withTransaction(
          (
            client: PoolClient,
          ): Promise<{ jobId: number; total: number; skipped: number } | null> =>
            snapshotJob({
              users: users.rows,
              template: tpl,
              cadence,
              jobName: tpl.name,
              flow: {
                kind: "reminder",
                parentJobId: sourceJobId,
                flowId: run.flow_id,
                flowRunId: run.id,
                flowStepId: step.id,
                enrollOpen: !sourceExhausted,
              },
              client,
              site,
            }),
        );
        reminderJobId = created?.jobId ?? null;
        enrollOpen = !sourceExhausted;
        if (enrollOpen) unresolved = true;
      } else {
        // No eligibles yet. If the source can still produce more, keep waiting;
        // either way later steps have no source to chain from this tick.
        if (!sourceExhausted) unresolved = true;
        break;
      }
    } else if (enrollOpen) {
      // Roll: append any newly-eligible recipients, then close if exhausted.
      const elig = buildEligibleAudienceQuery(audience, sourceJobId, delay, reminderJobId, run.id, site?.id ?? null);
      const users = await query<SnapshotUser>(elig.text, elig.params);
      if (users.rows.length > 0) {
        await withTransaction(async (client) => {
          await enrollRecipients({ reminderJobId: reminderJobId!, users: users.rows, client, site });
          // Wake the job so the worker picks the new recipients up promptly.
          await client.query(
            `UPDATE email_jobs
                SET status = CASE WHEN status = 'done' THEN 'queued' ELSE status END,
                    next_run_at = now(), updated_at = now()
              WHERE id = $1`,
            [reminderJobId],
          );
        });
      }
      if (sourceExhausted) {
        await query(
          "UPDATE email_jobs SET enroll_open = false, updated_at = now() WHERE id = $1",
          [reminderJobId],
        );
        enrollOpen = false;
      } else {
        unresolved = true;
      }
    }

    prevReminderJobId = reminderJobId;
  }

  // Mark the run done once the base campaign has finished AND no step can
  // enroll/produce anything further. (Cosmetic — a still-active drained run
  // just does a few cheap no-op queries per tick.)
  if (!unresolved) {
    const base = await query<{ status: string }>(
      "SELECT status FROM email_jobs WHERE id = $1",
      [run.base_job_id],
    );
    if (base.rows[0]?.status === "done") {
      await query(
        "UPDATE email_flow_runs SET status = 'done', updated_at = now() WHERE id = $1",
        [run.id],
      );
    }
  }
}

// True when the source job is done sending AND every reached recipient has
// already crossed its `sent_at + delay` threshold — so no NEW recipient can
// become eligible (enrollment for that step can close).
async function sourceEnrollmentExhausted(
  sourceJobId: number,
  delayMinutes: number,
): Promise<boolean> {
  const r = await query<{ exhausted: boolean }>(
    `SELECT (
        (SELECT status FROM email_jobs WHERE id = $1) = 'done'
        AND NOT EXISTS (
          SELECT 1 FROM email_recipients
           WHERE job_id = $1 AND status IN ('sent','delivered') AND sent_at IS NOT NULL
             AND sent_at + ($2 || ' minutes')::interval > now()
        )
      ) AS exhausted`,
    [sourceJobId, delayMinutes],
  );
  return r.rows[0]?.exhausted ?? false;
}

async function loadTemplate(
  templateId: number | null,
): Promise<SnapshotTemplate | null> {
  if (templateId == null) return null;
  const r = await query<{ id: number; name: string; subject: string; html: string }>(
    "SELECT id, name, subject, html FROM email_templates WHERE id = $1 AND deleted_at IS NULL",
    [templateId],
  );
  const t = r.rows[0];
  return t
    ? { templateId: t.id, name: t.name, subject: t.subject, html: t.html }
    : null;
}
