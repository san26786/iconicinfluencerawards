// Deduplication helper for the CSV import wizard.
// Accepts a POST with the candidate compound-keys the client already built, and
// returns which of those keys already exist in the DB. This avoids shipping the
// entire potential_users table to the client (which blows up for large DBs).

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KNOWN: Record<string, string> = {
  email: "email",
  firstName: "first_name",
  lastName: "last_name",
  company: "company",
  phone: "phone",
  title: "title",
  position: "position",
};

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let body: { cols?: unknown; keys?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ existing: [] });
  }

  const cols = Array.isArray(body.cols) ? (body.cols as string[]).filter(Boolean) : [];
  const keys = Array.isArray(body.keys) ? (body.keys as string[]).filter(Boolean) : [];

  if (cols.length === 0 || keys.length === 0) {
    return NextResponse.json({ existing: [] });
  }

  const exprs: string[] = [];
  const params: unknown[] = [];
  for (const c of cols) {
    if (KNOWN[c]) {
      exprs.push(`lower(btrim(coalesce(${KNOWN[c]}, '')))`);
    } else {
      params.push(c);
      exprs.push(`lower(btrim(coalesce(custom->>$${params.length}, '')))`);
    }
  }
  const keyExpr = exprs.join(" || chr(31) || ");
  params.push(keys);

  const { rows } = await query<{ k: string }>(
    `SELECT DISTINCT ${keyExpr} AS k
     FROM potential_users
     WHERE deleted_at IS NULL AND ${keyExpr} = ANY($${params.length}::text[])`,
    params,
  );

  return NextResponse.json({ existing: rows.map((r) => r.k) });
}
