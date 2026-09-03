// The judge's user guide, as data.
//
// Written for a panel member who has agreed to judge and has never opened the
// board. Every step names the thing on screen exactly as it is labelled, in the
// order it is pressed.
//
// Scoring works two ways depending on how the organiser set the award up — one
// mark per applicant, or a mark per question — and a judge who expects one and
// meets the other assumes the screen is broken. Both are described together
// rather than in separate places.
//
// Same shape and same renderer as the organiser and entrant guides: see
// lib/guide/types.ts.

import type { GuideSection } from '@/lib/guide/types';

export const JUDGE_GUIDE: GuideSection[] = [
  /* ─────────────────────────── Getting started ─────────────────────────── */
  {
    id: 'start',
    title: 'Getting started',
    blurb: 'Signing in, and what the panel is being asked to do.',
    modules: [
      {
        slug: 'signing-in',
        title: 'Signing in',
        where: 'Top right of the award site → Sign in',
        purpose: 'Judging happens behind your own login, on the award site you were invited to.',
        tasks: [
          {
            title: 'Sign in',
            steps: [
              { do: 'Go to the award site and click Sign in, top right.' },
              { do: 'Enter your email and password, then click Sign in.' },
              {
                do: 'You land on the Judge Dashboard, headed "Welcome to the …" with your name and a Judge badge under it.',
                note: 'If you land somewhere else, your account has not been given the judge role yet — tell the organiser.',
              },
            ],
          },
          {
            title: 'Find your way around',
            steps: [
              {
                do: 'The dashboard has a grid of buttons. The two that matter are View Judging Board and Update Judge Profile — both are highlighted in gold.',
              },
              {
                do: 'Below them are three counts: Applications Assigned, Applications Scored and Pending Review.',
                note: 'Pending Review is your to-do list. When it reaches zero you are finished.',
              },
            ],
          },
        ],
        gotchas: [
          'Use the email address the invitation was sent to. A second account made with a different address will have no applications in it.',
          'Each award site is separate. If you judge for more than one, sign in on the site you mean to work on.',
        ],
      },
      {
        slug: 'your-role',
        title: 'What you are being asked to do',
        where: 'Read this before you start scoring',
        purpose: 'Score the entries allocated to you, fairly and on the evidence in front of you.',
        tasks: [
          {
            title: 'The shape of the job',
            steps: [
              {
                do: 'The organiser allocates applications to you. You see only those.',
                note: 'Nothing appears until they do — an empty board says so in plain words rather than being broken.',
              },
              { do: 'You read each application and score it.' },
              {
                do: 'You can mark an applicant as Shortlist / First, Semi-finalist or Finalist as you go.',
              },
              {
                do: 'Scores from every judge are averaged. The organiser sets the shortlist from the result.',
              },
            ],
          },
        ],
        gotchas: [
          'Judge on what is written in the entry. If you know the applicant personally, tell the organiser — they can reallocate it.',
        ],
      },
    ],
  },

  /* ──────────────────────────────── Scoring ────────────────────────────── */
  {
    id: 'board',
    title: 'Your judging board',
    blurb: 'Where the applications allocated to you live, and how to score them.',
    modules: [
      {
        slug: 'my-board',
        title: 'My Board',
        where: 'Judge Dashboard → View Judging Board',
        purpose: 'Every application allocated to you, with the scoring panel inside each one.',
        tasks: [
          {
            title: 'Open an application',
            steps: [
              { do: 'Click View Judging Board on your dashboard.' },
              {
                do: 'The heading tells you how many applicants are allocated to you.',
              },
              {
                do: 'Click a row to expand it. The applicant’s entry and the scoring panel open underneath.',
                note: 'Rows you have already scored are marked, so you can see what is left at a glance.',
              },
            ],
          },
          {
            title: 'Read before you score',
            steps: [
              {
                do: 'Read the whole entry — the answers, and any documents or images attached.',
              },
              {
                do: 'Score against what the question asked, not against the other entries you have read today.',
              },
            ],
          },
        ],
        gotchas: [
          'The board shows only your allocation. Another judge’s list is different, and that is deliberate.',
        ],
      },
      {
        slug: 'scoring',
        title: 'Scoring an application',
        where: 'My Board → open an applicant',
        purpose: 'Record your mark, your reasoning, and how far you think the entry should go.',
        tasks: [
          {
            title: 'If you see one score for the whole entry',
            steps: [
              {
                do: 'Under "Overall Score (1–10)", click the number you are giving it.',
                note: 'A short label appears under your choice — Below expectations, Meets expectations, Exceeds expectations, or Outstanding.',
              },
              {
                do: 'Add anything the organiser should know in the Notes box.',
                note: 'Optional, but it is what an organiser reads when two judges disagree.',
              },
              {
                do: 'Tick Shortlist / First, Semi-finalist or Finalist if you think the entry belongs there.',
              },
              { do: 'Click Save.' },
            ],
          },
          {
            title: 'If you see a score per question',
            steps: [
              {
                do: 'Each question has its own row of numbers, 0 to 10. Click one on every question.',
                note: 'A running "Score so far" is shown as you go.',
              },
              {
                do: 'Add any Notes (optional).',
              },
              {
                do: 'Click Submit Scores. The button shows your running total.',
                note: 'It stays disabled until every question is scored — the line underneath says how many are left.',
              },
            ],
          },
          {
            title: 'Change a score you have already given',
            steps: [
              {
                do: 'Open the applicant again — your existing scores are still selected.',
              },
              { do: 'Click a different number, then save again.' },
            ],
          },
        ],
        gotchas: [
          'Per-question scoring will not submit until every question has a mark. If Submit Scores is greyed out, one is still blank.',
          'Zero is a real score on the per-question scale, and it is different from leaving the question unscored.',
          '"No application questions found for this event" means the organiser has not added them yet. Tell them rather than guessing a score.',
          'Save before you close the panel. A score chosen but not saved is not recorded.',
        ],
      },
    ],
  },

  /* ───────────────────────────── Your profile ──────────────────────────── */
  {
    id: 'profile',
    title: 'Your profile',
    blurb: 'What entrants and the organiser see about you.',
    modules: [
      {
        slug: 'judge-profile',
        title: 'My Profile',
        where: 'Judge Dashboard → Update Judge Profile',
        purpose: 'Your name, photograph and biography as they appear on the site’s judging panel page.',
        tasks: [
          {
            title: 'Keep it current',
            steps: [
              { do: 'Click Update Judge Profile on your dashboard.' },
              {
                do: 'Fill in your details and biography, and upload a photograph.',
                note: 'This is what appears publicly on the panel page, so write it the way you would want to be introduced.',
              },
              { do: 'Save.' },
            ],
          },
        ],
        gotchas: [
          'The organiser controls whether the panel page is published. A profile saved before then simply waits.',
        ],
      },
    ],
  },

  /* ──────────────────────────── Finishing up ───────────────────────────── */
  {
    id: 'finishing',
    title: 'Finishing up',
    blurb: 'Knowing you are done, and what happens after.',
    modules: [
      {
        slug: 'finishing-your-allocation',
        title: 'Finishing your allocation',
        where: 'Judge Dashboard',
        purpose: 'Confirms you have scored everything asked of you before the deadline.',
        tasks: [
          {
            title: 'Check you are finished',
            steps: [
              {
                do: 'Go back to your dashboard and read the three counts.',
              },
              {
                do: 'Pending Review at zero means every application allocated to you has been scored.',
              },
              {
                do: 'If Applications Assigned goes up later, the organiser has allocated you more.',
                note: 'They can add to your list at any point before judging closes.',
              },
            ],
          },
          {
            title: 'What happens to your scores',
            steps: [
              { do: 'Scores from every judge on a category are averaged.' },
              {
                do: 'The organiser uses that average, and your shortlist marks, to set the shortlist and finalists.',
              },
              { do: 'Winners are announced at the ceremony.' },
            ],
          },
        ],
        gotchas: [
          'Score before the organiser’s deadline. Once judging is closed the board stops accepting scores, finished or not.',
        ],
      },
    ],
  },
];
