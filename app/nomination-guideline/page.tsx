import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Sparkles,
  Trophy,
  Users,
  Check,
} from 'lucide-react';
import { getSite } from '@/lib/site';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Nomination Guideline',
    description: `Everything you need to know before submitting a nomination to the ${site.name} — how nominations work, who can enter, what we look for, and the step-by-step process.`,
  };
}

// Top-of-page quick-jump anchors — mirror the order of the major sections so
// readers can land directly on the bit they care about (mobile especially).
const ANCHORS: { id: string; label: string }[] = [
  { id: 'what-is', label: 'What Is A Nomination' },
  { id: 'when-open', label: 'When Nominations Open' },
  { id: 'how-to-submit', label: 'How To Submit' },
  { id: 'who-can-nominate', label: 'Who Can Nominate' },
  { id: 'why-nominated', label: 'Why Get Nominated' },
  { id: 'requirements', label: 'Key Requirements' },
  { id: 'process', label: 'Our Process' },
];

// "Key requirements" panel — two columns, one set per heading. Adapted from
// the reference screenshot's purple "KEY REQUIREMENTS" block.
const REQUIREMENTS_LEFT = [
  'Entries are encouraged either directly from individuals or via third parties acting for the nominee.',
  'Institutions and individuals are welcome to submit nominations for consideration.',
  'Submissions should demonstrate the economic, social, cultural or other public benefits of the work — and how that work reflects the profile of the field in question.',
];

const REQUIREMENTS_QUALITIES = [
  'Evidence of outstanding results over a number of years.',
  'A pioneering approach: work that the nominee does above and beyond what is expected of any good operator in their field.',
];

const REQUIREMENTS_QUALITIES_DEMO = [
  'Demonstrable enthusiasm for the role and a willingness to inspire clients, teams and individuals through difficulty or change.',
  'Visible support of clients, communities and team members in tangible, substantial ways.',
  'Providing additional support and facilities to the people they serve.',
  'Offering consistent, constructive engagement and care for the wider community.',
];

// "Our Process" — numbered steps. Adapted from the reference 12-item list and
// rewritten for the BBA (a general business awards programme, not a sector-
// specific one — so all accountancy/ACCA references have been removed).
const PROCESS_STEPS: string[] = [
  'Making a nomination is very straightforward and is designed to be targeted, not time-consuming. Entries are encouraged either directly from the nominee, or from third parties — customers, peers, suppliers, employees, employers — acting on their behalf.',
  'Both individuals and organisations are welcome to submit nominations for any of the published award categories.',
  'You can request your customers, suppliers, team members, employees or other business contacts to nominate you — or you can submit a self-nomination.',
  'Identify the individual, team or business you want to recognise, and complete the entry form for the most relevant category. Each entry is submitted to the judging panel automatically once you click submit.',
  'Every category has a published set of criteria. Make sure your nomination addresses those criteria — strong entries directly evidence each one.',
  'Once we receive your nomination an automated confirmation email is sent. We may follow up by email or phone to verify details, ask for additional information, or simply to thank you for taking the time to nominate someone.',
  'The organisers reserve the right to move a nomination into an additional or more appropriate category where the judging panel considers it a better fit.',
  'In the unlikely event a category does not receive enough entries to form a credible shortlist, the organisers may, with the entrant’s agreement, merge it into the closest comparable category.',
  'If the nominee’s contact details, company name or representing person change at any point in the process, please contact the organisers immediately so we can keep the entry on track.',
  'The award categories are deliberately designed to be inclusive — open to sole traders, small independent businesses, scaling SMEs, and established mid-tier and large organisations across every sector trading in the region.',
  'Entries must relate to genuine work carried out by the nominee. Self-nominations and third-party nominations are equally welcome and judged on the same criteria.',
  'A person or business may be nominated in up to six categories. Please refer to each category’s eligibility criteria for any sector-specific details before entering.',
];

