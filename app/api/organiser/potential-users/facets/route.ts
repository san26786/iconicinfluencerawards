// Organiser-only: distinct values for the filter dropdowns (Title, Position,
// Gender, Company, Source). Capped per facet to keep the payload small — the
// dropdowns have their own search box, so the cap only affects very long tails.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAP = 2000;

async function distinct(col: string): Promise<string[]> {
  const { rows } = await query<{ v: string }>(
    `SELECT DISTINCT ${col} AS v FROM potential_users
      WHERE deleted_at IS NULL AND ${col} IS NOT NULL AND btrim(${col}) <> ''
      ORDER BY v LIMIT ${CAP}`,
  );
  return rows.map((r) => r.v);
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const [titles, positions, genders, companies, sources] = await Promise.all([
    distinct("title"),
    distinct("position"),
    distinct("gender"),
    distinct("company"),
    distinct("source"),
  ]);

  return NextResponse.json({ titles, positions, genders, companies, sources });
}
