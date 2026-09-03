import { getSite, getSiteId } from '@/lib/site';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { prefillForUserId } from '@/lib/email/prefill';
import ApplicationForm from '@/components/ApplicationForm';
import type { ApplicationPrefill } from '@/components/ApplicationForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type EventQuestion = {
  id: number;
  question_text: string;
  /**
   * How the question is answered.
   *
   * The four named here were the whole union, and the question library holds
   * eight hundred rows typed `paragraph` — a value the type said could not
   * exist, so the form had no branch for it and drew those questions with no
   * answer box at all. `paragraph` is named now, and the open end is honest
   * about the rest: this is a free-text column that organisers and imports both
   * write to, and the form treats anything it does not recognise as prose.
   */
  field_type: 'yes_no' | 'text' | 'paragraph' | 'number' | 'select' | (string & {});
  options: string[] | null;
  is_required: boolean;
  display_order: number;
};

export default async function ApplyPage() {
  const [site, sessionUser] = await Promise.all([getSite(), getSessionUser()]);
  const siteId = await getSiteId();

  // Get the site's most recent active event
  const { rows: events } = await query(
    `SELECT id, title FROM events
      WHERE site_id = $1 AND status IN ('upcoming','ongoing')
      ORDER BY is_featured DESC, created_at DESC
      LIMIT 1`,
    [siteId],
  );

  const eventId: number | null = events[0]?.id ?? null;
  const eventTitle: string = events[0]?.title ?? site.name;

  // Load eligibility and application questions for that event
  let eligibilityQuestions: EventQuestion[] = [];
  let applicationQuestions: EventQuestion[] = [];

  if (eventId) {
    const { rows } = await query<EventQuestion & { question_type: string }>(
      `SELECT id, question_type, question_text, field_type, options, is_required, display_order
         FROM event_questions
        WHERE event_id = $1 AND is_active = true
        ORDER BY display_order, id`,
      [eventId],
    );
    eligibilityQuestions = rows.filter(q => q.question_type === 'eligibility');
    applicationQuestions = rows.filter(q => q.question_type === 'application');

    // Also load eligibility questions from Question Library assigned to this event
    const { rows: libRows } = await query<EventQuestion>(
      `SELECT ql.id, ql.question_text, ql.field_type, ql.options, elql.is_required, elql.display_order
         FROM event_library_question_links elql
         JOIN question_library ql ON ql.id = elql.question_library_id
        WHERE elql.event_id = $1
        ORDER BY elql.display_order, elql.id`,
      [eventId],
    ).catch(() => ({ rows: [] }));

    // Merge: library questions go first, avoid duplicates by question_text
    const existingTexts = new Set(eligibilityQuestions.map(q => q.question_text));
    const freshLibRows = libRows.filter(q => !existingTexts.has(q.question_text));
    eligibilityQuestions = [...freshLibRows, ...eligibilityQuestions];
  }

  // Pre-fill from logged-in user's profile
  let prefill: ApplicationPrefill | undefined;
  if (sessionUser) {
    const pd = await prefillForUserId(sessionUser.sub);
    if (pd) {
      prefill = {
        first_name: pd.firstName,
        last_name:  pd.lastName,
        email:      pd.email,
        mobile:     pd.mobile,
        org_name:   pd.businessName,
        org_city:   pd.businessLocation,
        industry:   pd.businessCategory,
      };
    }
  }

  return (
    <main id="main" className="min-h-screen bg-ink grain pt-20">
      <ApplicationForm
        siteName={site.name}
        eventTitle={eventTitle}
        eventId={eventId}
        eligibilityQuestions={eligibilityQuestions}
        applicationQuestions={applicationQuestions}
        prefill={prefill}
      />
    </main>
  );
}
