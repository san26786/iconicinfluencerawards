// Nomination submissions.
//
// CHANGED: this route used to (1) forward the submission to the upstream PHP
// nomination API and (2) fire confirmation emails. Both of those are now
// PARKED — the upstream forward and the email orchestration are commented out
// below (kept intact so they can be switched back on later). Instead, the
// submission is persisted directly into our own Postgres `nominations` table.
//
// We still parse BOTH multipart/form-data (the file-upload path) and
// application/json so the existing client (components/RegisterForm.tsx) needs
// no changes — it gets a 200 + { ok, id } on success exactly where it used to
// get the upstream 200.
//
// Note: uploaded file *bytes* are not stored — only their metadata (carried in
// payload.supporting), matching what the JSON payload already contained.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSite } from '@/lib/site';
import { sendTemplateEmail } from '@/lib/email/system';
import { type NominationPayload } from '@/lib/email/nomination';
// --- Email helpers: parked along with the upstream forward (see below) ---
// import { extractNominationId, sendNominationEmails } from '@/lib/email/nomination';

// The form (components/RegisterForm.tsx) sends a few fields the email-only
// NominationPayload type doesn't model — widen it for persistence.
type SubmittedNomination = NominationPayload & {
  site?: string;
  submittedAt?: string;
  supporting?: { documents?: unknown[]; videos?: unknown[]; videoLink?: string };
  agreedToTerms?: boolean;
};

// `anonymous` arrives as a boolean from the form but the type also allows
// 'yes'/'no' — normalise both to a real boolean.
const toBool = (v: unknown): boolean => v === true || v === 'yes';

// Node.js runtime — required by `pg` (and previously by the Node-only email path).
export const runtime = 'nodejs';
// Don't statically pre-render; this is a real request handler.
export const dynamic = 'force-dynamic';

