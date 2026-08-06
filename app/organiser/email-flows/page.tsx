import { redirect } from "next/navigation";
import { Workflow } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { buildPotentialUsersWhere, type PuFilters } from "@/lib/potentialUsersQuery";
import { OrganiserNav } from "@/components/organiser/OrganiserNav";
import {
  EmailFlows,
  type FlowEditorFlow,
  type FlowStats,
  type FlowTemplate,
} from "@/components/organiser/EmailFlows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Email Flows" };

type FlowRow = {
  id: number;
  name: string;
  description: string | null;
  enabled: boolean;
  respect_send_window: boolean;
  steps: unknown;
};

async function countMatching(filters: PuFilters): Promise<number> {
  const { where, params } = buildPotentialUsersWhere(filters);
  const r = await query<{ n: string }>(
    `SELECT count(*)::int AS n FROM potential_users ${where}`,
    params,
  );
  return Number(r.rows[0]?.n ?? 0);
}

export default async function EmailFlowsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "organiser") redirect("/account");

  const [flowsRes, templatesRes, statsRes] = await Promise.all([
    query<FlowRow>(
      `SELECT f.id, f.name, f.description, f.enabled, f.respect_send_window,
              COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'id', s.id,
                    'position', s.position,
                    'name', s.name,
                    'templateId', s.template_id,
                    'delayMinutes', s.delay_minutes,
                    'delayFrom', s.delay_from,
                    'audience', s.audience,
                    'enabled', s.enabled
                  )
                  ORDER BY s.position
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'::jsonb
              ) AS steps
         FROM email_flows f
         LEFT JOIN email_flow_steps s ON s.flow_id = f.id
        WHERE f.deleted_at IS NULL
        GROUP BY f.id
        ORDER BY f.enabled DESC, f.name`,
    ),
    query<FlowTemplate>(
      "SELECT id, name FROM email_templates WHERE deleted_at IS NULL ORDER BY is_system DESC, name",
    ),
    // Per-flow run/queue stats (mirrors the Send Queue view, scoped to reminders).
    query<{
      flow_id: number;
      runs: number;
      active_runs: number;
      sent: number;
      total: number;
    }>(
      `SELECT f.id AS flow_id,
              count(DISTINCT r.id)::int AS runs,
              count(DISTINCT r.id) FILTER (WHERE r.status = 'active')::int AS active_runs,
              COALESCE(sum(j.sent_count), 0)::int AS sent,
              COALESCE(sum(j.total), 0)::int AS total
         FROM email_flows f
         LEFT JOIN email_flow_runs r ON r.flow_id = f.id
         LEFT JOIN email_jobs j ON j.flow_run_id = r.id AND j.kind = 'reminder'
        WHERE f.deleted_at IS NULL
        GROUP BY f.id`,
    ),
  ]);

  const flows: FlowEditorFlow[] = flowsRes.rows.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description ?? "",
    enabled: f.enabled,
    respectSendWindow: f.respect_send_window,
    steps: Array.isArray(f.steps) ? f.steps : [],
  })) as FlowEditorFlow[];

  const stats: Record<number, FlowStats> = {};
  for (const r of statsRes.rows) {
    stats[r.flow_id] = {
      runs: r.runs,
      activeRuns: r.active_runs,
      sent: r.sent,
      total: r.total,
    };
  }

  // Initial per-step match counts, keyed [flowId][stepPosition]. Refreshed
  // from the PUT response after each save.
  const initialCounts: Record<number, Record<number, number>> = {};
  await Promise.all(
    flows.flatMap((f) =>
      f.steps.map(async (s) => {
        const pu = (s.audience?.potentialUsers ?? {}) as PuFilters;
        (initialCounts[f.id] ??= {})[s.position] = await countMatching(pu);
      }),
    ),
  );

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
              Organiser
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Email Flows
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Configure optional reminder trails for campaign recipients who match engagement and list filters.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/65">
            <Workflow className="h-4 w-4 text-gold" /> Reminder processing is controlled from Send Queue settings
          </span>
        </div>
        <EmailFlows
          flows={flows}
          templates={templatesRes.rows}
          stats={stats}
          initialCounts={initialCounts}
        />
      </div>
    </main>
  );
}
