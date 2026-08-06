// Fires an automatic ("system") email by its slug — looks up the editable
// template in the DB, renders it with the given variables + brand context, and
// sends it. Never throws: a missing template or send failure is logged and
// swallowed so it can't break the request that triggered it (registration,
// nomination submit, …).

import { query } from "@/lib/db";
import type { SiteData } from "@/lib/site";
import { getBrandConfig } from "./brand";
import { renderTemplate, type TemplateVars } from "./template";
import { sendMail } from "./send";
import {
  getOrCreatePrefillToken,
  getPublicBaseUrl,
  prefillLink,
  type PrefillSource,
} from "./prefill";

export async function sendTemplateEmail(
  slug: string,
  to: string | null | undefined,
  vars: TemplateVars = {},
  opts: { prefill?: { source: PrefillSource; refId: number }; site?: SiteData } = {},
): Promise<void> {
  if (!to) return;
  try {
    const { rows } = await query<{ subject: string; html: string }>(
      "SELECT subject, html FROM email_templates WHERE slug = $1 AND deleted_at IS NULL",
      [slug],
    );
    const tpl = rows[0];
    if (!tpl) {
      console.warn(
        `[email/system] no template for slug "${slug}" — skipping send to`,
        to,
      );
      return;
    }
    const brand = getBrandConfig(opts.site);
    const merged: TemplateVars = {
      siteName: brand.name,
      siteUrl: brand.siteUrl,
      year: String(brand.year),
      ...vars,
    };

    // Resolve {{nominationLink}} for this person (prefilled nomination form).
    if (opts.prefill) {
      const base = getPublicBaseUrl(brand.siteUrl);
      const token = base
        ? await getOrCreatePrefillToken(opts.prefill.source, opts.prefill.refId)
        : null;
      if (base && token) merged.nominationLink = prefillLink(base, token);
    }
    await sendMail({
      to,
      subject: renderTemplate(tpl.subject, merged),
      html: renderTemplate(tpl.html, merged),
      siteId: opts.site?.id,
    });
  } catch (err) {
    console.error(`[email/system] failed to send "${slug}" to`, to, err);
  }
}
