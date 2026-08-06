import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getBrandConfig } from '@/lib/email/brand';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { EmailTemplateEditor } from '@/components/organiser/EmailTemplateEditor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit email template' };

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) notFound();

  const { rows } = await query<{
    id: number;
    name: string;
    subject: string;
    html: string;
    description: string | null;
    is_system: boolean;
    design: unknown;
  }>('SELECT id, name, subject, html, description, is_system, design FROM email_templates WHERE id=$1 AND deleted_at IS NULL', [numId]);
  const t = rows[0];
  if (!t) notFound();

  const brand = getBrandConfig();
  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <h1 className="mb-6 font-display text-2xl font-semibold text-white sm:text-3xl">{t.name}</h1>
        <EmailTemplateEditor
          initial={{
            id: t.id,
            name: t.name,
            subject: t.subject,
            html: t.html,
            description: t.description ?? '',
            isSystem: t.is_system,
            design: Array.isArray(t.design) ? t.design : undefined,
          }}
          brand={{ siteName: brand.name, siteUrl: brand.siteUrl, year: String(brand.year) }}
        />
      </div>
    </main>
  );
}