/* ───────────────────────────────────────────────────────────────────────
 * PARKED: upstream PHP forward configuration. Restore these + the forward
 * block below to re-enable proxying to the external nomination API.
 *
 * const UPSTREAM_URL =
 *   process.env.NOMINATION_UPSTREAM_URL ?? 'http://b2bgrowthhub.org/api-nomination.php';
 * const API_KEY =
 *   process.env.NOMINATION_API_KEY ??
 *   'pmdr_NominationAPI_9Xk4mQ7vR2tY8nLp5Wc3Hs6Jf1Zd0BgKeppw4AuMv9';
 * const USER_AGENT = 'BBA-NominationProxy/1.0 (+vercel)';
 * ─────────────────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  const incomingContentType = req.headers.get('content-type') ?? 'application/json';
  const isMultipart = incomingContentType.includes('multipart/form-data');

  // Parse the incoming body. We support BOTH multipart/form-data (uploads) and
  // application/json. Either way we need the parsed payload — that's the data
  // we persist.
  let payload: SubmittedNomination | null = null;

  if (isMultipart) {
    try {
      const incoming = await req.formData();
      const payloadField = incoming.get('payload');
      if (typeof payloadField === 'string' && payloadField) {
        try {
          payload = JSON.parse(payloadField) as SubmittedNomination;
        } catch {
          console.warn('[/api/nominate] payload field present but not valid JSON');
        }
      }
    } catch (err) {
      console.error('[/api/nominate] failed to parse multipart body', err);
      return NextResponse.json({ error: 'invalid_multipart' }, { status: 400 });
    }
  } else {
    let raw: string;
    try {
      raw = await req.text();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    try {
      payload = JSON.parse(raw) as SubmittedNomination;
    } catch {
      /* fall through — handled below */
    }
  }

  if (!payload) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // --- Persist to Postgres ----------------------------------------------
  const nominee = payload.nominee ?? null;
  const nominator = payload.nominator ?? null;
  // Associate with the logged-in user (if any) so it shows under "My
  // Nominations". Public/anonymous nominations stay user_id NULL.
  const session = await getSessionUser();
  // The site this nomination was submitted on. nominations.site_id has a
  // column-level default of 1, so it must be set explicitly here — leaving it
  // off files the entry under whichever tenant owns id 1 on the shared DB.
  const site = await getSite();

  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO nominations (
         site, submitted_at, award_categories, self_nominate,
         nominee_first_name, nominee_last_name, nominee_email, nominee_mobile,
         nominee_work_phone, nominee_organisation, nominee_post_code, anonymous,
         opening_statement, linked_in, how_heard,
         nominator_first_name, nominator_last_name, nominator_email, nominator_mobile,
         nominator_work_phone, business_name, business_location, business_category,
         supporting, agreed_to_terms, raw_payload, user_id,
         site_id
       ) VALUES (
         $1, $2, $3::jsonb, $4,
         $5, $6, $7, $8,
         $9, $10, $11, $12,
         $13, $14, $15,
         $16, $17, $18, $19,
         $20, $21, $22, $23,
         $24::jsonb, $25, $26::jsonb, $27,
         $28
       )
       RETURNING id`,
      [
        payload.site ?? null,
        payload.submittedAt ?? null,
        JSON.stringify(payload.awardCategories ?? []),
        Boolean(payload.selfNominate),

        nominee?.firstName ?? null,
        nominee?.lastName ?? null,
        nominee?.email ?? null,
        nominee?.mobile ?? null,
        nominee?.workPhone ?? null,
        nominee?.organisation ?? null,
        nominee?.postCode ?? null,
        toBool(nominee?.anonymous),
        nominee?.openingStatement ?? null,
        nominee?.linkedIn ?? null,
        nominee?.howHeard ?? null,

        nominator?.firstName ?? null,
        nominator?.lastName ?? null,
        nominator?.email ?? null,
        nominator?.mobile ?? null,
        nominator?.workPhone ?? null,
        nominator?.businessName ?? null,
        nominator?.businessLocation ?? null,
        nominator?.businessCategory ?? null,

        JSON.stringify(payload.supporting ?? {}),
        Boolean(payload.agreedToTerms),
        JSON.stringify(payload),
        session?.sub ?? null,
        site.id,
      ],
    );

    const id = rows[0]?.id;
    console.log('[/api/nominate] nomination saved', { id });

    // If a profile photo was uploaded and the nominee is a registered user,
    // copy it into their "My Awards Profile" — but only when they don't already
    // have one, so we never overwrite a picture they chose themselves.
    const photo = (nominee as {
      photo?: { name?: string; type?: string; url?: string };
    } | null)?.photo;
    const nomineeEmailLc = (nominee?.email ?? '').trim().toLowerCase();
    if (
      photo?.url &&
      /^https:\/\/[^"']+\.blob\.vercel-storage\.com\//.test(photo.url) &&
      nomineeEmailLc
    ) {
      try {
        await query(
          `UPDATE users
              SET profile = jsonb_set(
                    coalesce(profile, '{}'::jsonb),
                    '{profilePicture}',
                    $2::jsonb,
                    true
                  ),
                  updated_at = now()
            WHERE lower(email) = $1
              AND coalesce(profile->'profilePicture', 'null'::jsonb) = 'null'::jsonb`,
          [
            nomineeEmailLc,
            JSON.stringify({
              name: photo.name ?? 'photo',
              type: photo.type ?? '',
              url: photo.url,
            }),
          ],
        );
      } catch (err) {
        console.error('[/api/nominate] failed to copy photo to profile', err);
      }
    }

    // Automatic confirmation emails (editable templates). Never throw.
    const nomineeName = [nominee?.firstName, nominee?.lastName].filter(Boolean).join(' ') || 'there';
    const nominatorName = [nominator?.firstName, nominator?.lastName].filter(Boolean).join(' ') || 'there';
    const categories = (payload.awardCategories ?? []).join(', ') || 'the awards';
    const nomineeEmail = nominee?.email ?? null;
    const nominatorEmail = nominator?.email ?? null;
    await sendTemplateEmail('nominee_confirmation', nomineeEmail, {
      nomineeName,
      nominatorName,
      categories,
    }, { site });
    // Skip the nominator email when it's a self-nomination (same inbox).
    if (nominatorEmail && nominatorEmail.toLowerCase() !== (nomineeEmail ?? '').toLowerCase()) {
      await sendTemplateEmail('nominator_thankyou', nominatorEmail, {
        nominatorName,
        nomineeName,
        categories,
      }, { site });
    }

    /* ─────────────────────────────────────────────────────────────────────
     * PARKED: upstream forward + confirmation emails.
     *
     * Previously, on a successful save we forwarded the submission to the PHP
     * API and then sent the nominee/nominator emails. Both are disabled for
     * now. To re-enable, restore the imports/config above and uncomment:
     *
     *   const upstream = await fetch(UPSTREAM_URL, {
     *     method: 'POST',
     *     headers: {
     *       Accept: 'application/json',
     *       'X-API-Key': API_KEY,
     *       'User-Agent': USER_AGENT,
     *       'Content-Type': 'application/json',
     *     },
     *     body: JSON.stringify(payload),
     *     cache: 'no-store',
     *   });
     *   const upstreamText = await upstream.text();
     *
     *   if (upstream.ok) {
     *     const nominationId = extractNominationId(upstreamText);
     *     await sendNominationEmails(payload, nominationId);
     *   }
     * ───────────────────────────────────────────────────────────────────── */

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[/api/nominate] failed to save nomination', err);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }
}
