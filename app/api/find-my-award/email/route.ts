// POST /api/find-my-award/email
//
// Accepts the user's email + the category lists produced by the home-page
// "Find My Award" quiz, then sends them a results email via Resend or
// Mailgun (whichever EMAIL_PROVIDER points at).
//
// PAYLOAD SCHEMA (JSON):
//
//   {
//     "email":              "jane@example.com",          // required
//     "firstName":          "Jane",                       // optional
//     "topCategoryNames":   ["Cat A", "Cat B", "Cat C"], // required (≥1)
//     "otherCategoryNames": ["Cat D", "Cat E"],          // optional, may be []
//     "website":            ""                            // honeypot — must be empty
//   }
//
// RESPONSES:
//   200 { ok: true, messageId: "..." }
//   400 { error: "validation", fields: [...] }
//   429 { error: "rate_limited" }
//   500 { error: "send_failed" }
//
// Notes:
// - Caps total categories at 200 (defensive against payload bloat).
// - Honeypot rejects bot submissions silently with 200 so they don't retry.
// - The render layer encodes a per-recipient unsubscribe token into the
//   footer link; the upstream unsubscribe page can decrypt that with the
//   same crytid() helper.

import { NextResponse } from 'next/server';
import { getSite } from '@/lib/site';
import { sendFindMyAwardResults } from '@/lib/email/findmyaward';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ResultsPayload = {
  email?: string;
  firstName?: string;
  topCategoryNames?: unknown;
  otherCategoryNames?: unknown;
  /** Honeypot — bots fill every input they see. Real humans never. */
  website?: string;
};

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function cleanStringArray(value: unknown, cap = 100): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= cap) break;
  }
  // Dedupe while preserving order
  return Array.from(new Set(out));
}

export async function POST(req: Request) {
  let raw: ResultsPayload;
  try {
    raw = (await req.json()) as ResultsPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Silent honeypot drop — return 200 so bots think it worked.
  if (raw.website && raw.website.trim() !== '') {
    console.warn('[/api/find-my-award/email] honeypot tripped — silently dropping');
    return NextResponse.json({ ok: true });
  }

  const email = (raw.email ?? '').trim();
  const firstName = (raw.firstName ?? '').trim() || undefined;
  const topCategoryNames = cleanStringArray(raw.topCategoryNames);
  const otherCategoryNames = cleanStringArray(raw.otherCategoryNames);

  const missing: string[] = [];
  if (!email) missing.push('email');
  if (!topCategoryNames.length && !otherCategoryNames.length) {
    missing.push('topCategoryNames');
  }
  if (missing.length) {
    return NextResponse.json(
      { error: 'validation', fields: missing },
      { status: 400 },
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: 'validation', fields: ['email'] },
      { status: 400 },
    );
  }

  try {
    const site = await getSite();
    const result = await sendFindMyAwardResults({
      email,
      firstName,
      topCategoryNames,
      otherCategoryNames,
      site,
    });

    if (!result) {
      // Orchestrator decided not to send (no categories, etc).
      return NextResponse.json({ error: 'no_categories' }, { status: 400 });
    }

    if (!result.ok) {
      console.error('[/api/find-my-award/email] send failed', result);
      return NextResponse.json(
        { error: 'send_failed', reason: result.reason },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (err) {
    console.error('[/api/find-my-award/email] unexpected error', err);
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  }
}
