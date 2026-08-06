import type { Metadata } from 'next';
import { getSite } from '@/lib/site';
import { buildFaqs, IMAGES, SCORING_FRAMEWORK } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { FaqList } from '@/components/sections/FaqList';
import { PageCloser } from '@/components/sections/PageCloser';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Award FAQ',
    description: `Answers on eligibility, entry fees, judging, key dates and the ceremony for the ${site.name} ${site.year}.`,
  };
}

// Questions specific to the ceremony and to what winners receive. These sit
// alongside the shared entry FAQs used on the homepage rather than duplicating
// them — buildFaqs() owns anything that names the venue, region or dates.
const EXTRA_FAQS = [
  {
    q: 'Do I have to attend the ceremony to win?',
    a: 'No. Attendance is entirely optional and has no bearing on judging. Winners who cannot attend are notified directly and receive their trophy and winner pack by post.',
  },
  {
    q: 'Can I enter on behalf of someone else?',
    a: 'Yes. Third-party nominations are welcome — clients, colleagues, suppliers or industry peers can all nominate. We contact the nominee to confirm they want to proceed before anything is judged.',
  },
  {
    q: 'What evidence should I include?',
    a: 'Specifics beat adjectives. Numbers, dates, named outcomes and short client quotes all score well; general claims about being passionate or market-leading do not. Judges score what they can verify.',
  },
  {
    q: 'Is there a word limit?',
    a: 'Each written answer is capped at around 400 words. Judges read a lot of entries — a tight, evidenced answer consistently outperforms a long one.',
  },
  {
    q: 'Who sits on the judging panel?',
    a: 'Independent practitioners and specialists from across the property industry, matched to the categories they know. Judges declare conflicts of interest and are recused from scoring anyone they are connected to.',
  },
  {
    q: 'Can I see my scores or feedback?',
    a: 'Aggregate feedback is available to entrants on request after the ceremony. Individual judge scores stay confidential to protect the independence of the panel.',
  },
  {
    q: 'What happens if a category has very few entries?',
    a: 'A category needs a viable field to be judged fairly. If entries are too few, we contact those affected and offer to move the entry to the closest matching category at no cost.',
  },
  {
    q: 'How can my business sponsor the awards?',
    a: 'Sponsorship is handled separately from judging and gives no advantage in the process. The sponsors page has the packages and an enquiry form.',
  },
];

export default async function FaqsPage() {
  const site = await getSite();

  const faqs = [
    ...buildFaqs(
      site.event_city ?? '',
      site.venue_short ?? site.venue ?? '',
      site.event_date ?? '',
      site.event_deadline_label ?? '',
    ),
    ...EXTRA_FAQS,
  ];

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            Questions, <span className="text-gold-gradient">answered</span>
          </>
        }
        subtitle="Everything you need to know about eligibility, fees, judging or the ceremony. If your question is not here, the team is glad to help."
        image={IMAGES.meeting}
      />

      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Award FAQ"
                title={
                  <>
                    The <span className="text-gold-gradient">essentials</span>
                  </>
                }
                subtitle="Entering is simpler than most people expect — free, online, and about ten minutes per category."
              />

              <Reveal delay={0.1} className="mt-8">
                <div className="rounded-2xl glass-gold p-6">
                  <p className="font-display text-lg font-semibold text-white">
                    How entries are scored
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {SCORING_FRAMEWORK.map((c) => (
                      <li key={c.label} className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-white/70">{c.label}</span>
                        <span className="text-sm font-semibold text-gold tabular-nums">
                          {c.weight}%
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-white/45">
                    Indicative weighting — each category publishes its own criteria.
                  </p>
                </div>
              </Reveal>
            </div>

            <FaqList faqs={faqs} />
          </div>
        </div>
      </section>

      <CtaBand
        title="Still have a question?"
        text="Ask the team directly — we answer every enquiry within one working day, and no question about entering is too basic."
      />
      <PageCloser />
    </main>
  );
}
