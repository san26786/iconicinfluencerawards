// Organiser-only: bulk import potential users — ONE CHUNK per request. The
// wizard does parsing, column mapping and de-duplication client-side, then
// uploads the already-structured survivors in ~1k-row chunks. The server just
// validates + bulk-inserts via UNNEST (one query per chunk, not per row) and
// registers any new custom fields. No ON CONFLICT — duplicates are handled by
// the wizard's dedup step (the unique-email rule was removed).

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { registerFieldDefs, RESERVED_KEYS, type FieldDef } from "@/lib/fields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHUNK = 2000;
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const str = (v: unknown, max = 255): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};

type Row = {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  company?: unknown;
  phone?: unknown;
  title?: unknown;
  position?: unknown;
  gender?: unknown;
  custom?: unknown;
};

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "organiser") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let b: { rows?: unknown; fieldDefs?: unknown; source?: unknown };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!Array.isArray(b.rows))
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });

  // Where these contacts came from — chosen in the import wizard (defaults to 'csv').
  const source = str(b.source, 120) ?? "csv";
  if (b.rows.length > MAX_CHUNK) {
    return NextResponse.json(
      { error: `Chunk too large (max ${MAX_CHUNK}).` },
      { status: 400 },
    );
  }

  const firstNames: (string | null)[] = [];
  const lastNames: (string | null)[] = [];
  const emails: string[] = [];
  const companies: (string | null)[] = [];
  const phones: (string | null)[] = [];
  const titles: (string | null)[] = [];
  const positions: (string | null)[] = [];
  const genders: (string | null)[] = [];
  const customs: string[] = [];
  let skipped = 0;

  for (const raw of b.rows as Row[]) {
    const email = (str(raw?.email) ?? "").toLowerCase();
    if (!emailOk(email)) {
      skipped++;
      continue;
    }
    // Keep only non-empty, non-reserved custom values.
    const custom: Record<string, string> = {};
    if (raw?.custom && typeof raw.custom === "object") {
      for (const [k, v] of Object.entries(
        raw.custom as Record<string, unknown>,
      )) {
        if (!RESERVED_KEYS.has(k) && typeof v === "string" && v.trim()) {
          custom[k] = v.trim().slice(0, 2000);
        }
      }
    }
    firstNames.push(str(raw?.firstName, 120));
    lastNames.push(str(raw?.lastName, 120));
    emails.push(email);
    companies.push(str(raw?.company));
    phones.push(str(raw?.phone, 40));
    titles.push(str(raw?.title, 120));
    positions.push(str(raw?.position, 120));
    genders.push(str(raw?.gender, 20));
    customs.push(JSON.stringify(custom));
  }

  let inserted = 0;
  if (emails.length > 0) {
    const res = await query(
      `INSERT INTO potential_users (first_name, last_name, email, company, phone, title, position, gender, source, custom)
       SELECT x.fn, x.ln, x.email, x.co, x.ph, x.ti, x.po, x.ge, $10, x.custom::jsonb
         FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[])
              AS x(fn, ln, email, co, ph, ti, po, ge, custom)`,
      [
        firstNames,
        lastNames,
        emails,
        companies,
        phones,
        titles,
        positions,
        genders,
        customs,
        source,
      ],
    );
    inserted = res.rowCount ?? emails.length;
  }

  if (Array.isArray(b.fieldDefs)) {
    await registerFieldDefs(b.fieldDefs as FieldDef[]);
  }

  return NextResponse.json({ ok: true, inserted, skipped });
}
