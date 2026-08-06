// POST /api/organiser/seed-property-questions
//
// Seeds the question library for this site: ten eligibility questions asked of
// every entrant, plus four category-specific questions for each of the
// categories in lib/content.ts.
//
// Category questions come from a per-theme template rather than 240 hand-typed
// strings — every category in a theme is judged on the same four dimensions, so
// the template interpolates the category name and stays in step automatically
// when the taxonomy in lib/content.ts changes.
//
// Idempotent: existing questions are matched on question_text and skipped, so
// re-running only fills gaps.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';
import { AWARD_CATEGORIES, type ThemeId } from '@/lib/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELIGIBILITY_QUESTIONS = [
  {
    question_text: 'How long has your business/organisation been operating?',
    field_type: 'select',
    options: ['Less than 6 Months', '6–12 Months', '1–3 Years', '3–5 Years', '5–10 Years', '10+ Years'],
  },
  {
    question_text: 'Which part of the property industry do you primarily work in?',
    field_type: 'select',
    options: ['Sales Agency', 'Lettings Agency', 'Commercial Agency', 'Development', 'Construction', 'Property Management', 'Surveying', 'Legal', 'Finance & Lending', 'PropTech', 'Other'],
  },
  {
    question_text: 'What is your primary business size?',
    field_type: 'select',
    options: ['Sole Trader', '2–10 Employees', '11–50 Employees', '51–100 Employees', '101–250 Employees', '250+ Employees'],
  },
  {
    question_text: 'How many offices or sites do you operate from?',
    field_type: 'select',
    options: ['1', '2–5', '6–15', '16–50', '50+'],
  },
  {
    question_text: 'What best describes your growth over the last 12 months?',
    field_type: 'select',
    options: ['Startup / Early Stage', 'Stable Growth', 'Moderate Growth', 'Rapid Growth', 'Significant Expansion', 'Industry-Leading Growth'],
  },
  {
    question_text: 'Which region does your business primarily operate in?',
    field_type: 'select',
    options: ['Local', 'Regional', 'National', 'International'],
  },
  {
    question_text: 'Have you introduced any new service, technology or process in the last 24 months?',
    field_type: 'select',
    options: ['Yes – Major Innovation', 'Yes – Moderate Improvements', 'Minor Changes', 'No New Changes Yet'],
  },
  {
    question_text: 'How would you describe your client satisfaction levels?',
    field_type: 'select',
    options: ['Exceptional', 'Very Strong', 'Good', 'Average', 'Improving'],
  },
  {
    question_text: 'Do you track measurable KPIs and performance metrics?',
    field_type: 'select',
    options: ['Yes – Advanced Reporting Systems', 'Yes – Basic KPI Tracking', 'Limited Tracking', 'No Formal Tracking'],
  },
  {
    question_text: 'Why are you entering the Property Excellence Awards?',
    field_type: 'select',
    options: ['Industry Recognition', 'Brand Visibility', 'Credibility & Trust', 'Team Motivation', 'Business Growth', 'Networking Opportunities', 'Partnership Opportunities', 'Investment & Expansion Visibility'],
  },
];

/**
 * Four judging angles per theme. `{c}` is replaced with the category name so
 * every question reads as if it were written for that specific award.
 */
const THEME_QUESTION_TEMPLATES: Record<ThemeId, string[]> = {
  agency: [
    'What results — instructions won, properties sold or let, fee income — make your case for {c}?',
    'How do you win and retain clients in a market where every competitor promises the same thing?',
    'Describe how you handled a difficult transaction or chain, and what the client experience was like.',
    'What have you changed in the last 12 months that measurably improved performance?',
  ],
  development: [
    'Describe the scheme or portfolio you are entering for {c}, including scale, timeline and outcome.',
    'What problem did the site or building present, and how did your approach solve it?',
    'What measurable impact has the work had — on residents, occupiers, the local area or returns?',
    'How did you manage sustainability, quality and cost across delivery?',
  ],
  services: [
    'What service standards and results support your entry for {c}?',
    'Describe a complex instruction your team handled and the outcome you achieved for the client.',
    'What systems, processes or expertise set your firm apart from others doing the same work?',
    'Share measurable evidence of client retention, satisfaction or business growth.',
  ],
  proptech: [
    'What does your product or innovation do, and what problem in property does it solve?',
    'What measurable adoption, savings or performance gains has it delivered for users?',
    'How is your approach genuinely different from what already exists in the market?',
    'What is the roadmap, and how will you sustain the impact behind your {c} entry?',
  ],
  individual: [
    'What personal achievements over the last 12 months support your entry for {c}?',
    'Describe a moment where your judgement or effort changed the outcome for a client or colleague.',
    'How have you developed your own expertise, and how do you pass it on to others?',
    'What measurable results — deals, growth, retention, promotion — can you evidence?',
  ],
  team: [
    'Describe the team, culture or programme you are entering for {c}.',
    'What have you put in place, and what measurable difference has it made to people?',
    'How do you know it is working — what do retention, engagement or feedback data show?',
    'What impact has this had beyond the business itself?',
  ],
};

