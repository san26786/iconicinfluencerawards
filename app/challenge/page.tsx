import type { Metadata } from 'next';
import { Check, FileText, Flame, Megaphone, Trophy, Users } from 'lucide-react';
import { getSite, getSiteId } from '@/lib/site';
import { IMAGES } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { PreLaunchForm } from '@/components/PreLaunchForm';
import { FaqList } from '@/components/sections/FaqList';
import { PageCloser } from '@/components/sections/PageCloser';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Join The Challenge',
    description: `The seven-day entry challenge for the ${site.name} — a daily prompt that turns a blank entry form into a submitted, evidenced entry.`,
  };
}

const PACK = [
  { icon: FileText, title: 'The entry workbook', body: 'One page per scoring criterion, with the prompts judges are actually looking for.' },
  { icon: Trophy, title: 'Worked examples', body: 'Strong and weak answers side by side, so you can see the difference rather than guess at it.' },
  { icon: Megaphone, title: 'A share kit', body: 'Ready-made posts and graphics for announcing your entry, shortlisting and result.' },
  { icon: Users, title: 'Evidence checklist', body: 'The numbers, quotes and documents worth gathering before you start writing.' },
];

const WHY_JOIN = [
  'Most entries fail on evidence, not on merit — the pack fixes that first.',
  'Seven short prompts beat one long evening staring at a blank form.',
  'You finish with an entry you can reuse across several categories.',
  'It is free, and you keep the workbook whether you enter or not.',
];

const DAYS = [
  { day: 'Day 1', title: 'Pick your categories', body: 'Match what you actually did to the awards that reward it.' },
  { day: 'Day 2', title: 'Gather the numbers', body: 'Revenue, volumes, retention, timelines — whatever your category scores.' },
  { day: 'Day 3', title: 'Find the story', body: 'The one instruction, scheme or decision that shows what you are like at your best.' },
  { day: 'Day 4', title: 'Collect the proof', body: 'Client quotes, data, coverage, before-and-afters.' },
  { day: 'Day 5', title: 'Write the first draft', body: 'Answer the criteria in order. Do not polish yet.' },
  { day: 'Day 6', title: 'Cut it down', body: 'Half the words, twice the evidence. This is the day that wins entries.' },
  { day: 'Day 7', title: 'Submit', body: 'Upload, check, send. Then start the second category — it takes a fraction of the time.' },
];

const CHALLENGE_FAQS = [
  {
    q: 'Does joining the challenge cost anything?',
    a: 'No. The challenge and the workbook are free, exactly like entering the awards themselves. There is nothing to buy at any point.',
  },
  {
    q: 'Do I have to enter the awards to join?',
    a: 'No. Plenty of people use the workbook to sharpen how they write about their work and enter a later year. You keep the pack either way.',
  },
  {
    q: 'How much time does each day take?',
    a: 'Around twenty minutes. Day 4 and Day 5 take longer if you are gathering evidence from scratch, so plan a little more time for those.',
  },
  {
    q: 'Does taking part improve my chance of winning?',
    a: 'It improves your entry, not your odds with the judges. Judges never see whether you took part — but a well-evidenced entry scores better than a vague one, and that is what the challenge is for.',
  },
  {
    q: 'What if I miss a day?',
    a: 'Nothing happens. The prompts arrive by email and stay in your inbox — work through them at whatever pace suits.',
  },
];

export default async function ChallengePage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);

  return (
    <main id="main">
      <PageHero
        eyebrow="The Gala & Pre-Launch"
        title={
          <>
            The challenge is on — rally the evidence,{' '}
            <span className="text-gold-gradient">own the stage</span>
          </>
        }
        subtitle="Seven days, seven short prompts, one finished entry. A free workbook that turns the blank form into something a judge can score."
        image={IMAGES.collaborate}
      />

      {/* What's inside the pack */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="The Pack"
            title={
              <>
                What&apos;s inside the <span className="text-gold-gradient">pack?</span>
              </>
            }
            subtitle="Everything you need to write an entry that stands up to scoring — and nothing you don't."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2" stagger={0.07}>
            {PACK.map((p) => (
              <RevealItem key={p.title}>
                <div className="h-full rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <p.icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Why join */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <span className="eyebrow mb-4">
                <span className="h-px w-6 bg-gold/60" />
                Why join this challenge?
              </span>
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">
                Good work loses to{' '}
                <span className="text-gold-gradient">badly written entries</span> every year
              </h2>
              <ul className="mt-8 space-y-3">
                {WHY_JOIN.map((w) => (
                  <li key={w} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-gradient">
                      <Check className="h-3 w-3 text-ink" />
                    </span>
                    <span className="text-sm leading-relaxed text-white/70">{w}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* How it works — the sign-up itself */}
            <Reveal delay={0.12}>
              <div className="rounded-3xl glass p-7 sm:p-8">
                <div className="flex items-center gap-3">
                  <Flame className="h-5 w-5 text-gold" />
                  <h3 className="font-display text-xl font-semibold text-white">How it works</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Join the list below. The workbook arrives immediately, then one prompt a day for
                  seven days. Unsubscribe whenever you like — the pack is yours to keep.
                </p>
                <div className="mt-6">
                  <PreLaunchForm siteName={site.name} siteId={siteId} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The seven days */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="The Curriculum"
            title={
              <>
                What you&apos;ll do in <span className="text-gold-gradient">seven days</span>
              </>
            }
            subtitle="About twenty minutes a day. By the end of the week you have a submitted entry, not a good intention."
          />
          <div className="mx-auto mt-14 max-w-3xl">
            <RevealGroup className="space-y-3" stagger={0.05}>
              {DAYS.map((d) => (
                <RevealItem key={d.day}>
                  <div className="flex flex-col gap-2 rounded-2xl glass p-5 sm:flex-row sm:items-baseline sm:gap-6">
                    <span className="w-20 flex-shrink-0 text-xs font-bold uppercase tracking-luxe text-gold">
                      {d.day}
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{d.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/55">
                        {d.body}
                      </span>
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Challenge FAQs */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <SectionHeading
              align="left"
              eyebrow="FAQs"
              title={
                <>
                  Frequently asked <span className="text-gold-gradient">questions</span>
                </>
              }
              subtitle="About the challenge specifically — the full award FAQ covers eligibility, judging and the ceremony."
            />
            <FaqList faqs={CHALLENGE_FAQS} />
          </div>
        </div>
      </section>

      <PageCloser />
    </main>
  );
}
