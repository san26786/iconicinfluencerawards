// Organiser-only: queue a send. Picks the cadence automatically — small lists
// go 1-by-1 with a short gap; larger lists send in batches on an interval. Both
// are configurable in settings and overridable per send.
//
// Recipients are snapshotted into the email_recipients table (one row each,
// with their resolved template variables + a unique tracking token), so editing
// or deleting a potential user later never corrupts an in-flight send. Addresses
// already on the suppression list are skipped at queue time. Optionally attach a
// reminder flow (flowId) — that creates an email_flow_run linked to this job, so
// follow-ups are materialised later by the queue worker's flow scheduler.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, withTransaction } from "@/lib/db";
import { getSite } from "@/lib/site";
import { snapshotJob, type SnapshotUser } from "@/lib/email/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let b: {
    templateId?: unknown;
    recipientIds?: unknown;
    batchSize?: unknown;
    intervalSeconds?: unknown;
    flowId?: unknown;
  };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const templateId = Number(b.templateId);
  const ids = Array.isArray(b.recipientIds)
    ? Array.from(
        new Set(b.recipientIds.map(Number).filter((n) => Number.isInteger(n))),
      )
    : [];
  if (!Number.isInteger(templateId))
    return NextResponse.json({ error: "Pick a template." }, { status: 400 });
  if (ids.length === 0)
    return NextResponse.json(
      { error: "Select at least one recipient." },
      { status: 400 },
    );
  const parsedFlowId = Number(b.flowId);
  const flowId =
    Number.isInteger(parsedFlowId) && parsedFlowId > 0 ? parsedFlowId : null;

  const tplRes = await query<{ name: string; subject: string; html: string }>(
    "SELECT name, subject, html FROM email_templates WHERE id=$1 AND deleted_at IS NULL",
    [templateId],
  );
  const tpl = tplRes.rows[0];
  if (!tpl)
    return NextResponse.json({ error: "Template not found." }, { status: 404 });

  const setRes = await query<{
    email_batch_size: number;
    email_interval_seconds: number;
    email_small_threshold: number;
    email_small_gap_seconds: number;
    reminders_enabled: boolean;
  }>("SELECT * FROM app_settings WHERE id=1");
  const s = setRes.rows[0];

  if (flowId != null && !s.reminders_enabled) {
    return NextResponse.json(
      { error: "Reminder processing is disabled. Enable it in Send Queue settings before attaching a flow." },
      { status: 409 },
    );
  }

  const usersRes = await query<SnapshotUser>(
    `SELECT id, email, first_name, last_name, company, phone, title, position, gender, custom
       FROM potential_users WHERE id = ANY($1::int[]) AND deleted_at IS NULL`,
    [ids],
  );

  // Cadence: small lists trickle 1-by-1, larger lists batch. Decided on the
  // selected count (body overrides win).
  const small = ids.length <= s.email_small_threshold;
  const batchSize = Number.isInteger(Number(b.batchSize))
    ? Math.max(1, Number(b.batchSize))
    : small
      ? 1
      : s.email_batch_size;
  const intervalSeconds = Number.isInteger(Number(b.intervalSeconds))
    ? Math.max(1, Number(b.intervalSeconds))
    : small
      ? s.email_small_gap_seconds
      : s.email_interval_seconds;

  // Snapshot the job + recipients (and the optional flow run) in one
  // transaction so the worker never sees a job before its recipients exist.
  const site = await getSite();
  const result = await withTransaction(async (client) => {
    const snap = await snapshotJob({
      users: usersRes.rows,
      template: { templateId, name: tpl.name, subject: tpl.subject, html: tpl.html },
      cadence: { batchSize, intervalSeconds },
      flow: { kind: "campaign" },
      client,
      site,
    });
    if (!snap) return null;
    if (flowId != null) {
      await client.query(
        `INSERT INTO email_flow_runs (flow_id, base_job_id, status)
         SELECT $1, $2, 'active'
          WHERE EXISTS (
            SELECT 1
              FROM email_flows f
              JOIN email_flow_steps s ON s.flow_id = f.id
             WHERE f.id = $1
               AND f.deleted_at IS NULL
               AND f.enabled = true
               AND s.enabled = true
               AND s.template_id IS NOT NULL
          )`,
        [flowId, snap.jobId],
      );
    }
    return snap;
  });

  if (!result) {
    return NextResponse.json(
      { error: "All selected recipients are unsubscribed or suppressed." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: result.jobId,
    total: result.total,
    skipped: result.skipped,
    batchSize,
    intervalSeconds,
  });
}
