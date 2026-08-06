// Organiser-only: create reminder/follow-up flow definitions.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    b = {};
  }

  const name = String(b.name ?? "").trim() || "New reminder flow";
  const description = String(b.description ?? "").trim() || null;
  const enabled = b.enabled === undefined ? true : b.enabled === true;

  const { rows } = await query<{ id: number }>(
    `INSERT INTO email_flows (name, description, enabled)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, description, enabled],
  );

  return NextResponse.json({ ok: true, id: rows[0].id });
}
