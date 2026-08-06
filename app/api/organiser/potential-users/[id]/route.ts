// Organiser-only: update or delete a single potential user.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};

async function guard() {
  const s = await getSessionUser();
  return s && s.role === "organiser" ? s : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await guard()))
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  const numId = Number((await params).id);
  if (!Number.isInteger(numId))
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });

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
    const { rowCount } = await query(
      `UPDATE potential_users
         SET first_name=$1, last_name=$2, email=$3, company=$4, phone=$5, title=$6, position=$7, gender=$8, custom=$9::jsonb, updated_at=now()
       WHERE id=$10 AND deleted_at IS NULL`,
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
        numId,
      ],
    );
    if (!rowCount)
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (
      typeof err === "object" &&
      err &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "Another potential user already has that email." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await guard()))
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  const numId = Number((await params).id);
  if (!Number.isInteger(numId))
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  // Soft delete: keep the row, hide it everywhere by stamping deleted_at.
  const { rowCount } = await query(
    "UPDATE potential_users SET deleted_at = now() WHERE id=$1 AND deleted_at IS NULL",
    [numId],
  );
  if (!rowCount)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
