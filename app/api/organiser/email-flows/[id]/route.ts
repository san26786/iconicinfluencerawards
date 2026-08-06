// Organiser-only: update/delete reminder flow definitions.

import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { getSessionUser } from "@/lib/auth";
import { query, withTransaction } from "@/lib/db";
import { buildPotentialUsersWhere, type PuFilters } from "@/lib/potentialUsersQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StepBody = {
  id?: unknown;
  name?: unknown;
  templateId?: unknown;
  delayMinutes?: unknown;
  delayFrom?: unknown;
  // The editor nests the audience filters under `audience`; older/flat callers
  // may send them at the top level. Accept both, preferring `audience`.
  audience?: unknown;
  engagement?: unknown;
  potentialUsers?: unknown;
  enabled?: unknown;
};

const ENGAGEMENTS = new Set([
  "any",
  "opened",
  "clicked",
  "opened_or_clicked",
  "not_opened",
]);

async function guard() {
  const session = await getSessionUser();
  return session && session.role === "organiser" ? session : null;
}

const intOrNull = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

function cleanPotentialUsers(value: unknown) {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const text = (key: string) => {
    const s = String(raw[key] ?? "").trim();
    return s || undefined;
  };
  return {
    search: text("search"),
    title: text("title"),
    position: text("position"),
    gender: text("gender"),
    company: text("company"),
    source: text("source"),
    noCategories: raw.noCategories === true,
  };
}

function cleanStep(step: StepBody, position: number) {
  // The editor sends { ...step, audience: { engagement, potentialUsers } }.
  // Read from `audience` first, falling back to any flat top-level fields, so
  // the engagement + Potential-User filters are actually persisted (previously
  // they were read from the top level only and silently dropped on save).
  const audience =
    step.audience && typeof step.audience === "object"
      ? (step.audience as Record<string, unknown>)
      : {};
  const engagement = String(audience.engagement ?? step.engagement ?? "opened_or_clicked");
  const potentialUsers = audience.potentialUsers ?? step.potentialUsers;
  const delayFrom = String(step.delayFrom ?? "initial");
  return {
    id: intOrNull(step.id),
    position,
    name: String(step.name ?? "").trim() || `Step ${position}`,
    templateId: intOrNull(step.templateId),
    delayMinutes: clampInt(step.delayMinutes, 1, 43200, 240),
    delayFrom: delayFrom === "previous" ? "previous" : "initial",
    audience: {
      engagement: ENGAGEMENTS.has(engagement) ? engagement : "opened_or_clicked",
      potentialUsers: cleanPotentialUsers(potentialUsers),
      skipAlreadyReminded: audience.skipAlreadyReminded === true,
      skipNominated: audience.skipNominated === true,
    },
    // Never enable a step implicitly — only when the client explicitly says so.
    enabled: step.enabled === true,
  };
}

// How many potential_users currently match a step's attribute filters. This is
// the pre-send sanity-check count shown in the editor; the live reminder
// audience additionally narrows by engagement + the per-recipient delay against
// the source campaign, so this is an upper bound on who a step can ever reach.
async function countMatching(filters: PuFilters): Promise<number> {
  const { where, params } = buildPotentialUsersWhere(filters);
  const r = await query<{ n: string }>(
    `SELECT count(*)::int AS n FROM potential_users ${where}`,
    params,
  );
  return Number(r.rows[0]?.n ?? 0);
}

async function upsertStep(client: PoolClient, flowId: number, step: ReturnType<typeof cleanStep>) {
  if (step.id) {
    const { rowCount } = await client.query(
      `UPDATE email_flow_steps
          SET position=$1, name=$2, template_id=$3, delay_minutes=$4,
              delay_from=$5, audience=$6::jsonb, enabled=$7, updated_at=now()
        WHERE id=$8 AND flow_id=$9`,
      [
        step.position,
        step.name,
        step.templateId,
        step.delayMinutes,
        step.delayFrom,
        JSON.stringify(step.audience),
        step.enabled,
        step.id,
        flowId,
      ],
    );
    if (rowCount) return step.id;
  }

  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO email_flow_steps
       (flow_id, position, name, template_id, delay_minutes, delay_from, audience, enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
     RETURNING id`,
    [
      flowId,
      step.position,
      step.name,
      step.templateId,
      step.delayMinutes,
      step.delayFrom,
      JSON.stringify(step.audience),
      step.enabled,
    ],
  );
  return rows[0].id;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  const flowId = Number((await params).id);
  if (!Number.isInteger(flowId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = String(b.name ?? "").trim() || "Untitled reminder flow";
  const description = String(b.description ?? "").trim() || null;
  const enabled = b.enabled === true;
  // Office-hours opt-in: default true (stay confined to the send window) unless
  // the client explicitly sends false.
  const respectSendWindow = b.respectSendWindow !== false;
  const rawSteps = Array.isArray(b.steps) ? (b.steps as StepBody[]) : [];
  const steps = rawSteps.map((s, i) => cleanStep(s, i + 1));

  let found = true;
  await withTransaction(async (client) => {
    const flow = await client.query(
      `UPDATE email_flows
          SET name=$1, description=$2, enabled=$3, respect_send_window=$4, updated_at=now()
        WHERE id=$5`,
      [name, description, enabled, respectSendWindow, flowId],
    );
    if (!flow.rowCount) {
      found = false;
      return;
    }

    await client.query(
      "UPDATE email_flow_steps SET position = -id WHERE flow_id=$1",
      [flowId],
    );

    const keptIds: number[] = [];
    for (const step of steps) {
      const id = await upsertStep(client, flowId, step);
      keptIds.push(id);
    }

    if (keptIds.length > 0) {
      await client.query(
        "DELETE FROM email_flow_steps WHERE flow_id=$1 AND NOT (id = ANY($2::int[]))",
        [flowId, keptIds],
      );
    } else {
      await client.query("DELETE FROM email_flow_steps WHERE flow_id=$1", [flowId]);
    }
  });

  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Per-step match counts so the editor can immediately confirm the saved
  // filters resolve to a sensible number of recipients.
  const counts = await Promise.all(
    steps.map(async (s) => ({
      position: s.position,
      matchCount: await countMatching(s.audience.potentialUsers),
    })),
  );

  return NextResponse.json({ ok: true, counts });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  const flowId = Number((await params).id);
  if (!Number.isInteger(flowId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  // Soft delete: keep the row (and its steps/runs), hide it by stamping
  // deleted_at. The scheduler and flow lists both skip deleted flows.
  const { rowCount } = await query(
    "UPDATE email_flows SET deleted_at = now() WHERE id=$1 AND deleted_at IS NULL",
    [flowId],
  );
  if (!rowCount) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
