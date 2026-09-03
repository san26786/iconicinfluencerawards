// The organiser's user guide, as data.
//
// Written for somebody who has never seen the panel: every step names the thing
// on screen exactly as it is labelled, in the order it is pressed. Where a step
// has a screenshot, `shot` is the file under /public/guide — a step without one
// still reads on its own, so the guide is never blocked on an image.
//
// It lives in the app rather than in a document because the guide belongs with
// the screens it describes: each organiser finds it in their own panel at
// /organiser/guide, already talking about their own site.
//
// Shorter than the platform build's version of this file, because this panel is
// smaller. Site Visitors, the Award Dashboard planner, Category Engine, Bounces
// and Do Not Contact are not screens here, so they are not in the guide — a
// manual that sends somebody hunting for a menu item that does not exist is
// worse than one that stops at what is on screen.

import type { GuideSection } from '@/lib/guide/types';

// Re-exported so anything already importing these from here keeps working; the
// definitions live in ./types, shared with the nominee and judge guides.
export type { Step, Module, GuideSection } from '@/lib/guide/types';

export const GUIDE: GuideSection[] = [
  /* ─────────────────────────── Getting started ─────────────────────────── */
  {
    id: 'start',
    title: 'Getting started',
    blurb: 'What the panel is, and how to find your way around it.',
    modules: [
      {
        slug: 'signing-in',
        title: 'Signing in and finding things',
        where: 'Top right of your public site → Sign in',
        purpose:
          'Everything an organiser does happens behind one login, on your own award site’s address.',
        tasks: [
          {
            title: 'Sign in',
            steps: [
              { do: 'Go to your award site and click Sign in, top right.' },
              { do: 'Enter your email and password, then click Sign in.' },
              {
                do: 'You land on the Nominations Dashboard.',
                note: 'One account works for every role. If you are an organiser, the organiser menu appears automatically.',
              },
            ],
          },
          {
            title: 'Move between screens',
            steps: [
              {
                do: 'Use the row of pills under the header — that is the organiser menu.',
                note: 'It wraps onto two or three rows. Everything in this guide is reached from there.',
                shot: 'organiser-menu.jpg',
              },
              {
                do: 'The pill you are on is highlighted in gold.',
              },
            ],
          },
        ],
        gotchas: [
          'Each award site is separate. Sign in on the site you want to work on — your contacts, templates and settings are that site’s own.',
        ],
      },
    ],
  },

  /* ──────────────────────────── Your audience ──────────────────────────── */
  {
    id: 'audience',
    title: 'Your audience',
    blurb: 'The people you will invite, and the lists you send to.',
    modules: [
      {
        slug: 'potential-participants',
        title: 'Potential Users',
        where: 'Organiser menu → Potential Users',
        purpose:
          'Your contact list: everyone you might invite to enter. Import them, filter them, and save the ones you want as a batch to email.',
        tasks: [
          {
            title: 'Import contacts from a spreadsheet',
            steps: [
              { do: 'Click Import at the top of the page.' },
              {
                do: 'Choose your CSV file.',
                note: 'Any columns you have are kept — extra columns become variables you can use in emails as {{columnName}}.',
              },
              { do: 'Match your columns to the fields shown, then confirm.' },
              {
                do: 'The contacts appear in the table below.',
                note: 'Re-importing the same file updates people rather than duplicating them.',
              },
            ],
          },
          {
            title: 'Find the people you want',
            steps: [
              { do: 'Type in the search box to match a name, email, company or job title.' },
              { do: 'Click Filters to narrow by position, category, phone quality and more.' },
              {
                do: 'Tick the checkbox on the rows you want, or use the header checkbox to take the whole page.',
              },
            ],
          },
          {
            title: 'Save a selection as a batch',
            steps: [
              { do: 'Select the people you want, or set the filters that describe them.' },
              { do: 'Click Create batch.' },
              {
                do: 'Give it a name you will recognise later, then save.',
                note: 'A batch is a frozen list. Sending to it later sends to exactly these people.',
              },
            ],
          },
        ],
        gotchas: [
          'A batch belongs to the site you created it on. Another award site cannot see it.',
          'Contacts on the Unsubscribe list are skipped automatically when a campaign is queued — you do not have to remove them by hand.',
        ],
      },
      {
        slug: 'batches',
        title: 'Batches — sending to a saved list',
        where: 'Potential Users → Batches panel, or Email Flows → Batches',
        purpose:
          'A batch is a saved audience. This is where a campaign actually starts.',
        tasks: [
          {
            title: 'Send a batch',
            steps: [
              { do: 'Find the batch and click Send.' },
              {
                do: 'Choose One email or Reminder flow.',
                note: 'One email sends a single template and stops. Reminder flow lets the flow run the whole sequence — its first step becomes the opening email and the rest follow on their own timing.',
              },
              { do: 'Pick the template (or the flow) from the dropdown.' },
              {
                do: 'Optional: tick Spread it over several rounds, and set how many people per round and how many hours between rounds.',
                note: 'Use this for large lists. 500 cold emails in one go is a deliverability problem; 100 a day is not.',
              },
              { do: 'Read the summary line, then click Queue the send.' },
              {
                do: 'The campaign appears in Send Queue.',
                note: 'Nothing is sent instantly — the queue releases it at the cadence you set.',
              },
            ],
          },
          {
            title: 'Send the same batch again',
            steps: [
              {
                do: 'When everyone in a batch has been scheduled, the button changes to Send again.',
              },
              { do: 'Click it and confirm.' },
              {
                do: 'The whole list becomes available again and the normal send dialog opens.',
                note: 'Rounds already sent are kept as history; numbering carries on from where it stopped.',
              },
            ],
          },
        ],
        gotchas: [
          'Reminder flow is greyed out unless Process automated reminder flows is switched on in Send Queue settings.',
          'Choosing a flow whose steps are aimed at a different batch means the steps will find nobody. Keep the flow’s batch the same as the one you are sending, or set it to Any.',
        ],
      },
    ],
  },

  /* ────────────────────────────── Email ────────────────────────────────── */
  {
    id: 'email',
    title: 'Email',
    blurb: 'Templates, automatic follow-ups, and the queue that sends them.',
    modules: [
      {
        slug: 'email-templates',
        title: 'Email Templates',
        where: 'Organiser menu → Email Templates',
        purpose: 'The emails you send. Write them once, use them in any campaign.',
        tasks: [
          {
            title: 'Create a template',
            steps: [
              { do: 'Click New template.', shot: 'email-templates.jpg' },
              {
                do: 'Optional: pick an existing template under Start from an existing template.',
                note: 'This copies its subject and body in for you to edit. The original is not touched.',
              },
              { do: 'Give it a Name (only you see this) and a Subject (the recipient sees this).' },
              {
                do: 'Write the email in the Design tab, or switch to Code for raw HTML.',
              },
              {
                do: 'Click a variable chip — First name, Site name, Nomination link — to drop it where your cursor was.',
                note: 'Variables are filled in per person when the email is sent.',
              },
              { do: 'Click Save.' },
            ],
          },
          {
            title: 'Check it before you send it',
            steps: [
              { do: 'Look at Live preview on the right — it fills the variables with a sample contact.' },
              { do: 'Under Send yourself a test, type your own email address and click Send test.' },
              {
                do: 'Open it in your inbox.',
                note: 'The test goes through this site’s own mailbox with your signature and the unsubscribe line, so it is exactly what a recipient gets.',
              },
            ],
          },
        ],
        gotchas: [
          'Templates marked Shared belong to every award site and cannot be edited here. Open one and press Make my own copy to get a version that belongs to your site.',
          'The test sends what is on screen, not the saved version. Save first if you want to test what is stored.',
          'Never paste a fixed link like https://yoursite.com/page into a shared template — use {{siteUrl}} so it is right on every site.',
        ],
      },
      {
        slug: 'email-signature',
        title: 'Email signature',
        where: 'Organiser menu → Send Queue → Email provider → Email signature',
        purpose: 'One sign-off, added to the bottom of every email this site sends.',
        tasks: [
          {
            title: 'Set your signature',
            steps: [
              { do: 'Open Send Queue and scroll to Email provider.', shot: 'email-signature.jpg' },
              { do: 'Click the Email signature (HTML) box to open it.' },
              {
                do: 'Click Starter template to drop in a ready-made signature, then change the name, phone and links.',
              },
              { do: 'Click Preview to see it on a light and a dark email side by side.' },
              { do: 'Click Save provider.' },
            ],
          },
        ],
        gotchas: [
          'The signature appears wherever a template has {{signature}} in it — normally where the sign-off used to be. A template without it gets the signature at the very bottom instead.',
          'Do not set a background colour or a fixed text colour in your signature. Letting it inherit means it looks right on both light and dark emails.',
        ],
      },
      {
        slug: 'email-flows',
        title: 'Email Flows',
        where: 'Organiser menu → Email Flows',
        purpose:
          'An automatic follow-up trail: send one email, then chase the people who opened it, without doing anything by hand.',
        tasks: [
          {
            title: 'Build a flow',
            steps: [
              { do: 'Click New flow.', shot: 'email-flows.jpg' },
              { do: 'Give it a name, and choose the Batch it chases (or leave it on Any).' },
              { do: 'Click Add step.' },
              {
                do: 'For each step choose the template, how long to wait, and who it goes to.',
                note: 'Wait time is counted from the first email, or from the previous step — you choose per step.',
              },
              {
                do: 'Switch each step on with its toggle.',
                note: 'New steps start switched off on purpose. A step that is off never sends.',
              },
              { do: 'Tick Flow available, then click Save flow.' },
            ],
          },
          {
            title: 'Run a flow',
            steps: [
              { do: 'Go to a batch and click Send.' },
              { do: 'Choose Reminder flow and pick your flow.' },
              {
                do: 'Check the step list shown underneath — it names each step, its template, its timing, and whether it is enabled.',
              },
              { do: 'Click Queue the send.' },
            ],
          },
        ],
        gotchas: [
          'Nothing runs unless Process automated reminder flows is ticked in Send Queue settings. That single switch stops every flow on the site.',
          'Steps have an audience condition — often Opened or clicked. If nobody opens the first email, no follow-up is sent, and that is correct behaviour rather than a fault.',
          'A flow only starts when a campaign is sent with it attached. Building a flow on its own sends nothing.',
        ],
      },
      {
        slug: 'send-queue',
        title: 'Send Queue',
        where: 'Organiser menu → Send Queue',
        purpose:
          'Every campaign that is sending, waiting or finished — and the mailbox settings behind them.',
        tasks: [
          {
            title: 'Watch a campaign',
            steps: [
              { do: 'Open Send Queue. Active shows anything still going out.' },
              { do: 'The bar shows sent, failed and total.' },
              {
                do: 'Click a campaign to see every recipient, who opened, who clicked and who failed.',
              },
            ],
          },
          {
            title: 'Pause or stop a campaign',
            steps: [
              { do: 'Click Pause on the campaign. It stops after the batch in flight.' },
              { do: 'Click Resume to start it again, or Archive to put it away.' },
            ],
          },
          {
            title: 'Set up sending',
            steps: [
              { do: 'Scroll to Email provider.' },
              { do: 'Choose SMTP, Resend or Mailgun and fill in the details.' },
              {
                do: 'For SMTP you can add several mailboxes — click Add sending account.',
                note: 'A large campaign is split evenly across them and sent in parallel, so it goes out faster and no single mailbox looks like it is spamming.',
              },
              {
                do: 'Set Reply-to address.',
                note: 'Replies land here whichever mailbox sent the email. Without it, replies scatter across several inboxes.',
              },
              { do: 'Click Save provider, then send yourself a test.' },
            ],
          },
        ],
        gotchas: [
          'A blank password field means "keep the saved one". To change a password you must type the new one — saving with the field empty changes nothing.',
          '"Invalid login: 535 Incorrect authentication data" means the mailbox password is wrong, not that the campaign is broken. Test the same password in webmail.',
          'Track opens and Track clicks apply to every award site, not just this one.',
        ],
      },
      {
        slug: 'unsubscribes',
        title: 'Unsubscribes',
        where: 'Organiser menu → Unsubscribes',
        purpose: 'The people you must not email again.',
        tasks: [
          {
            title: 'Check who is suppressed',
            steps: [
              { do: 'Open Unsubscribes to see every address that has opted out.' },
              {
                do: 'Nothing else is needed — the list is applied automatically when a campaign is queued.',
              },
            ],
          },
        ],
        gotchas: [
          'Every campaign email carries an unsubscribe link whether or not your template has one. Removing it is not possible, and it is what keeps your domain out of spam folders.',
        ],
      },
    ],
  },

  /* ─────────────────────────── The award itself ────────────────────────── */
  {
    id: 'awards',
    title: 'Running the award',
    blurb: 'Categories, entries, judges and the night itself.',
    modules: [
      {
        slug: 'site-settings',
        title: 'Site Settings',
        where: 'Organiser menu → Site Settings',
        purpose:
          'Your event details, contact information and branding — the things the public site shows.',
        tasks: [
          {
            title: 'Update your event',
            steps: [
              { do: 'Open Site Settings.', shot: 'site-settings.jpg' },
              { do: 'Change the event date, venue, city, deadline and contact details.' },
              { do: 'Upload a logo and hero image if you have them.' },
              { do: 'Save.' },
              { do: 'Open your public site in another tab to check it.' },
            ],
          },
        ],
        gotchas: [
          'These details feed your emails too: {{siteName}}, {{siteUrl}} and {{siteEmail}} come from here.',
        ],
      },
      {
        slug: 'themes-categories',
        title: 'Themes & Categories',
        where: 'Organiser menu → Themes, and → Manage Event',
        purpose: 'What people can enter for.',
        tasks: [
          {
            title: 'Manage themes',
            steps: [
              { do: 'Open Themes.', shot: 'themes.jpg' },
              { do: 'Add, edit or hide the themes shown on your public site.' },
            ],
          },
          {
            title: 'Manage categories',
            steps: [
              { do: 'Open Manage Event and click the event you are setting up.' },
              { do: 'Open its Categories tab.' },
              { do: 'Add or edit a category, its description and its judging criteria.' },
              {
                note: 'Categories belong to an event here, so an award running again next year gets its own set.',
                do: 'Repeat for every event that needs its own categories.',
              },
            ],
          },
        ],
      },
      {
        slug: 'nominations',
        title: 'Nominations Dashboard',
        where: 'Organiser menu → Nominations Dashboard',
        purpose: 'Everyone who has entered, and what stage they are at.',
        tasks: [
          {
            title: 'Review entries',
            steps: [
              { do: 'Open Nominations Dashboard.' },
              { do: 'Open an entry to read the answers and any files attached.' },
              { do: 'Move it forward — shortlist, semi-finalist, finalist, winner — as judging progresses.' },
            ],
          },
        ],
      },
      {
        slug: 'judges',
        title: 'Judges',
        where: 'Organiser menu → Manage Judges, and → Judging Panel',
        purpose: 'The people who score the entries.',
        tasks: [
          {
            title: 'Approve a judge',
            steps: [
              { do: 'Open Manage Judges to see everyone who has applied.' },
              { do: 'Open an application, read their background, then approve or decline.' },
              {
                do: 'An approved judge can sign in and see their own portal.',
              },
            ],
          },
          {
            title: 'Give judges their categories',
            steps: [
              { do: 'Open Judging Panel.' },
              { do: 'Assign each judge the categories they will score.' },
            ],
          },
        ],
      },
      {
        slug: 'award-night',
        title: 'Award Night',
        where: 'Organiser menu → Award Night',
        purpose: 'Everything for the ceremony itself, stage by stage.',
        tasks: [
          {
            title: 'Work through the stages',
            steps: [
              { do: 'Open Award Night. The sub-menu holds one screen per stage.', shot: 'award-night.jpg' },
              {
                do: 'Manage Applicants, Shortlists, Semi Finalists, Finalists and Winners each hold the entries at that stage.',
              },
              { do: 'Manage Categories and Manage Category Judges set up who judges what.' },
              { do: 'Allocate Applicants spreads entries across judges.' },
            ],
          },
          {
            title: 'Ceremony roles',
            steps: [
              { do: 'Open Ceremony Roles.' },
              { do: 'Assign the host, compère, sponsors and other roles for the night.' },
            ],
          },
        ],
      },
    ],
  },
];

/** Flat list of modules, for the sidebar and for search. */
export const GUIDE_MODULES = GUIDE.flatMap((s) => s.modules.map((m) => ({ ...m, section: s.title })));