// "Road to Excellence" timeline — 5 milestones with date + label.
// We don't have firm internal dates, so we anchor only the public-facing ones
// (the gala) and leave the others as quarterly markers.
const ROAD_TO_EXCELLENCE = [
  { num: '01', date: 'Wed 03 Jun 2026', label: 'Pre-Launch Party' },
  { num: '02', date: 'Sat 06 Jun 2026', label: 'Launch Party' },
  { num: '03', date: 'Wed 10 Jun 2026', label: 'Shortlist Announcement' },
  { num: '04', date: 'Sat 06 Jun 2026', label: 'Open For Public Voting' },
  { num: '05', date: 'Thu 18 Jun 2026', label: 'Semi-Finalist Announcement' },
  { num: '06', date: 'Thu 25 Jun 2026', label: 'Finalist Announcement' },
];

export default async function NominationGuidelinePage() {
  const site = await getSite();
  return (
    <main id="main">
      <PageHero
        eyebrow="Award Nomination Guidelines"
        title={
          <>
            How nominations work at the{' '}
            <span className="text-gold-gradient">{site.name}</span>
          </>
        }
        subtitle="A clear, step-by-step guide to entering — what we look for, who can nominate, when nominations open, and how every entry is judged. Read this before you submit so your entry has the best possible chance."
      />

      {/* Sticky-style quick links — anchor jumps for long-form readers */}
      <section className="border-b border-white/5 bg-ink py-6">
        <div className="container-luxe section-pad">
          <RevealGroup
            className="flex flex-wrap items-center gap-2"
            stagger={0.03}
          >
            <RevealItem className="text-xs uppercase tracking-luxe text-white/40">
              Jump to:
            </RevealItem>
            {ANCHORS.map((a) => (
              <RevealItem key={a.id}>
                <a
                  href={`#${a.id}`}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.025] px-3.5 py-1.5 text-xs text-white/65 transition-colors hover:border-gold/40 hover:bg-gold/[0.08] hover:text-white"
                >
                  {a.label}
                </a>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------- Five narrative sections ---------- */}
      <section className="relative bg-ink py-16 lg:py-24">
        <div className="container-luxe section-pad">
          <div className="mx-auto max-w-4xl space-y-14">
            <NarrativeBlock
              id="what-is"
              eyebrow="01"
              icon={<Sparkles className="h-5 w-5 text-ink" />}
              heading="What is a nomination?"
            >
              <p>
                A nomination is a fantastic way of putting an individual, team or firm in the spotlight whose talent
                inspires achievements you genuinely admire. Showcasing excellence and recognising the work of others is
                a vital tool in the continuing battle to establish equality of opportunity across all parts of the
                business community — and to celebrate the public benefit of the recognition itself.
              </p>
              <p>
                Nominations are one of the ways to make sure the best, brightest and hardest-working people in our
                region see their names in lights. Whether you are an individual, a colleague, a customer or a client of
                a business, our nominations are not only by you, but on behalf of your peers, your team and the people
                who matter to you.
              </p>
            </NarrativeBlock>

            <NarrativeBlock
              id="when-open"
              eyebrow="02"
              icon={<ClipboardList className="h-5 w-5 text-ink" />}
              heading={`When are nominations open?`}
            >
              <p>
                Nominations for the {site.year} awards are open from <strong className="text-white">22 April 2026</strong>{' '}
                and run alongside the pre-launch of the event. They officially close on{' '}
                <strong className="text-white">{site.event_deadline_label}</strong> at midnight. All our award nominations are
                received and unofficially open six months prior to the award ceremony.
              </p>
            </NarrativeBlock>

            <NarrativeBlock
              id="how-to-submit"
              eyebrow="03"
              icon={<BadgeCheck className="h-5 w-5 text-ink" />}
              heading="How to submit a nomination"
            >
              <p>
                Making a nomination is very straightforward and is designed to be targeted, not time-consuming. You
                simply need to complete the online form for the relevant category — every entry is submitted directly
                to us once completed. Entries can only be accepted via the entry form. Fill out all the required
                information, then make sure you choose the correct category for the entry. Criteria for each award can
                be viewed on the categories page. Please note nominations can only be accepted per category, per
                individual: each category has a list of criteria that should be referred to in your nomination. You can
                select multiple categories in one nomination.
              </p>
            </NarrativeBlock>

            <NarrativeBlock
              id="who-can-nominate"
              eyebrow="04"
              icon={<Users className="h-5 w-5 text-ink" />}
              heading="Who can nominate?"
            >
              <p>
                Nominations can be made by the prospective nominees themselves, by a third party or by the event
                organisers. Peers, employers, clients, suppliers, customers and colleagues who have seen excellent work
                first-hand are encouraged to make nominations — this is how we make sure the fullest range of
                candidates is put forward. Business owners and leaders who meet the criteria for a category are equally
                welcome to enter directly. Entries are open to all individuals, teams and businesses from every
                industry sector operating within the region.
              </p>
            </NarrativeBlock>

            <NarrativeBlock
              id="why-nominated"
              eyebrow="05"
              icon={<Trophy className="h-5 w-5 text-ink" />}
              heading="Why get nominated?"
            >
              <p>
                Nominating someone for an award is a great way to pause and express gratitude towards your nominee. It
                gives you the same feeling as writing a recommendation or even just a thank-you note. There’s no better
                feeling for your nominee than walking up on stage and collecting the award.
              </p>
              <p>
                Nominations are the great way to put forward the name of the nominee for a chance of putting their
                company in the spotlight and ensuring that all their hard work, enthusiasm and diligence have been
                recognised — not only by you, your colleagues and clients but by the whole region. This is the perfect
                opportunity to show your nominee, who time and time again go beyond what you expected from them, how
                much you truly appreciate what they’re doing.
              </p>
              <p>
                {site.name} nominations are all about making a difference, and there&apos;s no reason why you
                can&apos;t get in on the fun! For someone who constantly exceeds expectations, it feels amazing to be
                recognised. Nominating someone for an award is a fantastic way of putting their company or them in the
                spotlight. Your nominee would love nothing more than to be given the chance to express what they&apos;re
                doing — and to tell them how much you find their work inspiring.
              </p>
              <p>
                You can request your customers, suppliers, team, employees or other business contacts to nominate you,
                or submit a self-nomination. The awards ceremony brings together hundreds of guests — finalists,
                judges, sponsors and business leaders from across every sector in the region. The day offers
                numerous networking opportunities and an outstanding occasion to recognise and reward the achievements
                that continue to be made across the local business community. {site.name} is an
                excellent opportunity to grow brand awareness, build credibility and celebrate the people behind the
                work.
              </p>
              <p className="font-display text-xl italic text-gold-gradient">
                So go, show them your love and nominate someone! We look forward to receiving your nomination.
              </p>
              <p className="text-white/55">Good luck!</p>
            </NarrativeBlock>
          </div>
        </div>
      </section>

      {/* ---------- KEY REQUIREMENTS panel ---------- */}
      <section
        id="requirements"
        className="relative overflow-hidden bg-slate950 py-20 lg:py-28"
      >
        <div className="pointer-events-none absolute -top-32 left-1/2 hidden h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[140px] sm:block" />
        <div className="container-luxe section-pad relative">
          <SectionHeading
            eyebrow="What we look for"
            title={
              <>
                Key <span className="text-gold-gradient">requirements</span>
              </>
            }
            subtitle="The qualities our judging panel weighs most heavily when reviewing each nomination."
          />

          <Reveal className="mt-12 rounded-3xl glass-gold p-7 sm:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Left column — narrative + the qualities we’re looking for */}
              <div>
                <ul className="space-y-3">
                  {REQUIREMENTS_LEFT.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-white/75">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-2xl border border-white/10 bg-ink/40 p-5">
                  <p className="text-xs uppercase tracking-luxe text-gold">
                    The qualities we look for in nominees:
                  </p>
                  <ul className="mt-4 space-y-3">
                    {REQUIREMENTS_QUALITIES.map((q) => (
                      <li key={q} className="flex items-start gap-3 text-white/75">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-gradient">
                          <Check className="h-3 w-3 text-ink" />
                        </span>
                        <span className="leading-relaxed">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right column — the demonstrable behaviours we score on */}
              <div>
                <ul className="space-y-4">
                  {REQUIREMENTS_QUALITIES_DEMO.map((q) => (
                    <li key={q} className="flex items-start gap-3 text-white/75">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-gradient">
                        <Check className="h-3.5 w-3.5 text-ink" />
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-8 text-sm italic text-white/60">
                  We look forward to receiving your nomination.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- OUR PROCESS — long numbered list ---------- */}
      <section id="process" className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Step by step"
            title={
              <>
                Our <span className="text-gold-gradient">process</span>
              </>
            }
            subtitle="From submission to ceremony, here is exactly how your entry moves through the awards."
          />

          <div className="mx-auto mt-12 max-w-4xl">
            <ol className="space-y-5">
              {PROCESS_STEPS.map((step, i) => (
                <li key={i}>
                  <Reveal>
                    <div className="rounded-2xl glass p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-gradient font-display text-lg font-semibold text-ink shadow-gold-sm">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-white/75 leading-relaxed">{step}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- SUBMIT A NOMINATION inline CTA ---------- */}
      <section className="relative overflow-hidden bg-slate950 py-16 lg:py-20">
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[28rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[140px] sm:block" />
        <div className="container-luxe section-pad relative">
          <Reveal className="mx-auto max-w-3xl rounded-3xl glass-gold p-10 text-center lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/40 px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-luxe text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              Free to enter · {site.year}
            </span>
            <h2 className="mt-6 font-display text-3xl sm:text-4xl font-semibold leading-tight text-white">
              Ready to submit a nomination?
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/65">
              Now that you have read the guidelines, head to the nomination form — it takes about five minutes per
              entry.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <PrimaryButton href="/register-interest">
                Nominate Now
                <ArrowRight className="ml-1 inline h-4 w-4" />
              </PrimaryButton>
              <GhostButton href="/categories">View All Categories</GhostButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Road to Excellence timeline ---------- */}
      <section className="relative bg-ink py-20 lg:py-24">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Key dates"
            title={
              <>
                The road to <span className="text-gold-gradient">excellence</span>
              </>
            }
            subtitle="Mark these dates — from pre-launch to finalists' night."
          />
          <RevealGroup
            className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            stagger={0.05}
          >
            {ROAD_TO_EXCELLENCE.map((r) => (
              <RevealItem key={r.num}>
                <div className="h-full rounded-2xl glass p-5 text-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient font-display text-lg font-semibold text-ink shadow-gold-sm">
                    {r.num}
                  </span>
                  <p className="mt-4 text-[0.7rem] uppercase tracking-luxe text-gold">{r.date}</p>
                  <p className="mt-1 text-sm font-medium leading-snug text-white">{r.label}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <p className="mt-10 text-center text-sm text-white/45">
            Final ceremony · {site.event_date_long} · {site.venue}
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-light"
            >
              Browse all award categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Your nomination could change someone's year"
        text="Free to enter, open to every business in the region. Submit a nomination today and put someone you admire in the spotlight."
      />
    </main>
  );
}

// Small section wrapper used for the five narrative blocks at the top.
// Uses an eyebrow number + an icon-in-circle to read like a long-form article.
function NarrativeBlock({
  id,
  eyebrow,
  icon,
  heading,
  children,
}: {
  id: string;
  eyebrow: string;
  icon: React.ReactNode;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <article id={id} className="scroll-mt-32">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
            {icon}
          </span>
          <span className="text-[0.7rem] font-semibold uppercase tracking-luxe text-gold">
            Section {eyebrow}
          </span>
        </div>
        <h2 className="mt-4 font-display text-2xl sm:text-3xl font-semibold leading-tight text-white text-balance">
          {heading}
        </h2>
        <div className="mt-5 space-y-4 text-white/70 leading-relaxed">{children}</div>
      </article>
    </Reveal>
  );
}
