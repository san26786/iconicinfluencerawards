// Queue worker. Each run, for every due job: gate the job (so only one worker
// touches it per interval), claim a batch of pending recipient rows
// (FOR UPDATE SKIP LOCKED — no double-send, ever), render + track + send them,
// record per-recipient outcome, retry transient failures, and finish the job
// when nothing is left.
//
// Driven by the organiser's Send Queue page (polls while open) and a Vercel
// cron (background). Both authorise below.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteById } from '@/lib/site';
import { sendCampaign, type SendArgs } from '@/lib/email/send';
import { ensureSiteIdColumn } from '@/lib/email/snapshot';
import { renderTemplate, htmlToText, type TemplateVars } from '@/lib/email/template';
import { injectTracking, trackingBaseUrl, unsubscribeUrl } from '@/lib/email/tracking';
import { ukMinutesNow, parseHHMM, isWithinWindow } from '@/lib/email/sendWindow';
import { processFlows } from '@/lib/email/flows';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow longer runs on Vercel Pro (ignored/clamped on Hobby). One invocation
// handles a single batch per job, so this is a safety ceiling, not the norm.
export const maxDuration = 60;

const MAX_ATTEMPTS = 3;

type ClaimedRecipient = {
  id: number;
  email: string;
  vars: TemplateVars;
  token: string;
  attempts: number;
};

async function authorised(req: Request): Promise<boolean> {
  const session = await getSessionUser();
  if (session && session.role === 'organiser') return true;
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth === `Bearer ${secret}` || req.headers.get('x-cron-secret') === secret) return true;
  }
  return false;
}

