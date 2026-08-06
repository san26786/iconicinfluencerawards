import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const siteId = await getSiteId();
  const eventId = Number(id);

  // Ensure columns added after initial schema creation exist
  for (const col of ['pre_launch_date', 'nomination_opens','nomination_closes','application_deadline','judging_start','judging_end','winners_announced']) {
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS ${col} date`).catch(() => {});
  }
  await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true`).catch(() => {});

  // Verify source event belongs to this site
  const { rows: srcRows } = await query(
    `SELECT * FROM events WHERE id = $1 AND site_id = $2`,
    [eventId, siteId],
  );
  if (!srcRows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const src = srcRows[0];

  // Clone the event (prefix title, keep all other fields, status → upcoming)
  const { rows: newEventRows } = await query(
    `INSERT INTO events (
       site_id, title, description, event_date, event_date_label,
       venue, venue_address, ticket_url, is_featured, is_public, status,
       pre_launch_date,
       nomination_opens, nomination_closes, application_deadline,
       judging_start, judging_end, winners_announced
     ) VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10, $11,
       $12,
       $13, $14, $15,
       $16, $17, $18
     ) RETURNING *`,
    [
      siteId,
      `Copy of ${src.title}`,
      src.description,
      src.event_date,
      src.event_date_label,
      src.venue,
      src.venue_address,
      src.ticket_url,
      src.is_featured ?? false,
      src.is_public ?? true,
      'upcoming',
      src.pre_launch_date    ?? null,
      src.nomination_opens   ?? null,
      src.nomination_closes  ?? null,
      src.application_deadline ?? null,
      src.judging_start      ?? null,
      src.judging_end        ?? null,
      src.winners_announced  ?? null,
    ],
  );
  const newEvent = newEventRows[0];

  // Clone categories
  const { rows: cats } = await query(
    `SELECT * FROM event_categories WHERE event_id = $1 ORDER BY display_order, id`,
    [eventId],
  );
  for (const c of cats) {
    await query(
      `INSERT INTO event_categories (
         event_id, theme_id, name, tagline, short_name, short_summary, description,
         eligibility, judging_criteria, qualitative_criteria, metrics,
         additional_criteria, icon, entry_fee, display_order, is_active, promo
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        newEvent.id,
        c.theme_id,
        c.name,
        c.tagline,
        c.short_name,
        c.short_summary,
        c.description,
        c.eligibility,
        c.judging_criteria,
        c.qualitative_criteria,
        c.metrics,
        c.additional_criteria,
        c.icon,
        c.entry_fee ?? 0,
        c.display_order ?? 0,
        c.is_active ?? true,
        c.promo ?? false,
      ],
    );
  }

  // Clone questions (eligibility + application)
  const { rows: qs } = await query(
    `SELECT * FROM event_questions WHERE event_id = $1 ORDER BY question_type, display_order, id`,
    [eventId],
  );
  for (const q of qs) {
    await query(
      `INSERT INTO event_questions
         (event_id, question_type, question_text, field_type, options, is_required, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        newEvent.id,
        q.question_type,
        q.question_text,
        q.field_type,
        q.options,
        q.is_required ?? true,
        q.display_order ?? 0,
      ],
    );
  }

  return NextResponse.json({
    ok: true,
    event: newEvent,
    cloned: { categories: cats.length, questions: qs.length },
  }, { status: 201 });
}
