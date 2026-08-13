# Iconic Influencer Awards

The awards platform for **Iconic Influencer Awards**.

Forked from the Property Excellence Awards multi-tenant codebase (itself forked from the
London Business Awards codebase). Shares the same Postgres instance as the other tenants —
see `DEV_SITE_DOMAIN` below.

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 3** — brand tokens are CSS custom properties, not hardcoded colours
- **PostgreSQL** via `pg`, migrations with `node-pg-migrate`
- **lucide-react** iconography, `next/font` (Playfair Display + Inter), `next/image`

## Brand tokens

Colours live as RGB channel triplets in CSS custom properties so Tailwind can apply its
alpha modifier (`bg-gold/25`). Defaults are in `app/globals.css`; the live values are read
per-request from the `sites` DB row and injected on `<html>` by `app/layout.tsx`.

| Token | Hex | Role |
| --- | --- | --- |
| `--c-primary` | `#FFAD24` | Amber — CTAs, accents |
| `--c-light` | `#F4E3A1` | Pale gold — highlights |
| `--c-deep` | `#A8842A` | Deep gold — gradient anchor |
| `--c-50` | `#F9F8F4` | Cream — light bands |
| `--c-bg` | `#0E1424` | Navy — page background |
| `--c-bg-slate` | `#0A0F1C` | Deep navy — alternate band |
| `--c-bg-warm` | `#141326` | Warm navy — radial gradient |
| `--c-bg-darkest` | `#060A14` | Deepest navy |

## Homepage sections

1. Hero — "Recognising Iconic Influence", event strip, three CTAs, stat tiles
2. Countdown + headline stats
3. Find My Award — three-question category recommender
4. Why Enter — benefits plus sample category cards
5. Explore the Categories
6. Your Awards Journey — six steps from entry to ovation
7. The Judging Process — four pillars plus the 100-point scoring framework
8. The Inaugural Edition
9. The Awards Ceremony
10. FAQs
11. Contact
12. Final CTA
13. Be Social
14. Newsletter

## Pages

Public: `/speakers`, `/categories`, `/judges`, `/venue`, `/sponsors`,
`/nomination-guideline`, `/view-application`, `/tickets`, `/faqs`, `/shortlists`,
`/semifinalists`, `/finalists`, `/winners`, `/about-event`, `/challenge`, `/about`,
`/contact`, `/find-my-award`, `/check-eligibility`, `/themes`, `/brochure`, `/partner`,
`/for-organisers`, `/privacy`, `/terms`, `/cookies`.

Portals: `/account` (entrants), `/judge` (judging panel), `/organiser` (award-night
management, email flows, categories, events), `/hub` (multi-site admin).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3200
npm run build
npm start
```

`DEV_SITE_DOMAIN` in `.env.local` decides which `sites` row `localhost` resolves to — see
`getSite()` in `lib/site.ts`. Without it, requests fall back to the Iconic Influencer
Awards defaults baked into that file.

## Database

Migrations run against `DATABASE_URL`:

```bash
npm run migrate
```

This deployment shares its Postgres with the other awards tenants; every table is scoped by
`site_id` and resolved from the request's `Host` header by `middleware.ts` → `getSite()`.
