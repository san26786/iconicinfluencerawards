// Organiser-only: pause or resume a specific send campaign.
//   PATCH { action: 'pause' }  → stop sending further batches (in-flight batch
//                                 finishes; nothing new is claimed).
//   PATCH { action: 'resume' } → re-queue it so the processor picks it up again.
// The queue worker only ever touches status IN ('queued','sending'), so a
// 'paused' job is simply skipped until resumed.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: { action?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = body.action;

  if (action === "pause") {
    const { rowCount } = await query(
      `UPDATE email_jobs SET status='paused', next_run_at=NULL, updated_at=now()
        WHERE id=$1 AND status IN ('queued','sending')`,
      [id],
    );
    if (!rowCount) {
      return NextResponse.json(
        { error: "Only an active (queued/sending) job can be paused." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, status: "paused" });
  }

  if (action === "resume") {
    const { rowCount } = await query(
      `UPDATE email_jobs SET status='queued', next_run_at=now(), updated_at=now()
        WHERE id=$1 AND status='paused'`,
      [id],
    );
    if (!rowCount) {
      return NextResponse.json(
        { error: "Only a paused job can be resumed." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, status: "queued" });
  }

  if (action === "archive") {
    // Only a finished job can be archived (tidies the queue without deleting).
    const { rowCount } = await query(
      `UPDATE email_jobs SET archived_at=now(), updated_at=now()
        WHERE id=$1 AND status='done' AND archived_at IS NULL`,
      [id],
    );
    if (!rowCount) {
      return NextResponse.json(
        { error: "Only a completed job can be archived." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, archived: true });
  }

  if (action === "unarchive") {
    const { rowCount } = await query(
      `UPDATE email_jobs SET archived_at=NULL, updated_at=now()
        WHERE id=$1 AND archived_at IS NOT NULL`,
      [id],
    );
    if (!rowCount) {
      return NextResponse.json(
        { error: "Only an archived job can be restored." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, archived: false });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
