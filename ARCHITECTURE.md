# The Awards Platform — Architecture & Functionality

A single reference for the whole awards estate: what it does, how the pieces fit,
which code serves which website, and what the database holds.

Written 4 August 2026. Every number below was read from the live database or the
repositories, not from memory — but they will drift, so re-check before relying
on a specific count.

**Who this is for**

- **Part 1–3** need no technical background. Read these to understand what the
  platform is and what each screen does.
- **Part 4–7** are for developers. Directory maps, the data model, environment
  variables, and the known gaps.

---

# Part 1 — What this is

The estate runs **multiple award programmes across multiple cities** from one
platform. A visitor sees a normal awards website: browse categories, submit a
free nomination, get judged, appear as a finalist, attend a ceremony. Behind
that, one codebase and one database serve every brand.

## The five-level hierarchy

```
The Power Business Awards            the central Super Admin platform
  └─ Location                        London, Cardiff, Mumbai …
      └─ Award Theme                 Best Business Awards, Working Women Awards …
          └─ Award Category          Business of the Year, Estate Agency of the Year …
              └─ Event / Cycle       the 2026 run, the 2027 run …
                  └─ Nomination      an entry into one or more categories
                      └─ Judging     independent scoring against published criteria
                          └─ Finalists → Winners
```

Read a full path as a sentence:

> **The Power Business Awards → London → Best Business Awards → Business of the
> Year → 2027 cycle**

**The important rule:** a theme can run in **many** locations, and a location can
host **many** themes. Theme, location, category and event are separate things and
must stay that way — collapsing any two of them is what makes "the same award in
two cities" impossible to express.

Today that many-to-many holds **5 themes across 7 locations**:

| Award Theme | Categories | Runs in |
| --- | --- | --- |
| Iconic Influencer Awards | 41 | London, Cardiff, South Wales, North Wales, Milton Keynes, Mumbai, Great Britain |
| Best Business Awards | 39 | all seven |
| The Legacy of Leadership Award | 35 | all seven |
| Working Women Awards | 22 | all seven |
| Property Excellence Awards | 6 | all except Great Britain |
| Hospitality Excellence Awards | 0 | not yet assigned |

---

# Part 2 — Which code serves which website

This is the part most likely to surprise you: **there is no single deployment.**
Four different patterns are live at once, and a website having a row in the
database does *not* mean the shared application serves it.

## Pattern A — the multi-tenant deployment (7 domains, 1 codebase)

One repository, one Vercel project, seven live domains:

| Domain | Site row |
| --- | --- |
| `londonbusinessaward.com` | 1 |
| `cardiffbusinessaward.com` | 2 |
| `thegreatbritishexcellenceawards.com` | 3 |
| `thepowerbusinessawards.com` | 4 — the Super Admin platform |
| `mumbaibusinessawards.com` | 8 |
| `bestbritishbusinessawards.com` | 10 |
| `hospitalityexcellenceawards.org` | 14 |

Every request resolves its brand from the hostname:

```
Host header
  → middleware.ts        strips "www." and ":port", sets x-site-domain
  → getSite()            SELECT * FROM sites
                         WHERE domain = $1 OR $1 = ANY(alt_domains)
  → app/layout.tsx       injects that site's 8 colour tokens onto <html>
  → data-site="<slug>"   rendered on <html>, useful for checking which brand
                         a page actually resolved to
```

Nothing in the application hardcodes a brand. Change a row in `sites` and the
name, colours, fonts, logo, contact details, venue and ceremony date all change
on the next request — no deploy.

`alt_domains` holds extra hostnames for the same brand (a retired subdomain, a
`*.vercel.app` staging host).

## Pattern B — a standalone repository

`propertyexcellenceawards.org` has **its own repository and its own Vercel
project**, but reads the **same database** as site row 15.

Its public pages come from that separate codebase, so changes to the shared
application do not affect it, and vice versa. It carries a different information
architecture (a twelve-item "The Gala & Pre-Launch" menu, and pages such as
`/speakers`, `/venue`, `/tickets`, `/shortlists`, `/winners` that the shared
codebase does not have).

## Pattern C — separate repositories, separate deployments

`southwalesawards.com` and `northwalesawards.com` are Next.js sites on Vercel
from their **own** repositories. They render no `data-site` marker, so they are
not tenants of Pattern A — yet they *do* have rows in the shared database
(sites 11 and 12).

## Pattern D — a legacy stack

