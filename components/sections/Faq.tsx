// Server component. The interactive accordion (FaqList) is the only
// stateful part; section chrome + the inline CTA card ship as static HTML.

import { buildFaqs } from '@/lib/content';
import { getSite } from '@/lib/site';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { PrimaryButton, GhostButton } from '../ui/Button';
import { FaqList } from './FaqList';

export async function Faq() {
  const site = await getSite();
  return (
    <section id="faqs" className="relative bg-ink py-24 lg:py-32">
      <div className="container-luxe section-pad">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="FAQs"
              title={
                <>
                  Questions, <span className="text-gold-gradient">Answered</span>
                </>
              }
              subtitle="Everything you need to know about eligibility, fees, judging or the ceremony. Our team is glad to help."
            />
            <Reveal delay={0.1} className="mt-8 hidden lg:block">
              <div className="rounded-2xl glass-gold p-6">
                <p className="font-display text-lg font-semibold text-white">Free to enter.</p>
                <p className="mt-2 text-sm text-white/60">
                  Enter as many categories as you like — there&apos;s nothing to lose and a stage to gain.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <PrimaryButton href="/contact" size="md">
                    Contact the team
                  </PrimaryButton>
                  <GhostButton href="/faqs" size="md">
                    Browse all FAQs
                  </GhostButton>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Accordion list — client island, hydrates separately */}
          <FaqList
            faqs={buildFaqs(
              site.event_city ?? '',
              site.venue_short ?? site.venue ?? '',
              site.event_date ?? '',
              site.event_deadline_label ?? '',
            )}
          />
        </div>
      </div>
    </section>
  );
}
