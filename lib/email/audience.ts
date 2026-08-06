// Declarative audience spec for reminder flow steps → SQL. An audience is
// resolved against a SOURCE job's email_recipients (the base campaign for the
// first step, or the previous reminder for later steps): pick recipients who
// were actually sent, have crossed their personal `sent_at + delay` threshold,
// match the engagement filter, aren't already enrolled in this reminder, and
// match the optional potential-user attribute filters. Adding a new filter
// later means extending AudienceSpec + a clause here — nothing is hardcoded in
// the scheduler.

import { buildPotentialUsersWhere, type PuFilters } from "@/lib/potentialUsersQuery";

export type Engagement =
  | "any"
  | "opened"
  | "clicked"
  | "opened_or_clicked"
  | "not_opened";

export type AudienceSpec = {
  engagement?: Engagement;
  potentialUsers?: PuFilters;
  // Safety guards (opt-in per step):
  //  - skipAlreadyReminded: never enroll an address that already received (or is
  //    queued for) ANY reminder in this same flow run — belt-and-braces against
  //    a double reminder across steps.
  //  - skipNominated: never enroll an address that has already submitted (or
  //    been named in) a nomination.
  skipAlreadyReminded?: boolean;
  skipNominated?: boolean;
};

const ENGAGEMENT_SQL: Record<Engagement, string> = {
  any: "",
  opened: "AND er.opened_at IS NOT NULL",
  clicked: "AND er.clicked_at IS NOT NULL",
  opened_or_clicked: "AND (er.opened_at IS NOT NULL OR er.clicked_at IS NOT NULL)",
  not_opened: "AND er.opened_at IS NULL",
};

/**
 * Rows currently eligible for a step, as SnapshotUser-shaped potential_users
 * rows. `$1` = sourceJobId, `$2` = delayMinutes; further params follow.
 */
export function buildEligibleAudienceQuery(
  spec: AudienceSpec,
  sourceJobId: number,
  delayMinutes: number,
  reminderJobId: number | null,
  flowRunId: number | null = null,
  /**
   * Site the campaign belongs to. Scopes the "already nominated" guard, so a
   * reminder for one site isn't suppressed because that person happens to have
   * been nominated on a sibling site.
   */
  siteId: number | null = null,
): { text: string; params: unknown[] } {
  const engagement: Engagement = spec.engagement ?? "opened_or_clicked";
  const params: unknown[] = [sourceJobId, delayMinutes];

  let notEnrolled = "";
  if (reminderJobId != null) {
    params.push(reminderJobId);
    notEnrolled = `AND er.email NOT IN (SELECT email FROM email_recipients WHERE job_id = $${params.length})`;
  }

  // PU attribute filter applied as a subquery (the shared builder emits
  // unqualified column names; `email` would be ambiguous in the join).
  const pu = buildPotentialUsersWhere(spec.potentialUsers ?? {}, params.length);
  let puClause = "";
  if (pu.where) {
    params.push(...pu.params);
    puClause = `AND pu.id IN (SELECT id FROM potential_users ${pu.where})`;
  }

  // Guard: skip anyone who already got a reminder in THIS flow run — EXCEPT the
  // source job itself. When a step chains from the previous reminder
  // (delay_from = 'previous'), the source IS a reminder job, so its recipients
  // are exactly the people this step targets; excluding them would empty the
  // audience and the step would never fire. `$1` is the source job id.
  // Recipient emails are stored lowercased on both sides, so a direct match is safe.
  let alreadyReminded = "";
  if (spec.skipAlreadyReminded && flowRunId != null) {
    params.push(flowRunId);
    alreadyReminded = `AND er.email NOT IN (
      SELECT r2.email FROM email_recipients r2
        JOIN email_jobs j2 ON j2.id = r2.job_id
       WHERE j2.kind = 'reminder' AND j2.flow_run_id = $${params.length}
         AND j2.id <> $1)`;
  }

  // Guard: skip anyone who has already filled in / been named on a nomination.
  let notNominated = "";
  if (spec.skipNominated) {
    let siteScope = "";
    if (siteId != null) {
      params.push(siteId);
      siteScope = ` AND site_id = $${params.length}`;
    }
    notNominated = `AND er.email NOT IN (
      SELECT lower(nominee_email) FROM nominations WHERE deleted_at IS NULL AND nominee_email IS NOT NULL${siteScope}
      UNION
      SELECT lower(nominator_email) FROM nominations WHERE deleted_at IS NULL AND nominator_email IS NOT NULL${siteScope})`;
  }

  const text = `
    SELECT pu.id, pu.email, pu.first_name, pu.last_name, pu.company,
           pu.phone, pu.title, pu.position, pu.gender, pu.custom
      FROM email_recipients er
      JOIN potential_users pu ON lower(pu.email) = er.email
     WHERE er.job_id = $1
       AND pu.deleted_at IS NULL
       AND er.status IN ('sent','delivered')
       AND er.sent_at IS NOT NULL
       AND er.sent_at + ($2 || ' minutes')::interval <= now()
       ${ENGAGEMENT_SQL[engagement]}
       ${notEnrolled}
       ${puClause}
       ${alreadyReminded}
       ${notNominated}`;
  return { text, params };
}