`apps.mkbusinessawards.com` (site 9) serves no Vercel or Next.js fingerprints at
all. It is an older stack behind the same Cloudflare front, while still holding a
row in the shared database.

## What this means in practice

- **Data in one place, code in four.** A change to `sites`, `themes` or
  `award_categories` can affect a site whose pages you cannot find in this repo.
- Everything sits behind **Cloudflare**, then Vercel for patterns A–C.
- One database migration touches all twelve brands at once. Keep migrations
  additive (new nullable column, new table) and never destructive in one step.

---

# Part 3 — What the platform does

## The public website

| Page | Purpose |
| --- | --- |
| Home | Hero, countdown, category finder, why enter, journey, judging, FAQs, contact |
| Categories | The full taxonomy, grouped by theme, with a category explorer |
| Themes | The award themes available at this location |
| Find My Award | A short quiz that ranks the categories that fit you |
| Check Eligibility | Per-event eligibility questions before you invest time in an entry |
| Judges / The Jury | The panel, and an application route to join it |
| Partner / Sponsors | Sponsorship tiers and an enquiry form |
| Brochure | A slide-deck style show brochure |
| Nomination Guideline | What a strong entry contains and how it is scored |
| Contact | Enquiry form routed to the organiser mailbox |
| Privacy / Terms / Cookies | Policy pages |

The standalone Property Excellence site adds `/speakers`, `/venue`, `/tickets`,
`/faqs`, `/shortlists`, `/semifinalists`, `/finalists`, `/winners`,
`/about-event`, `/challenge` and `/view-application`.

## The entrant journey

1. **Nominate** — free, no account needed to start. Self-nominate or nominate
   someone else, across as many categories as apply.
2. **Confirm** — a nominee must confirm before their entry is judged.
3. **Apply** — the fuller application form collects the evidence judges score,
   including per-event custom questions.
4. **Track** — `/account` shows submitted nominations and lets an entrant edit
   them.

Entry is free throughout. An `entry_fee` column exists on both category tables and
is populated on every row — but every value is **0**, so nothing charges today.

## The portals

| Portal | Who | What it does |
| --- | --- | --- |
| `/account` | Entrants | Their nominations, profile, password |
| `/judge` | Judges | Assigned applicants, scoring against criteria, profile |
| `/organiser` | Organisers | The operational centre — see below |
| `/hub` | Super admins | Cross-site administration; create and configure sites |

The organiser panel is the largest surface: manage award-night applicants,
shortlists, semi-finalists, finalists and winners; allocate judges to categories
and read their scores; manage themes, categories and the question library; build
events and their agendas; assign ceremony roles; configure site settings,
branding and email; and run email campaigns.

## The email engine

Outbound mail is queued rather than sent inline, so a large campaign cannot block
a request or trip a provider rate limit.

- **Templates** (`email_templates`) hold the reusable bodies.
- **Flows** (`email_flows`, `email_flow_steps`, `email_flow_runs`) sequence
  multi-step journeys.
- **Jobs and recipients** (`email_jobs`, `email_recipients`) are the queue; a
  daily Vercel cron drains it, authorised by `CRON_SECRET`.
- **A send window** (`app_settings.send_window_*`) keeps delivery inside working
  hours, with batch sizes and gaps to pace the provider.
- **Tracking** (`email_events`) records opens and clicks; `email_suppressions`
  holds unsubscribes and bounces.
- **Provider** is chosen per site: SMTP, Resend or Mailgun. `site_email_settings`
  overrides the global `app_settings` defaults; when a site sets no From address,
  one is derived from its own name and address so a brand never sends under
  another brand's identity.

---

# Part 4 — The codebase

Both repositories are the same stack: **Next.js 15 App Router, React 19,
TypeScript (strict), Tailwind CSS, PostgreSQL via `pg`, migrations with
`node-pg-migrate`, `lucide-react` icons.** No ORM — SQL is written directly.

| | Shared platform | Property Excellence |
| --- | --- | --- |
| Public pages | 25 | 36 |
| Portal pages | 58 | 56 |
| API routes | 139 | 115 |
| Components | 105 | 109 |
| `lib/` modules | 41 | 38 |
| Migrations | 52 | 53 |

## Directory map

