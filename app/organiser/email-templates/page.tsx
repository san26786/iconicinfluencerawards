import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Mail, Plus } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email Templates' };

export default async function EmailTemplatesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { rows } = await query<{
    id: number;
    name: string;
    subject: string;
    description: string | null;
    is_system: boolean;
  }>(`SELECT id, name, subject, description, is_system FROM email_templates WHERE deleted_at IS NULL ORDER BY is_system DESC, name`);

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Organiser</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Email Templates</h1>
            <p className="mt-2 text-sm text-white/55">Design professional templates with variables, then send them to your potential users.</p>
          </div>
          <Link href="/organiser/email-templates/new" className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold">
            <Plus className="h-4 w-4" /> New template
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <Link key={t.id} href={`/organiser/email-templates/${t.id}`} className="group rounded-3xl glass p-5 transition-transform hover:-translate-y-0.5 hover:border-gold/40">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]"><Mail className="h-5 w-5 text-gold" /></span>
                {t.is_system && <span className="rounded-full border border-white/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white/55">System</span>}
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-white">{t.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-white/55">{t.description || t.subject}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
