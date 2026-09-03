// The entrant's user guide, as data.
//
// Written for somebody who has been nominated, or has nominated themselves, and
// has never seen any of these screens. Every step names the thing on screen
// exactly as it is labelled, in the order it is pressed.
//
// It is deliberately honest about the two ways in. A nomination form and an
// application are different documents on this platform — the first says who you
// are, the second is the entry the judges read — and entrants who assume the
// first one finished the job are the single most common support question. The
// guide says so in the first section rather than burying it.
//
// Same shape and same renderer as the organiser and judge guides: see
// lib/guide/types.ts.

import type { GuideSection } from '@/lib/guide/types';

export const NOMINEE_GUIDE: GuideSection[] = [
  /* ─────────────────────────── Getting started ─────────────────────────── */
  {
    id: 'start',
    title: 'Getting started',
    blurb: 'What you have been asked to do, and the two things people mix up.',
    modules: [
      {
        slug: 'two-stages',
        title: 'Nomination and application are two different things',
        where: 'Read this before anything else',
        purpose:
          'Being nominated puts your name forward. The application is the entry the judges actually read. Both have to be finished.',
        tasks: [
          {
            title: 'Know which one you are on',
            steps: [
              {
                do: 'The nomination form asks who you are, which categories you want, and a short story. It is six steps and takes a few minutes.',
                note: 'This is what the link in a nomination email opens.',
              },
              {
                do: 'The application is the long one — eight steps, with your answers to the award questions, your logo and your supporting documents.',
                note: 'Judges score the application. A nomination on its own is not scored.',
              },
              {
                do: 'If you are not sure which you have done, sign in and open My Nominations. Anything listed there has been nominated; open it to see whether the application is finished.',
              },
            ],
          },
        ],
        gotchas: [
          'Finishing the nomination form does not finish your entry. If you stop there, the judges have nothing to score.',
          'Entering is free. Nobody on this platform will ask you to pay to be nominated or shortlisted.',
        ],
      },
      {
        slug: 'signing-in',
        title: 'Signing in',
        where: 'Top right of the award site → Sign in',
        purpose: 'One account holds your entries, your profile and everything you upload.',
        tasks: [
          {
            title: 'Sign in',
            steps: [
              { do: 'Go to the award site and click Sign in, top right.' },
              { do: 'Enter your email and password, then click Sign in.' },
              {
                do: 'You land on your dashboard, with a row of buttons — View My Nominations, Check My Eligibility, Update My Awards Profile and the rest.',
              },
            ],
          },
          {
            title: 'If you have forgotten your password',
            steps: [
              { do: 'On the sign-in page, use the password reset link and enter the email you were nominated with.' },
              {
                do: 'Follow the link in the email you receive and set a new password.',
                note: 'The link is for one use. Ask for another if it has expired.',
              },
              {
                do: 'Already signed in and just want to change it? Open Change Password from your account area.',
              },
            ],
          },
        ],
        gotchas: [
          'Use the same email address the nomination was sent to. A second account made with a different address will not have your entry in it.',
          'Each award site is separate. If you have entered more than one, sign in on the site you mean to work on.',
        ],
      },
    ],
  },

  /* ──────────────────────────── The nomination ─────────────────────────── */
  {
    id: 'nomination',
    title: 'The nomination form',
    blurb: 'Six steps that put a name forward — yours, or somebody else’s.',
    modules: [
      {
        slug: 'nomination-form',
        title: 'Completing your nomination',
        where: 'The link in your nomination email, or Start Your Free Entry',
        purpose: 'Tells the organiser who is being put forward, for which awards, and why.',
        tasks: [
          {
            title: 'Work through the six steps',
            steps: [
              {
                do: 'Step 1 · Nominee Details — the name, email and phone of the person or business being nominated.',
                note: 'If a link was emailed to you, much of this is filled in already. Correct anything that is wrong rather than leaving it.',
              },
              {
                do: 'Step 2 · About Nominee Business — the organisation, what it does and where it is based.',
              },
              {
                do: 'Step 3 · Your Awards — tick every category you want to be considered for.',
                note: 'You can pick more than one. The application questions you are asked later follow these choices, so choose before you move on.',
              },
              {
                do: 'Step 4 · Your Story — the short piece about why this nomination deserves to win.',
              },
              {
                do: 'Step 5 · Nominator Details — who is submitting it.',
                note: 'Nominating yourself? Tick the self-nomination box and this step disappears — your own details are used.',
              },
              {
                do: 'Step 6 · Confirm — check the summary, agree to the terms, and submit.',
              },
            ],
          },
          {
            title: 'Nominate anonymously',
            steps: [
              {
                do: 'On the nominator step, choose "Yes — keep me anonymous" if you do not want the nominee to know who put them forward.',
                note: 'The organiser still holds your details; the nominee is not shown them.',
              },
            ],
          },
        ],
        gotchas: [
          'The categories you tick decide which questions you are asked on the application. Adding a category later means new questions to answer.',
          'Nominating somebody else? Use an email address they actually read — every message about the entry goes there.',
        ],
      },
    ],
  },

  /* ──────────────────────────── The application ────────────────────────── */
  {
    id: 'application',
    title: 'The application',
    blurb: 'Eight steps. This is the document the judges score.',
    modules: [
      {
        slug: 'application-steps',
        title: 'Filling in your application',
        where: 'Your dashboard → your entry, or the apply link you were sent',
        purpose: 'Everything the judges see about you: your answers, your evidence, your images.',
        tasks: [
          {
            title: 'Work through the steps',
            steps: [
              {
                do: 'Profile — your name, date of birth, contact details, job title, organisation and the award categories you are entering.',
                note: 'The category list here is the same one from the nomination form. Changing it changes your questions on the Response step.',
              },
              {
                do: 'Eligibility — a set of multiple-choice questions confirming you qualify. Every one has to be answered before you can move on.',
              },
              {
                do: 'Response — the award questions themselves, grouped under each category you entered. Type your answer in the box under each question.',
                note: 'Use "View all questions" to see them stacked, or "One at a time" to work through them singly. The counter at the top shows how many you have done.',
              },
              { do: 'Logo — your primary logo, and an alternative version if you have one.' },
              { do: 'Documents — any supporting files that back up what you have said.' },
              {
                do: 'AV Images — four photographs: a headshot, your workplace, your product or service, and an event or achievement.',
                note: 'These are what appear on screen at the ceremony, so use the best you have.',
              },
              {
                do: 'View Trophy — check the name exactly as it should be engraved.',
                note: 'Spelling here is the spelling on the trophy. Read it twice.',
              },
              { do: 'Preview — read the whole entry back, then submit.' },
            ],
          },
          {
            title: 'Stop and come back later',
            steps: [
              {
                do: 'Click Save & Continue Later at any point.',
                note: 'Your answers are kept. Sign back in and open the entry to carry on where you left off.',
              },
              {
                do: 'Save & Next saves the step you are on and moves you forward.',
                note: 'If it will not move, a message in red says which field is missing.',
              },
            ],
          },
        ],
        gotchas: [
          'Long answers are worth writing somewhere else first and pasting in. A browser tab that closes unexpectedly takes anything unsaved with it.',
          'The Response questions follow your categories. Add a category and you will have more questions waiting; remove one and its answers stop being asked for.',
          'Answer the eligibility questions honestly. An entry that does not qualify is withdrawn later, after the work of writing it.',
        ],
      },
      {
        slug: 'eligibility-check',
        title: 'Check My Eligibility',
        where: 'Your dashboard → Check My Eligibility',
        purpose: 'Confirms you qualify before you spend an evening writing an entry.',
        tasks: [
          {
            title: 'Run the check',
            steps: [
              { do: 'Open Check My Eligibility from your dashboard.' },
              { do: 'Answer the questions and submit.' },
              {
                do: 'Complete your profile first — the check reads it.',
                note: 'It is the same set of questions as the Eligibility step of the application.',
              },
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────────── Your account ──────────────────────────── */
  {
    id: 'account',
    title: 'Your account',
    blurb: 'Where your entries live, and how to change them.',
    modules: [
      {
        slug: 'my-nominations',
        title: 'My Nominations',
        where: 'Your dashboard → View My Nominations',
        purpose: 'Every entry in your name on this site, with a way into each one.',
        tasks: [
          {
            title: 'Open or edit an entry',
            steps: [
              { do: 'Click View My Nominations on your dashboard.' },
              { do: 'Each row is one entry. Open it to read what was submitted.' },
              {
                do: 'Use Edit to change an answer.',
                note: 'Editing closes once the organiser locks entries for judging. If the button has gone, that is why.',
              },
            ],
          },
        ],
        gotchas: [
          'Nothing here means you are shortlisted. The organiser announces that separately.',
        ],
      },
      {
        slug: 'awards-profile',
        title: 'Your awards profile',
        where: 'Your dashboard → Update My Awards Profile',
        purpose: 'The details reused across your entries, so you type them once.',
        tasks: [
          {
            title: 'Keep it current',
            steps: [
              { do: 'Open Update My Awards Profile.' },
              { do: 'Correct anything out of date — job title, organisation, phone number, links.' },
              { do: 'Save.' },
            ],
          },
        ],
        gotchas: [
          'Changing your email here changes where every message about your entry goes, including the shortlist announcement.',
        ],
      },
    ],
  },

  /* ──────────────────────────── After you enter ────────────────────────── */
  {
    id: 'after',
    title: 'After you enter',
    blurb: 'What happens to your entry, and what to expect.',
    modules: [
      {
        slug: 'judging',
        title: 'Judging and results',
        where: 'By email, to the address on your account',
        purpose: 'What the panel does with your entry once entries close.',
        tasks: [
          {
            title: 'What happens next',
            steps: [
              {
                do: 'Entries close, and the organiser allocates them to the judging panel.',
                note: 'Judges score against the same questions you answered.',
              },
              {
                do: 'Shortlist, semi-finalists and finalists are announced by the organiser.',
                note: 'Every announcement goes to the email address on your account — keep it current.',
              },
              { do: 'Winners are announced at the ceremony.' },
            ],
          },
          {
            title: 'If you stop hearing from us',
            steps: [
              {
                do: 'Check your spam or junk folder first, and mark the message as safe.',
              },
              {
                do: 'If you unsubscribed from an earlier email, you will not receive the later ones either.',
                note: 'Tell the organiser and they can put you back on.',
              },
            ],
          },
        ],
        gotchas: [
          'Nobody from the awards will ask you for payment to be shortlisted or to win. Treat any such message as a scam and tell the organiser.',
        ],
      },
    ],
  },
];
