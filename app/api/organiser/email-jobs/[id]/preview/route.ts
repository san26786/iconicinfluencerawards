// Organiser-only: render the exact email that was queued for one recipient,
// by applying that recipient's snapshotted variables to the job's subject/HTML
// template. Powers the "View" button on the campaign-stats page.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getSiteById } from "@/lib/site";
import { renderTemplate, type TemplateVars } from "@/lib/email/template";
import { trackingBaseUrl, unsubscribeUrl } from "@/lib/email/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const { id } = await params;
  const jobId = Number(id);
  const recipientId = Number(new URL(req.url).searchParams.get("r"));
  if (!Number.isInteger(jobId) || !Number.isInteger(recipientId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const jobRes = await query<{ subject: string; html: string; site_id: number | null }>(
    "SELECT subject, html, site_id FROM email_jobs WHERE id = $1",
    [jobId],
  );
  const job = jobRes.rows[0];
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const recRes = await query<{
    email: string;
    vars: TemplateVars;
    token: string;
  }>(
    "SELECT email, vars, token FROM email_recipients WHERE id = $1 AND job_id = $2",
    [recipientId, jobId],
  );
  const rec = recRes.rows[0];
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Preview the links exactly as the recipient will get them — on the site's
  // own domain, not whichever host is serving the organiser panel.
  const jobSite = job.site_id != null ? await getSiteById(job.site_id) : null;
  const base = trackingBaseUrl(
    req.url,
    jobSite ? (jobSite.official_site || `https://${jobSite.domain}`) : null,
  );
  const vars: TemplateVars = {
    ...rec.vars,
    unsubscribeUrl: base ? unsubscribeUrl(base, rec.token) : "",
  };

  return NextResponse.json({
    email: rec.email,
    subject: renderTemplate(job.subject, vars),
    html: renderTemplate(job.html, vars),
  });
}