```
app/
  layout.tsx            per-request metadata, Event JSON-LD, colour tokens, chrome
  page.tsx              the homepage section order
  sitemap.ts robots.ts  per-brand, driven by the site row
  api/                  every server endpoint
  organiser/ hub/ judge/ account/   the four portals
components/
  sections/             homepage bands (Hero, Journey, Faq, AwardsNight …)
  organiser/ hub/ judge/            portal UI
  ui/                   Button, Icon, Reveal, Counter, Countdown, SectionHeading
lib/
  site.ts               getSite / getSiteId — brand resolution and defaults
  content.ts            copy, taxonomy, navigation, FAQs, journey
  themes.ts             which themes a site shows (owned + linked)
  db.ts                 the pg pool and query()
  auth.ts               sessions and role checks
  media.ts              images stored in Postgres, served from /api/media/[id]
  email/                config, render, send, flows, tracking, send window
migrations/             node-pg-migrate, run in filename order
scripts/                one-off and seeding scripts
middleware.ts           Host → x-site-domain
```

## Where to make a change

| Task | Where |
| --- | --- |
| Brand name, colours, dates, venue, contact | The `sites` row — no code change |
| Navigation, homepage copy, FAQs, taxonomy | `lib/content.ts` |
| Add a homepage band | `components/sections/`, then `app/page.tsx` |
| A colour token | `app/globals.css` `:root` **and** the `sites` row |
| Which themes a site lists | `lib/themes.ts` |
| A schema change | A new file in `migrations/` |

## The theming system

Colours are **RGB channel triplets** in CSS custom properties, not hex, so
Tailwind's alpha modifier works (`bg-gold/25`):

```css
--c-primary  --c-light  --c-deep  --c-50
--c-bg       --c-bg-slate  --c-bg-warm  --c-bg-darkest
```

`app/globals.css` holds the defaults; `app/layout.tsx` overwrites them per
request from the site row. A DB outage therefore falls back to the compiled
defaults rather than rendering unstyled — which is why those defaults must stay
in step with the row.

---

# Part 5 — The database

One PostgreSQL database (`DATABASE_URL`) shared by every brand, **42 tables**.
Almost everything is scoped by `site_id`.

## Sites — the tenant table

`sites` (12 rows, 47 columns) is the root of the current model: identity, domain
and `alt_domains`, event date/venue/city, contact details, the 8 colour tokens,
fonts, logo, design variant, analytics id, `is_active`.

Site 13 is retired (`is_active = false`) and replaced by site 15; both are named
Property Excellence Awards, which is worth knowing before querying by name.

## The hierarchy tables

These implement the Part 1 model. They are populated but **the application does
not read them yet** — pages still read the older flat, site-scoped columns. Treat
them as the migration target.

| Table | Rows | Holds |
| --- | --- | --- |
| `locations` | 7 | London, Cardiff, South Wales, North Wales, Milton Keynes, Mumbai, Great Britain |
| `award_themes` | 6 | The canonical themes, deduplicated |
| `theme_locations` | 34 | The many-to-many: which theme runs where |
| `theme_categories` | 143 | Categories owned by a theme, with criteria and eligibility |

`events` was reshaped into the **cycle** level: it gained `location_id`,
`award_theme_id` and `year`. Of 51 rows, 50 are the **2026** cycle; a new cycle is
one INSERT per (location, theme, year).

## Categories live in three places

This is the sharpest edge in the schema.

| Table | Rows | Read by |
| --- | --- | --- |
| `theme_categories` | 143 | The canonical set (new model, not yet read) |
| `event_categories` | 1,567 | The **public categories pages** |
| `award_categories` | 74 | The **organiser panel** only |

They are not joined to each other. Renaming a category in one does not rename it
in the others.

Categories key on **(theme, slug)**, never on name alone — "Mentor of the Year
Award" legitimately exists under two different themes, and keying on name merges
two distinct awards into one.

## Themes — old and new

`themes` (57 rows) is the older per-site table. A row belongs to one site and is
*linked* to others through `linked_site_ids integer[]`. `lib/themes.ts` resolves
"owned + linked", with an owned theme taking precedence over a linked one of the
exact same name, so linking never overrides what a location already has.

`award_themes` (6 rows) is the deduplicated canonical set. The 57-to-6 collapse
matters: promoting every distinct `themes.name` would invent themes out of one
programme's category *sections*. The tell is `themes.href` — a real theme links to
a theme website; a section links to a `/categories#anchor`.

## Entries, judging and results

