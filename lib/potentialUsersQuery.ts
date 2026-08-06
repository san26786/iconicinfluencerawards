// Shared filter → SQL WHERE builder for the potential_users list/ids queries,
// so server-side search, column filters and "no categories" behave identically
// across the list (paginated rows), the count, and the select-all-matching ids.

export type PuFilters = {
  search?: string;
  title?: string;
  position?: string;
  gender?: string;
  company?: string;
  source?: string;
  noCategories?: boolean;
};

/** Read the filter set from a URL's query string. */
export function puFiltersFromParams(sp: URLSearchParams): PuFilters {
  const s = (k: string) => sp.get(k) ?? undefined;
  return {
    search: s("search"),
    title: s("title"),
    position: s("position"),
    gender: s("gender"),
    company: s("company"),
    source: s("source"),
    noCategories: sp.get("noCategories") === "1" || sp.get("noCategories") === "true",
  };
}

/**
 * Build a parameterised `WHERE …` (or '') plus its ordered params array.
 * `startIndex` offsets the `$N` placeholders so this WHERE can be embedded in a
 * larger query whose earlier params occupy `$1..$startIndex` (the audience
 * resolver uses this). Existing callers omit it → 0 → unchanged behaviour.
 */
export function buildPotentialUsersWhere(
  f: PuFilters,
  startIndex = 0,
): {
  where: string;
  params: unknown[];
} {
  // Soft-deleted rows are hidden from every list/count/ids query that builds on
  // this WHERE (and from the audience resolver, which embeds it as a subquery).
  const clauses: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  const eq = (col: string, val?: string) => {
    if (val && val.trim()) {
      params.push(val);
      clauses.push(`${col} = $${startIndex + params.length}`);
    }
  };
  eq("title", f.title);
  eq("position", f.position);
  eq("gender", f.gender);
  eq("company", f.company);
  eq("source", f.source);
  if (f.noCategories) {
    clauses.push(`coalesce(jsonb_array_length(assigned_categories), 0) = 0`);
  }
  const q = (f.search ?? "").trim();
  if (q) {
    // Search across every visible column AND the full custom JSON, so the box
    // matches any record regardless of which field the term lives in.
    params.push(`%${q}%`);
    clauses.push(`(
      coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(email,'') || ' ' ||
      coalesce(company,'') || ' ' || coalesce(title,'') || ' ' || coalesce(position,'') || ' ' ||
      coalesce(phone,'') || ' ' || coalesce(gender,'') || ' ' || coalesce(custom::text,'')
    ) ILIKE $${startIndex + params.length}`);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}
