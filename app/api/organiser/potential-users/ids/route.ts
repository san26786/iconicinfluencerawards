// Organiser-only: all potential-user IDs matching the current filter/search.
// Powers "select all N matching" without shipping full rows — the client turns
// these into its selection Set, which the bulk actions (assign categories,
// email) already operate on.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { buildPotentialUsersWhere, puFiltersFromParams } from "@/lib/potentialUsersQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Safety ceiling — far above any realistic list, just to bound the payload.
const MAX_IDS = 200_000;

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const sp = new URL(req.url).searchParams;
  const { where, params } = buildPotentialUsersWhere(puFiltersFromParams(sp));

  const { rows } = await query<{ id: number }>(
    `SELECT id FROM potential_users ${where} ORDER BY created_at DESC LIMIT ${MAX_IDS}`,
    params,
  );

  return NextResponse.json({ ids: rows.map((r) => r.id), total: rows.length });
}