export async function POST(req: Request) {
  if (!(await authorised(req))) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  await ensureSiteIdColumn();

  const settings = await query<{
    track_opens: boolean;
    track_clicks: boolean;
    send_window_enabled: boolean;
    send_window_start: string;
    send_window_end: string;
    reminders_enabled: boolean;
  }>(
    'SELECT track_opens, track_clicks, send_window_enabled, send_window_start, send_window_end, reminders_enabled FROM app_settings WHERE id=1',
  );
  const trackOpens = settings.rows[0]?.track_opens ?? true;
  const trackClicks = settings.rows[0]?.track_clicks ?? true;

  // Reminder flows: enroll due recipients into reminder jobs BEFORE the
  // send-window gate, so follow-ups get materialised even off-hours and go out
  // when the window reopens. Never let a flow error wedge the campaign worker.
  if (settings.rows[0]?.reminders_enabled ?? true) {
    try {
      await processFlows();
    } catch (err) {
      console.error('[email-jobs/process] flow scheduling failed', err);
    }
  }

  // Daily send-window. `within` is computed against the configured times
  // regardless of the global toggle, because individual flows can opt in to the
  // window even when global 24/7 sending is on.
  const sw = settings.rows[0];
  const within = sw
    ? isWithinWindow(
        ukMinutesNow(),
        parseHHMM(sw.send_window_start, 540), // 09:00
        parseHHMM(sw.send_window_end, 1110), // 18:30
      )
    : true;

  // Global window: outside it, auto-pause — send nothing this run. Jobs keep
  // their status/next_run_at, so anything due during the off-hours simply goes
  // out when the window reopens. Applies to every campaign at once.
  if (sw?.send_window_enabled && !within) {
    return NextResponse.json({
      ok: true,
      paused: true,
      reason: 'outside_send_window',
      window: { start: sw.send_window_start, end: sw.send_window_end },
      processed: [],
    });
  }

  // NB: the tracking base URL is resolved PER JOB below, not once here — each
  // job belongs to a site, and every recipient's links must resolve on that
  // site's own domain.

  // When we're outside the window (only reachable here if the GLOBAL window is
  // off), still hold back reminder jobs whose flow opted in to office hours.
  // Purely additive — it can only delay a send, never bypass the global gate.
  const due = await query<{ id: number }>(
    `SELECT j.id FROM email_jobs j
       LEFT JOIN email_flows f ON f.id = j.flow_id
      WHERE j.status IN ('queued','sending') AND (j.next_run_at IS NULL OR j.next_run_at <= now())
        AND ($1::boolean OR NOT (j.kind = 'reminder' AND COALESCE(f.respect_send_window, false)))
      ORDER BY j.next_run_at NULLS FIRST
      LIMIT 10`,
    [within],
  );

  const processed: { id: number; sent: number; failed: number; skipped: number; done: boolean }[] = [];

  for (const { id } of due.rows) {
    try {
      // 1. Gate the job: only one worker may process it this interval.
      const gate = await query<{ subject: string; html: string; batch_size: number; site_id: number | null }>(
        `UPDATE email_jobs
            SET status='sending',
                next_run_at = now() + make_interval(secs => GREATEST(interval_seconds, 1)),
                updated_at = now()
          WHERE id=$1 AND status IN ('queued','sending') AND (next_run_at IS NULL OR next_run_at <= now())
          RETURNING subject, html, batch_size, site_id`,
        [id],
      );
      const job = gate.rows[0];
      if (!job) continue; // taken by another worker, or not due

      // Tracking/unsubscribe links must live on this job's own site domain.
      const jobSite = job.site_id != null ? await getSiteById(job.site_id) : null;
      const baseUrl = trackingBaseUrl(
        req.url,
        jobSite ? (jobSite.official_site || `https://${jobSite.domain}`) : null,
      );

      // 2. Claim a batch of recipients (pending, or 'sending' rows stuck >15min).
      const claim = await query<ClaimedRecipient>(
        `WITH batch AS (
           SELECT id FROM email_recipients
            WHERE job_id=$1
              AND (status='pending' OR (status='sending' AND updated_at < now() - interval '15 minutes'))
            ORDER BY id
            LIMIT $2
            FOR UPDATE SKIP LOCKED
         )
         UPDATE email_recipients r
            SET status='sending', attempts = r.attempts + 1, updated_at=now()
           FROM batch b WHERE r.id=b.id
          RETURNING r.id, r.email, r.vars, r.token, r.attempts`,
        [id, job.batch_size],
      );
      const batch = claim.rows;

      let sent = 0;
      let failed = 0;
      let skipped = 0;

      if (batch.length > 0) {
        // 3. Drop anyone suppressed since queue time.
        const supRes = await query<{ email: string }>(
          'SELECT email FROM email_suppressions WHERE email = ANY($1::text[]) AND deleted_at IS NULL',
          [batch.map((r) => r.email)],
        );
        const suppressed = new Set(supRes.rows.map((r) => r.email));

        const toSend = batch.filter((r) => !suppressed.has(r.email));
        for (const r of batch) {
          if (suppressed.has(r.email)) {
            skipped++;
            await markRecipient(r.id, id, 'skipped', { error: 'suppressed' });
          }
        }

        // 4. Render + track + send.
        const messages: SendArgs[] = toSend.map((r) => {
          const unsub = baseUrl ? unsubscribeUrl(baseUrl, r.token) : '';
          const vars: TemplateVars = { ...r.vars, unsubscribeUrl: unsub };
          let html = renderTemplate(job.html, vars);
          // Guarantee an unsubscribe link even if the template omits {{unsubscribeUrl}}.
          if (unsub && !html.includes('/api/unsubscribe')) {
            html = appendUnsubFooter(html, unsub);
          }
          // Plain-text alternative from the readable HTML (before tracking is
          // injected, so links stay clean and no open-pixel leaks into text).
          const text = htmlToText(html);
          html = injectTracking(html, { baseUrl, token: r.token, trackOpens, trackClicks });
          return {
            to: r.email,
            subject: renderTemplate(job.subject, vars),
            html,
            text,
            idempotencyKey: `job-${id}-r-${r.id}-a${r.attempts}`,
            headers: unsub
              ? { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
              : undefined,
          };
        });

        const results = await sendCampaign(messages, job.site_id ?? undefined);

        // 5. Record each outcome.
        for (let i = 0; i < toSend.length; i++) {
          const r = toSend[i];
          const res = results[i];
          if (res?.ok) {
            sent++;
            await markRecipient(r.id, id, 'sent', {
              provider: res.provider,
              messageId: res.messageId,
              account: res.account,
            });
          } else {
            const permanent =
              res?.reason === 'no_api_key' || res?.reason === 'dry_run' || r.attempts >= MAX_ATTEMPTS;
            if (permanent) {
              failed++;
              await markRecipient(r.id, id, 'failed', { error: res?.error ?? 'send failed' });
            } else {
              // Transient — return to the queue for another attempt next interval.
              await query(
                `UPDATE email_recipients SET status='pending', error=$2, updated_at=now() WHERE id=$1`,
                [r.id, res?.error ?? 'transient error'],
              );
            }
          }
        }
      }

      // 6. Recompute job counters + finish if nothing remains. `total` is
      // recomputed too so rolling-enrollment reminder jobs always read correctly
      // (a no-op for campaigns, whose recipient set never changes).
      await query(
        `UPDATE email_jobs e SET
            total = (SELECT count(*) FROM email_recipients WHERE job_id=$1),
            sent_count = (SELECT count(*) FROM email_recipients WHERE job_id=$1 AND status IN ('sent','delivered')),
            fail_count = (SELECT count(*) FROM email_recipients WHERE job_id=$1 AND status IN ('failed','bounced','complained','skipped')),
            status = CASE WHEN (SELECT count(*) FROM email_recipients WHERE job_id=$1) > 0 AND (SELECT count(*) FROM email_recipients WHERE job_id=$1 AND status IN ('pending','sending'))=0 AND e.enroll_open = false THEN 'done' WHEN e.status='paused' THEN 'paused' ELSE 'sending' END,
            next_run_at = CASE WHEN (SELECT count(*) FROM email_recipients WHERE job_id=$1 AND status IN ('pending','sending'))=0 AND e.enroll_open = false THEN NULL ELSE e.next_run_at END,
            updated_at = now()
          WHERE e.id=$1`,
        [id],
      );

      const remaining = await query<{ n: string }>(
        `SELECT count(*) AS n FROM email_recipients WHERE job_id=$1 AND status IN ('pending','sending')`,
        [id],
      );
      processed.push({ id, sent, failed, skipped, done: Number(remaining.rows[0]?.n ?? 0) === 0 });
    } catch (err) {
      console.error('[email-jobs/process] job failed', id, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}

export const GET = POST;

/* ---------- helpers ---------- */

async function markRecipient(
  recipientId: number,
  jobId: number,
  status: 'sent' | 'failed' | 'skipped',
  opts: { provider?: string; messageId?: string; error?: string; account?: string },
): Promise<void> {
  if (status === 'sent') {
    await query(
      `UPDATE email_recipients
          SET status='sent', provider=$2, provider_message_id=$3, sent_account=$4, sent_at=now(), error=NULL, updated_at=now()
        WHERE id=$1`,
      [recipientId, opts.provider ?? null, opts.messageId || null, opts.account ?? null],
    );
  } else {
    await query(`UPDATE email_recipients SET status=$2, error=$3, updated_at=now() WHERE id=$1`, [
      recipientId,
      status,
      opts.error ?? null,
    ]);
  }
  await query(`INSERT INTO email_events (recipient_id, job_id, type) VALUES ($1, $2, $3)`, [
    recipientId,
    jobId,
    status,
  ]);
}

function appendUnsubFooter(html: string, unsub: string): string {
  const footer = `<p style="margin:24px 0 0;font-size:11px;color:#999;text-align:center">If you'd prefer not to receive these emails, <a href="${unsub}" style="color:#999">unsubscribe</a>.</p>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${footer}</body>`) : html + footer;
}
