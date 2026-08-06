// Template variable substitution for the email designer + send queue.
// Placeholders look like {{firstName}}. Unknown variables render as empty so a
// half-filled record never leaks "{{…}}" into a real email.

export type TemplateVars = Record<string, string>;

export function renderTemplate(tpl: string, vars: TemplateVars): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) =>
    key in vars && vars[key] != null ? String(vars[key]) : "",
  );
}

// Derive a readable plain-text version from rendered HTML. Sending a
// multipart/alternative (text + html) message instead of HTML-only is a
// meaningful deliverability win — HTML-only bodies are a common spam signal.
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Keep links readable as "text (url)".
    .replace(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_m, href, inner) => {
        const t = inner.replace(/<[^>]+>/g, "").trim();
        if (!t) return href;
        return href.includes(t) ? t : `${t} (${href})`;
      },
    )
    .replace(/<\/(p|div|tr|h[1-6]|li|table|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&(#39|apos);/gi, "'")
    .replace(/&quot;/gi, '"')
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// The variables the designer advertises. CSV imports can add more (any extra
// column becomes a usable {{column}} variable via custom — see varsFor*).
export const TEMPLATE_VARIABLES: { key: string; label: string }[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "fullName", label: "Full name" },
  { key: "email", label: "Email" },
  { key: "company", label: "Company" },
  { key: "title", label: "Title" },
  { key: "position", label: "Position" },
  { key: "phone", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "siteName", label: "Site name" },
  { key: "siteUrl", label: "Site URL" },
  { key: "year", label: "Year" },
  // Resolved per-recipient at send time (server-side); links to the nomination
  // form pre-filled with the recipient's basic details.
  { key: "nominationLink", label: "Nomination link (prefilled)" },
];

export type PotentialUserLike = {
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  company?: string | null;
  title?: string | null;
  position?: string | null;
  phone?: string | null;
  gender?: string | null;
  custom?: Record<string, unknown> | null;
};

/** Build the variable map for one potential user + brand context. */
export function varsForPotentialUser(
  u: PotentialUserLike,
  brand: { siteName: string; siteUrl: string; year: string | number },
): TemplateVars {
  const first = (u.first_name ?? u.firstName ?? "") || "";
  const last = (u.last_name ?? u.lastName ?? "") || "";
  const base: TemplateVars = {
    firstName: first,
    lastName: last,
    fullName: [first, last].filter(Boolean).join(" "),
    email: u.email ?? "",
    company: u.company ?? "",
    title: u.title ?? "",
    position: u.position ?? "",
    phone: u.phone ?? "",
    gender: u.gender ?? "",
    siteName: brand.siteName,
    siteUrl: brand.siteUrl,
    year: String(brand.year),
  };
  // Any custom CSV columns become variables too (won't clobber the base set).
  if (u.custom && typeof u.custom === "object") {
    for (const [k, v] of Object.entries(u.custom)) {
      if (!(k in base)) base[k] = v == null ? "" : String(v);
    }
  }
  return base;
}
