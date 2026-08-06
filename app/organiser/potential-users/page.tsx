import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getBrandConfig } from "@/lib/email/brand";
import { getFieldDefs } from "@/lib/fields";
import { OrganiserNav } from "@/components/organiser/OrganiserNav";
import {
  PotentialUsers,
  type FlowOption,
  type TemplateOption,
} from "@/components/organiser/PotentialUsers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Potential Users" };

export default async function PotentialUsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "organiser") redirect("/account");

  // The list itself is fetched client-side from /api/organiser/potential-users/list
  // (server-side paginated + filtered), so we only load the lightweight bits the
  // page needs up front: templates, custom-field defs, and brand context.
  const [tplRes, flowRes] = await Promise.all([
    query<{ id: number; name: string; subject: string; html: string }>(
      `SELECT id, name, subject, html FROM email_templates WHERE deleted_at IS NULL ORDER BY name`,
    ),
    query<{
      id: number;
      name: string;
      description: string | null;
      step_count: string;
    }>(
      `SELECT f.id, f.name, f.description, count(s.id)::text AS step_count
         FROM email_flows f
         LEFT JOIN email_flow_steps s
           ON s.flow_id = f.id
          AND s.enabled = true
          AND s.template_id IS NOT NULL
        WHERE f.enabled = true AND f.deleted_at IS NULL
        GROUP BY f.id
        HAVING count(s.id) > 0
        ORDER BY f.name`,
    ),
  ]);
  const fieldDefs = await getFieldDefs();
  const templates: TemplateOption[] = tplRes.rows;
  const flows: FlowOption[] = flowRes.rows.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description ?? "",
    stepCount: Number(f.step_count) || 0,
  }));

  const brand = getBrandConfig();

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
          Organiser
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
          Potential Users
        </h1>
        <p className="mb-6 mt-2 text-sm text-white/55">
          Maintain your outreach list — add manually, import a CSV, then select
          people to email a template.
        </p>
        <PotentialUsers
          templates={templates}
          flows={flows}
          brand={{
            siteName: brand.name,
            siteUrl: brand.siteUrl,
            year: String(brand.year),
          }}
          fieldDefs={fieldDefs}
        />
      </div>
    </main>
  );
}
