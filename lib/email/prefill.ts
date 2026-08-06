// Prefill tokens (Option B): an opaque token maps to a potential_user or a
// registered user. The public nomination form swaps it for that person's basic
// details via /api/prefill, so no PII is ever carried in the link itself.
//
// Tokens are idempotent per person (unique source+ref_id) — re-sending an email
// reuses the same link. No expiry is enforced for now.

import crypto from "node:crypto";
import { query } from "@/lib/db";
import { profileFromRow } from "@/lib/profile";

export type PrefillSource = "potential_user" | "user";

// Maps onto the nomination form's "Your Information" (nominator) section.
export type PrefillData = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  businessName: string;
  businessLocation: string;
  businessCategory: string;
  categories: string[];
};

export function getPublicBaseUrl(brandSiteUrl = ""): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.PUBLIC_BASE_URL ||
    brandSiteUrl ||
    ""
  ).replace(/\/$/, "");
}

/** Link to the public nomination form carrying a prefill token. */
export function prefillLink(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/register-interest?pf=${encodeURIComponent(token)}`;
}

/** Get (or create) one stable token per person, in bulk. Returns ref_id → token. */
export async function getOrCreatePrefillTokens(
  source: PrefillSource,
  refIds: number[],
): Promise<Map<number, string>> {
  const ids = [...new Set(refIds.filter((n) => Number.isInteger(n)))];
  if (ids.length === 0) return new Map();

  const tokens = ids.map(() => crypto.randomBytes(24).toString("base64url"));
  await query(
    `INSERT INTO prefill_tokens (source, ref_id, token)
     SELECT $1, x.ref_id, x.token FROM unnest($2::int[], $3::text[]) AS x(ref_id, token)
     ON CONFLICT (source, ref_id) DO NOTHING`,
    [source, ids, tokens],
  );
  const { rows } = await query<{ ref_id: number; token: string }>(
    `SELECT ref_id, token FROM prefill_tokens WHERE source=$1 AND ref_id = ANY($2::int[])`,
    [source, ids],
  );
  return new Map(rows.map((r) => [r.ref_id, r.token]));
}

export async function getOrCreatePrefillToken(
  source: PrefillSource,
  refId: number,
): Promise<string | null> {
  const m = await getOrCreatePrefillTokens(source, [refId]);
  return m.get(refId) ?? null;
}

/** Resolve a token to the person's basic details (or null if unknown/deleted). */
export async function resolvePrefill(
  token: string,
): Promise<PrefillData | null> {
  const { rows } = await query<{ source: PrefillSource; ref_id: number }>(
    "SELECT source, ref_id FROM prefill_tokens WHERE token = $1",
    [token],
  );
  const t = rows[0];
  if (!t) return null;

  if (t.source === "potential_user") {
    const r = await query<{
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      company: string | null;
      phone: string | null;
      assigned_categories: string[] | null;
    }>(
      "SELECT first_name, last_name, email, company, phone, assigned_categories FROM potential_users WHERE id = $1 AND deleted_at IS NULL",
      [t.ref_id],
    );
    const u = r.rows[0];
    if (!u) return null;
    return {
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      email: u.email ?? "",
      mobile: u.phone ?? "",
      businessName: u.company ?? "",
      businessLocation: "",
      businessCategory: "",
      categories: Array.isArray(u.assigned_categories)
        ? u.assigned_categories
        : [],
    };
  }

  return prefillForUserId(t.ref_id);
}

/** Build prefill from a registered user's account + awards profile. */
export async function prefillForUserId(
  userId: number,
): Promise<PrefillData | null> {
  const r = await query<{
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    profile: unknown;
  }>(
    "SELECT first_name, last_name, email, phone, profile FROM users WHERE id = $1",
    [userId],
  );
  const u = r.rows[0];
  if (!u) return null;
  const p = profileFromRow(u);
  return {
    firstName: p.firstName || "",
    lastName: p.lastName || "",
    email: u.email || "",
    mobile: p.mobile || p.phone || "",
    businessName: p.orgName || "",
    businessLocation: p.orgCity || p.city || "",
    businessCategory: p.industry || "",
    categories: [],
  };
}
