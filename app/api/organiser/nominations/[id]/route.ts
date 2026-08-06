// Organiser-only update of a nomination. Accepts the SAME nested payload the
// public form builds (components/RegisterForm.tsx → buildNominationPayload), so
// editing reuses the exact same form. Updates the flattened display/filter
// columns plus the supporting jsonb, and refreshes raw_payload to match.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const str = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
};
const toBool = (v: unknown): boolean => v === true || v === 'yes';

type Payload = {
  awardCategories?: unknown;
  selfNominate?: unknown;
  agreedToTerms?: unknown;
  nominee?: Record<string, unknown>;
  nominator?: Record<string, unknown>;
  supporting?: unknown;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  let b: Payload;
  try {
    b = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const nominee = b.nominee ?? {};
  const nominator = b.nominator ?? {};
  const categories = Array.isArray(b.awardCategories)
    ? (b.awardCategories as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];

  const { rowCount } = await query(
    `UPDATE nominations SET
       award_categories     = $1::jsonb,
       self_nominate        = $2,
       anonymous            = $3,
       nominee_first_name   = $4,
       nominee_last_name    = $5,
       nominee_email        = $6,
       nominee_mobile       = $7,
       nominee_work_phone   = $8,
       nominee_organisation = $9,
       nominee_post_code    = $10,
       opening_statement    = $11,
       linked_in            = $12,
       how_heard            = $13,
       nominator_first_name = $14,
       nominator_last_name  = $15,
       nominator_email      = $16,
       nominator_mobile     = $17,
       nominator_work_phone = $18,
       business_name        = $19,
       business_location    = $20,
       business_category    = $21,
       supporting           = $22::jsonb,
       agreed_to_terms      = $23,
       raw_payload          = $24::jsonb
     WHERE id = $25 AND deleted_at IS NULL`,
    [
      JSON.stringify(categories),
      toBool(b.selfNominate),
      toBool(nominee.anonymous),
      str(nominee.firstName),
      str(nominee.lastName),
      str(nominee.email),
      str(nominee.mobile),
      str(nominee.workPhone),
      str(nominee.organisation),
      str(nominee.postCode),
      str(nominee.openingStatement),
      str(nominee.linkedIn),
      str(nominee.howHeard),
      str(nominator.firstName),
      str(nominator.lastName),
      str(nominator.email),
      str(nominator.mobile),
      str(nominator.workPhone),
      str(nominator.businessName),
      str(nominator.businessLocation),
      str(nominator.businessCategory),
      JSON.stringify(b.supporting ?? {}),
      toBool(b.agreedToTerms),
      JSON.stringify(b),
      numId,
    ],
  );

  if (!rowCount) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  // Soft delete: keep the row, hide it everywhere by stamping deleted_at.
  const { rowCount } = await query(
    'UPDATE nominations SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL',
    [numId],
  );

  if (!rowCount) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
