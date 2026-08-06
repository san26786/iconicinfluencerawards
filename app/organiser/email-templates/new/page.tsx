import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getBrandConfig } from '@/lib/email/brand';
import { defaultBlocks } from '@/lib/email/blocks';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { EmailTemplateEditor } from '@/components/organiser/EmailTemplateEditor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'New email template' };

export default async function NewEmailTemplatePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const brand = getBrandConfig();
  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <h1 className="mb-6 font-display text-2xl font-semibold text-white sm:text-3xl">New email template</h1>
        <EmailTemplateEditor
          initial={{ name: '', subject: '', html: '', description: '', design: defaultBlocks }}
          brand={{ siteName: brand.name, siteUrl: brand.siteUrl, year: String(brand.year) }}
        />
      </div>
    </main>
  );
}