| Table | Rows | Notes |
| --- | --- | --- |
| `nominations` | 31 | The entry. `award_categories` here is a **jsonb array of category names** — free text, not foreign keys |
| `applications` | 10 | The fuller evidence-bearing submission |
| `judges` | 3 | Panel members, with expertise and status |
| `judge_categories` | 2 | Which judge covers which category |
| `judge_scores` | 0 | Individual scores |
| `question_library` | 635 | Reusable questions |
| `category_question_links` | 541 | Questions attached to categories |
| `event_questions`, `event_library_question_links` | 1, 40 | Per-event questions |

Progress through the funnel is stored as booleans on the nomination:
`is_shortlisted`, `is_semifinalist`, `is_finalist`, `is_winner`, plus `avg_score`.

## Supporting tables

`users` (24), `media` (22 — images as bytes in Postgres, served from
`/api/media/[id]`), `ceremony_roles` (1,125), `products_services` (558),
`industries`, `leadership_types`, `event_items`, `pre_launch_registrations`,
`potential_users`, `prefill_tokens`, `app_settings`, `pgmigrations`, and the
eight `email_*` tables from Part 3.

## Accounts and roles

24 users: **11 visitor, 10 organiser (2 of them `hub_admin`), 3 judge**.

`users` has **no `site_id`**. Authorisation is role-only:

```ts
if (user.role !== 'organiser') redirect('/account');
```

So any organiser account can administer **every** brand, from any domain. See
Part 7.

---

# Part 6 — Running and deploying

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection |
| `DATABASE_SSL` | `"true"` to require TLS; the current host does not support it |
| `AUTH_SECRET` | Session signing |
| `CRON_SECRET` | Authorises the daily email-queue cron |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob, for hero **video** upload only |
| `DEV_SITE_DOMAIN` | Which brand `localhost` resolves to |
| `RESEND_*` / `MAILGUN_*` / `SMTP_*` | Provider fallbacks when a site sets none |

`vercel env pull` writes encrypted values as **empty strings**, so it cannot be
used to copy secrets between projects.

## Local development

```bash
npm install
npm run dev
npm run migrate
```

Set `DEV_SITE_DOMAIN` to the brand you want `localhost` to render. Without it,
requests fall back to the defaults compiled into `lib/site.ts`.

## Deploying

Both Vercel projects deploy on push to `master` via the git integration. A
production deploy assigns the project's domains automatically **provided the
domain is a project domain on that project** — a domain attached only as a
deployment alias does not move with new deploys.

Moving a domain between Vercel projects is a dashboard action. `vercel domains rm`
removes it from the whole team, and `vercel alias remove` drops the alias without
detaching the project domain — which takes the site down.

---

# Part 7 — Known gaps

Ordered by how much damage each can do.

**1. Organiser accounts are not scoped to a site.** `users` has no `site_id` and
the gate is role-only, so all ten organiser accounts can change categories,
nominations, email settings and branding for all twelve brands, from any domain.
Every multi-tenant domain also exposes `/organiser` and `/hub`. The fix is a
`user_sites (user_id, site_id, role)` join table plus a membership check
alongside the role check.

**2. One database behind four deployment patterns.** A migration or a data fix
reaches brands whose code is not in this repository. Keep changes additive.

**3. The hierarchy is built but unread.** `locations`, `award_themes`,
`theme_locations` and `theme_categories` are populated; the application still
reads the flat `site_id` columns. Until it switches, "one theme, two locations"
cannot share categories in the live product.

**4. Categories exist in three unjoined tables.** The public pages and the
organiser panel read different ones. Editing in one place does not propagate.

**5. Nominations are not cycle-scoped.** They carry `site_id` but no `event_id`,
and their categories are a **jsonb array of names**. So "winner of the 2027 London
cycle" cannot be expressed, re-running a cycle would overwrite last year's
winners, and renaming a category silently orphans historical entries. This is the
next phase of the hierarchy migration and it has not started.

**6. Judging is site-scoped too.** `judges.site_id` and
`judge_categories(site_id, category_id)` — no theme, no event.

---

## A short glossary

| Term | Meaning |
| --- | --- |
| **Site / tenant** | One row in `sites`; one brand, one domain |
| **Location** | A city or region that hosts award themes |
| **Award Theme** | A programme (Best Business Awards) that can run in many locations |
| **Award Category** | A single award within a theme |
| **Event / Cycle** | One year's run of a theme at a location |
| **Nomination** | An entry, self-submitted or submitted for someone else |
| **Application** | The fuller, evidence-bearing submission that judges score |
| **Hub** | The cross-site super-admin area |
