import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { QuestionLibraryClient } from '@/components/organiser/QuestionLibraryClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function QuestionLibraryPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();

  // Ensure question-library schema (once per server process — see lib/ensureOnce).
  await ensureOnce('question_library', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS question_library (
        id SERIAL PRIMARY KEY,
        author_site_id INTEGER,
        question_text TEXT NOT NULL,
        question_type VARCHAR(30) NOT NULL DEFAULT 'eligibility',
        field_type VARCHAR(20) NOT NULL DEFAULT 'text',
        options JSONB,
        source_category VARCHAR(255),
        is_required BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await query(`ALTER TABLE question_library ADD COLUMN IF NOT EXISTS source_category VARCHAR(255)`);
    await query(`
      CREATE TABLE IF NOT EXISTS event_library_question_links (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        question_library_id INTEGER NOT NULL REFERENCES question_library(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_required BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(event_id, question_library_id)
      )
    `);
  });

  const { rows: questions } = await query<{
    id: number; question_text: string;
    question_type: 'eligibility' | 'category_specific' | 'application';
    field_type: string; options: string[] | null; source_category: string | null;
    is_required: boolean; display_order: number; is_active: boolean;
  }>(`SELECT * FROM question_library ORDER BY question_type, display_order, id`).catch(() => ({ rows: [] }));

  // Fetch events for this site
  const { rows: events } = await query<{ id: number; title: string; status: string }>(
    `SELECT id, title, status FROM events WHERE site_id = $1 ORDER BY created_at DESC`,
    [siteId],
  ).catch(() => ({ rows: [] }));

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Question Library</h1>
          <p className="mt-1 text-sm text-white/40">
            Eligibility questions ko specific event ke liye assign karo. Category questions categories pe assign hote hain.
          </p>
        </div>
        <QuestionLibraryClient
          initialQuestions={questions}
          events={events}
          siteId={siteId}
        />
      </div>
    </div>
  );
}
