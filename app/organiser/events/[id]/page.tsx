import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { EventDetailClient } from '@/components/organiser/EventDetailClient';
import type { QueryResultRow } from 'pg';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EventRow = { id: number; title: string; status: string } & QueryResultRow;
type ThemeRow = { id: number; name: string; icon: string; linked_site_id: number | null } & QueryResultRow;
type CategoryRow = {
  id: number; event_id: number; theme_id: number | null; name: string;
  tagline: string | null; short_name: string | null; short_summary: string | null;
  description: string | null; eligibility: string | null; judging_criteria: string | null;
  qualitative_criteria: string | null; metrics: string | null; additional_criteria: string | null;
  icon: string | null; entry_fee: string | null; display_order: number;
  is_active: boolean; promo: boolean;
  theme_name: string | null; theme_icon: string | null;
} & QueryResultRow;
type QuestionRow = {
  id: number; event_id: number; question_type: string; question_text: string;
  field_type: string; options: string[] | null; is_required: boolean;
  display_order: number; is_active: boolean;
} & QueryResultRow;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id } = await params;
  const siteId = await getSiteId();

  const { rows: evRows } = await query<EventRow>(
    `SELECT id, title, status FROM events WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );
  if (!evRows[0]) notFound();
  const event = evRows[0];

  const [{ rows: themes }, { rows: categories }, { rows: questions }, { rows: libraryQuestions }] = await Promise.all([
    query<ThemeRow>(
      `SELECT id, name, icon, linked_site_id FROM themes WHERE site_id = $1 ORDER BY display_order, name`,
      [siteId],
    ),
    query<CategoryRow>(
      `SELECT ec.*, t.name AS theme_name, t.icon AS theme_icon
         FROM event_categories ec
         LEFT JOIN themes t ON t.id = ec.theme_id
        WHERE ec.event_id = $1
        ORDER BY ec.display_order, ec.name`,
      [Number(id)],
    ),
    query<QuestionRow>(
      `SELECT * FROM event_questions WHERE event_id = $1 ORDER BY question_type, display_order, id`,
      [Number(id)],
    ),
    query<{ id: number; question_text: string; field_type: string; options: string[] | null; is_required: boolean; display_order: number }>(
      `SELECT ql.id, ql.question_text, ql.field_type, ql.options, elql.is_required, elql.display_order
         FROM event_library_question_links elql
         JOIN question_library ql ON ql.id = elql.question_library_id
        WHERE elql.event_id = $1
        ORDER BY elql.display_order, elql.id`,
      [Number(id)],
    ).catch(() => ({ rows: [] })),
  ]);

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />

        <div className="mb-8">
          <Link
            href="/organiser/events"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Events
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">{event.title}</h1>
              <p className="mt-1 text-sm text-white/40 capitalize">{event.status}</p>
            </div>
            <Link
              href={`/organiser/events/${event.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-white/75 hover:border-gold/40 hover:text-white transition-colors"
            >
              Edit Event Details
            </Link>
          </div>
        </div>

        <EventDetailClient
          eventId={Number(id)}
          themes={themes}
          initialCategories={categories}
          initialQuestions={questions}
          libraryQuestions={libraryQuestions}
        />
      </div>
    </div>
  );
}
