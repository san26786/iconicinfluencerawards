import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSite } from '@/lib/site';
import { sendTemplateEmail } from '@/lib/email/system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const firstName      = String(body.firstName      ?? '').trim();
  const lastName       = String(body.lastName       ?? '').trim();
  const email          = String(body.email          ?? '').trim().toLowerCase();
  const phone          = String(body.phone          ?? '').trim() || null;
  const workPhone      = String(body.workPhone      ?? '').trim() || null;
  const company        = String(body.company        ?? '').trim() || null;
  const jobTitle       = String(body.jobTitle       ?? '').trim() || null;
  const bio            = String(body.bio            ?? '').trim() || null;
  const expertise      = String(body.expertise      ?? '').trim() || null;
  const shortSummary   = String(body.shortSummary   ?? '').trim() || null;
  const profileSummary = String(body.profileSummary ?? '').trim() || null;
  const linkedin        = String(body.linkedin      ?? '').trim() || null;
  const facebook        = String(body.facebook      ?? '').trim() || null;
  const twitter         = String(body.twitter       ?? '').trim() || null;
  const agreedToTerms   = body.agreedToTerms === true;
  const profilePicUrl   = String(body.profilePicUrl ?? '').trim() || null;

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (!agreedToTerms) {
    return NextResponse.json({ error: 'You must agree to the Terms and Conditions.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    const site = await getSite();
    const siteId = site.id;

    // Check for duplicate application from same email on same site
    const { rows: existing } = await query(
      `SELECT id FROM judges WHERE site_id = $1 AND email = $2 LIMIT 1`,
      [siteId, email],
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An application with this email already exists.' }, { status: 409 });
    }

    await query(
      `INSERT INTO judges
         (site_id, first_name, last_name, email, phone, work_phone, company, job_title,
          bio, expertise, short_summary, profile_summary,
          linkedin, facebook, twitter, agreed_to_terms, profile_pic_url, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending')`,
      [siteId, firstName, lastName, email, phone, workPhone, company, jobTitle,
       bio, expertise, shortSummary, profileSummary,
       linkedin, facebook, twitter, agreedToTerms, profilePicUrl],
    );

    // Send thank-you email (non-blocking)
    try {
      await sendTemplateEmail('judge-application', email, {
        firstName,
        lastName,
        email,
      }, { site });
    } catch {
      // Template may not exist yet — not fatal
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
