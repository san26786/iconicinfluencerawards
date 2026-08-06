import { NextResponse } from 'next/server';
import { getSite, getSiteId } from '@/lib/site';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function genRef(): string {
  return String(Math.floor(Math.random() * 9_000_000_000_000) + 1_000_000_000_000);
}

export async function POST(req: Request) {
  try {
    const siteId = await getSiteId();
    const body = await req.json();

    const {
      event_id,
      first_name, last_name, email, phone, mobile, dob, gender,
      address, city, county, post_code,
      job_title, org_name, industry, org_phone, website,
      org_address, org_city, org_county, org_post_code,
      facebook, twitter, linkedin, instagram,
      brand_colour, trophy_name, trophy_title, trophy_message,
      eligibility_answers, application_answers,
    } = body;

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    // Same-category duplicate guard: block a second application from the same
    // person (email) in the same category (industry) for the same event. A
    // person may still enter DIFFERENT categories — that creates distinct rows.
    if (industry?.trim()) {
      const dupe = await query(
        `SELECT id FROM applications
          WHERE site_id = $1
            AND lower(email) = lower($2)
            AND lower(industry) = lower($3)
            AND event_id IS NOT DISTINCT FROM $4
          LIMIT 1`,
        [siteId, email.trim(), industry.trim(), event_id ?? null],
      ).catch(() => ({ rows: [] as { id: number }[] }));
      if (dupe.rows.length > 0) {
        return NextResponse.json(
          { error: 'An application with this email already exists in this category. You can enter a different category, but not the same one twice.' },
          { status: 409 },
        );
      }
    }

    const ref_number = genRef();

    const { rows } = await query(
      `INSERT INTO applications (
         site_id, event_id, ref_number,
         first_name, last_name, email, phone, mobile, dob, gender,
         address, city, county, post_code,
         job_title, org_name, industry, org_phone, website,
         org_address, org_city, org_county, org_post_code,
         facebook, twitter, linkedin, instagram,
         brand_colour, trophy_name, trophy_title, trophy_message,
         eligibility_answers, application_answers
       ) VALUES (
         $1,$2,$3,
         $4,$5,$6,$7,$8,$9,$10,
         $11,$12,$13,$14,
         $15,$16,$17,$18,$19,
         $20,$21,$22,$23,
         $24,$25,$26,$27,
         $28,$29,$30,$31,
         $32,$33
       ) RETURNING id, ref_number`,
      [
        siteId, event_id ?? null, ref_number,
        first_name.trim(), last_name.trim(), email.trim(),
        phone || null, mobile || null, dob || null, gender || null,
        address || null, city || null, county || null, post_code || null,
        job_title || null, org_name || null, industry || null, org_phone || null, website || null,
        org_address || null, org_city || null, org_county || null, org_post_code || null,
        facebook || null, twitter || null, linkedin || null, instagram || null,
        brand_colour || null, trophy_name || null, trophy_title || null, trophy_message || null,
        eligibility_answers ? JSON.stringify(eligibility_answers) : null,
        application_answers ? JSON.stringify(application_answers) : null,
      ],
    );

    return NextResponse.json({ ok: true, ref_number: rows[0].ref_number, id: rows[0].id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