export async function POST() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const siteId = await getSiteId();

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
  `).catch(() => {});
  await query(`ALTER TABLE question_library ADD COLUMN IF NOT EXISTS source_category VARCHAR(255)`).catch(() => {});
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
  `).catch(() => {});

  let inserted = 0;
  let skipped = 0;
  const eligibilityIds: number[] = [];

  for (let i = 0; i < ELIGIBILITY_QUESTIONS.length; i++) {
    const q = ELIGIBILITY_QUESTIONS[i];
    const exists = await query<{ id: number }>(
      `SELECT id FROM question_library
        WHERE question_text = $1 AND question_type = 'eligibility' AND author_site_id = $2
        LIMIT 1`,
      [q.question_text, siteId],
    );
    if (exists.rows[0]) { eligibilityIds.push(exists.rows[0].id); skipped++; continue; }
    const ins = await query<{ id: number }>(
      `INSERT INTO question_library (author_site_id, question_text, question_type, field_type, options, display_order)
       VALUES ($1,$2,'eligibility',$3,$4,$5) RETURNING id`,
      [siteId, q.question_text, q.field_type, JSON.stringify(q.options), i + 1],
    );
    eligibilityIds.push(ins.rows[0].id);
    inserted++;
  }

  let catOrder = 3000;
  let categoryCount = 0;

  for (const group of AWARD_CATEGORIES) {
    const template = THEME_QUESTION_TEMPLATES[group.id];
    const categories = [...group.popular, ...group.prime, ...group.more];

    for (const categoryName of categories) {
      categoryCount++;
      for (const line of template) {
        const qtext = line.replace('{c}', categoryName);
        const exists = await query(
          `SELECT id FROM question_library
            WHERE question_text = $1 AND question_type = 'category_specific'
              AND source_category = $2 AND author_site_id = $3
            LIMIT 1`,
          [qtext, categoryName, siteId],
        );
        if (exists.rows.length > 0) { skipped++; continue; }
        await query(
          `INSERT INTO question_library (author_site_id, question_text, question_type, field_type, display_order, source_category)
           VALUES ($1,$2,'category_specific','paragraph',$3,$4)`,
          [siteId, qtext, catOrder++, categoryName],
        );
        inserted++;
      }
    }
  }

  // Auto-assign the eligibility set to this site's featured event, so a fresh
  // programme has a working entry form without any further clicks.
  let linked = 0;
  let eventTitle = '';
  const { rows: events } = await query<{ id: number; title: string }>(
    `SELECT id, title FROM events
      WHERE site_id = $1 AND status IN ('upcoming','ongoing')
      ORDER BY is_featured DESC, created_at DESC
      LIMIT 1`,
    [siteId],
  );

  if (events[0]) {
    eventTitle = events[0].title;
    for (let i = 0; i < eligibilityIds.length; i++) {
      await query(
        `INSERT INTO event_library_question_links (event_id, question_library_id, display_order, is_required)
         VALUES ($1,$2,$3,true) ON CONFLICT (event_id, question_library_id) DO NOTHING`,
        [events[0].id, eligibilityIds[i], i + 1],
      );
      linked++;
    }
  }

  return NextResponse.json({
    ok: true,
    inserted,
    skipped,
    total: ELIGIBILITY_QUESTIONS.length + categoryCount * 4,
    categories: categoryCount,
    linked,
    linkedTo: eventTitle || null,
  });
}
