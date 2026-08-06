// Organiser-only: create a potential user. Listing is done by the page's
// server component (router.refresh() picks up changes), so there's no GET here.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = String(b.email ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }
  const custom = b.custom && typeof b.custom === "object" ? b.custom : {};

  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO potential_users (first_name, last_name, email, company, phone, title, position, gender, source, custom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual', $9::jsonb) RETURNING id`,
      [
        str(b.firstName),
        str(b.lastName),
        email,
        str(b.company),
        str(b.phone),
        str(b.title),
        str(b.position),
        str(b.gender),
        JSON.stringify(custom),
      ],
    );
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    if (
      typeof err === "object" &&
      err &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "A potential user with that email already exists." },
        { status: 409 },
      );
    }
    console.error("[potential-users] create failed", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
