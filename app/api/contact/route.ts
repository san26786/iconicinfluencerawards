// Server-side proxy for contact-form submissions.
//
// Responsibilities:
//   1. Validate the incoming JSON payload (required fields, basic shape)
//   2. Reject obvious bots via the honeypot field
//   3. Forward the submission to the upstream PHP endpoint at
//      https://b2bgrowthhub.org/api-contact.php using the shared
//      X-API-Key auth header (same secret as the nomination API).
//      Override via CONTACT_UPSTREAM_URL / CONTACT_API_KEY env vars.
//   4. Fire two professional HTML emails via Resend regardless of whether
//      forwarding happened (so the team is alerted even before the database
//      side exists)
//   5. Return a JSON success/failure response the client form can read
//
// =====================================================================
// PAYLOAD SCHEMA (for the upstream PHP API designer):
//
//   POST /api/contact
//   Content-Type: application/json
//
//   {
//     "site":         "Iconic Influencer Awards",    // site.name
//     "siteId":       "property-excellence-awards",    // site.slug (kebab-case)
//     "submittedAt":  "2026-06-07T14:32:11.000Z",      // ISO 8601 UTC
//     "name":         "Jane Smith",                    // required
//     "email":        "jane@business.com",             // required
//     "company":      "Acme Co",                       // optional
//     "phone":        "07000 000000",                  // optional
//     "subject":      "Sponsorship & partnerships",    // required, one of:
//                       //   "Entering the awards"
//                       //   "Nominating a business"
//                       //   "Sponsorship & partnerships"
//                       //   "Press & media"
//                       //   "General enquiry"
//     "message":      "Hi, we'd love to talk about...", // required, free text
//     "consent":      true,                            // GDPR opt-in marker
//     "metadata": {
//        "ipAddress": "203.0.113.4",                   // X-Forwarded-For
//        "userAgent": "Mozilla/5.0 (...)",
//        "referrer":  "https://www.londonbusinessawards.com/contact"
//     }
//   }
//
// Successful response (200):
//   {
//     "ok": true,
//     "messageIds": { "user": "...", "admin": "..." },
//     "upstreamStatus": 200 | null
//   }
//
// Validation failure (400):
//   { "error": "validation", "fields": ["name", "email", "message"] }
//
// =====================================================================

import { NextResponse } from 'next/server';
import { sendContactEmails } from '@/lib/email/contact';
import { getSite } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Upstream PHP endpoint that receives contact-form submissions. The contact
// API shares the same auth key as the nomination API (same backend, same
// X-API-Key header). Both URL + key are overridable via env if the backend
// ever splits.
const UPSTREAM_URL =
  process.env.CONTACT_UPSTREAM_URL ?? 'https://b2bgrowthhub.org/api-contact.php';
const API_KEY =
  process.env.CONTACT_API_KEY ??
  process.env.NOMINATION_API_KEY ??
  'pmdr_NominationAPI_9Xk4mQ7vR2tY8nLp5Wc3Hs6Jf1Zd0BgKeppw4AuMv9';
const USER_AGENT = 'SEA-ContactProxy/1.0 (+vercel)';

const ALLOWED_SUBJECTS = new Set([
  'Entering the awards',
  'Nominating a business',
  'Sponsorship & partnerships',
  'Press & media',
  'General enquiry',
]);

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  subject?: string;
  message?: string;
  /** Honeypot — bots fill every visible-looking field. Real humans never. */
  website?: string;
  /** GDPR opt-in checkbox state. Defaults to true if missing. */
  consent?: boolean;
};

function isEmail(v: string): boolean {
  // Conservative regex — we just need "@" with something either side.
  // The full email is validated downstream by Resend / the mail server.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Trim every value and coerce empties to undefined. */
function clean<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string') {
      const trimmed = v.trim();
      out[k] = trimmed === '' ? undefined : trimmed;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export async function POST(req: Request) {
  // --- Parse + validate ---------------------------------------------------
  let raw: ContactPayload;
  try {
    raw = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const payload = clean(raw);

  // Honeypot. The form ships an invisible <input name="website"> that real
  // humans never fill. Bots typically fill every input they see.
  if (payload.website) {
    // Return 200 OK so the bot believes it succeeded but do nothing.
    console.warn('[/api/contact] honeypot tripped — silently dropping');
    return NextResponse.json({ ok: true });
  }

  const missing: string[] = [];
  if (!payload.name) missing.push('name');
  if (!payload.email) missing.push('email');
  if (!payload.subject) missing.push('subject');
  if (!payload.message) missing.push('message');
  if (missing.length) {
    return NextResponse.json(
      { error: 'validation', fields: missing },
      { status: 400 },
    );
  }
  if (!isEmail(payload.email!)) {
    return NextResponse.json(
      { error: 'validation', fields: ['email'] },
      { status: 400 },
    );
  }
  if (!ALLOWED_SUBJECTS.has(payload.subject!)) {
    return NextResponse.json(
      { error: 'validation', fields: ['subject'] },
      { status: 400 },
    );
  }
  if (payload.message!.length > 5000) {
    return NextResponse.json(
      { error: 'validation', fields: ['message'] },
      { status: 400 },
    );
  }

  // --- Capture request metadata ------------------------------------------
  // X-Forwarded-For is set by Vercel; take the first hop (the client IP).
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;
  const userAgent = req.headers.get('user-agent') || undefined;
  const referrer = req.headers.get('referer') || undefined;
  const submittedAt = new Date().toISOString();
  // Resolved before the upstream forward so the payload identifies the site the
  // enquiry actually came from, not a build-time constant.
  const site = await getSite();

  // --- Forward to upstream ------------------------------------------------
  // Mirrors the documented schema above. The same X-API-Key as the
  // nomination API authenticates us to the shared backend.
  let upstreamStatus: number | null = null;
  let upstreamBody: string | null = null;
  try {
    const upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        // Brand identification — lets a shared PHP backend route or filter
        // submissions by which website they came from.
        site: site.name,
        siteId: site.slug,
        submittedAt,
        name: payload.name,
        email: payload.email,
        company: payload.company,
        phone: payload.phone,
        subject: payload.subject,
        message: payload.message,
        consent: payload.consent ?? true,
        metadata: { ipAddress, userAgent, referrer },
      }),
      cache: 'no-store',
    });
    upstreamStatus = upstream.status;
    upstreamBody = await upstream.text();
    if (!upstream.ok) {
      console.warn(
        '[/api/contact] upstream non-2xx',
        upstreamStatus,
        upstreamBody.slice(0, 512),
      );
    }
  } catch (err) {
    console.error('[/api/contact] upstream unreachable', err);
    // Don't fail the request — we still fire emails so the team is alerted
    upstreamStatus = null;
  }

  // --- Fire emails (always) ----------------------------------------------
  const { userResult, adminResult } = await sendContactEmails({
    submission: {
      name: payload.name!,
      email: payload.email!,
      company: payload.company,
      phone: payload.phone,
      subject: payload.subject!,
      message: payload.message!,
    },
    submittedAt,
    ipAddress,
    userAgent,
    site,
  });

  console.log('[/api/contact] dispatched', {
    upstreamStatus,
    user: userResult,
    admin: adminResult,
  });

  // Always return success to the client when validation passed. Email or
  // upstream failures are logged server-side, but we do not want the
  // visitor's form UX to depend on either succeeding.
  return NextResponse.json({
    ok: true,
    messageIds: {
      user: userResult?.ok ? userResult.messageId : null,
      admin: adminResult?.ok ? adminResult.messageId : null,
    },
    upstreamStatus,
  });
}
