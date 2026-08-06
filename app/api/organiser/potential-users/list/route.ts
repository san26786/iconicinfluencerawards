// Organiser-only: paginated + filtered potential-users list. Returns only the
// current page's rows (with their custom JSON) plus the total matching count,
// so the table loads fast regardless of how large the list is. Search matches
// across all columns + the custom JSON (see buildPotentialUsersWhere).

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { buildPotentialUsersWhere, puFiltersFromParams } from "@/lib/potentialUsersQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10));
  const { where, params } = buildPotentialUsersWhere(puFiltersFromParams(sp));

  const totalRes = await query<{ n: string }>(
    `SELECT count(*)::bigint AS n FROM potential_users ${where}`,
    params,
  );
  const total = Number(totalRes.rows[0]?.n ?? 0);

  const rowsRes = await query<{
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    company: string | null;
    phone: string | null;
    title: string | null;
    position: string | null;
    gender: string | null;
    source: string | null;
    custom: Record<string, unknown> | null;
    assigned_categories: string[] | null;
    created_at: Date;
  }>(
    `SELECT id, first_name, last_name, email, company, phone, title, position, gender, source, custom, assigned_categories, created_at
       FROM potential_users ${where}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    params,
  );

  const rows = rowsRes.rows.map((u) => ({
    id: u.id,
    firstName: u.first_name ?? "",
    lastName: u.last_name ?? "",
    email: u.email,
    company: u.company ?? "",
    phone: u.phone ?? "",
    title: u.title ?? "",
    position: u.position ?? "",
    gender: u.gender ?? "",
    custom: u.custom ?? {},
    source: u.source ?? "",
    assignedCategories: u.assigned_categories ?? [],
    created: dateFmt.format(new Date(u.created_at)),
  }));

  return NextResponse.json({ rows, total });
}
