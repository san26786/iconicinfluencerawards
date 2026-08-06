import type { Metadata } from 'next';
import { Mic, Users, TrendingUp, Sparkles } from 'lucide-react';
import { getSite } from '@/lib/site';
import { IMAGES } from '@/lib/content';
import { PageHero } from '@/components/PageHero';
import { ContactForm } from '@/components/ContactForm';
import { PageCloser } from '@/components/sections/PageCloser';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Speakers',
    description: `Speak at the ${site.name}. Share your experience with a room of agencies, developers, investors and property professionals.`,
  };
}

const WHY_SPEAK = [
  {
    icon: Users,
    title: 'A room worth speaking to',
    body: 'Founders, directors and decision-makers from across the property industry — not a general business audience.',
  },
  {
    icon: TrendingUp,
    title: 'Scale your impact',
    body: 'Your session is filmed and shared through our channels, so the audience does not end when the day does.',
  },
  {
    icon: Sparkles,
    title: 'Authority, not advertising',
    body: 'Speaking slots go to people with something to say. Pitch decks stay in the bag; insight is what gets booked.',
  },
];

const LOOKING_FOR = [
  'Practitioners with a story the room has not heard before',
  'Data or research that changes how people work',
  'Hard-won lessons from a scheme, a scale-up or a downturn',
  'Perspectives currently under-represented on property stages',
];

export default async function SpeakersPage() {
  const site = await getSite();

  return (
    <main id="main">
      <PageHero
        eyebrow="Speakers"
        title={
          <>
            Be the next <span className="text-gold-gradient">property speaker</span>
          </>
        }
        subtitle={`The ${site.name} stage is for people with something useful to say about where this industry is going. If that is you, we would like to hear from you.`}
        image={IMAGES.stageSpeaker}
      />

      {/* Why speak */}
      <section className="relative bg-ink py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <SectionHeading
            eyebrow="Why speak"
            title={
              <>
                Scale your <span className="text-gold-gradient">impact</span>
              </>
            }
            subtitle="A speaking slot at the ceremony puts you in front of the people who decide where money, instructions and talent go next."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-3" stagger={0.08}>
            {WHY_SPEAK.map((w) => (
              <RevealItem key={w.title}>
                <div className="h-full rounded-2xl glass p-7 transition-colors duration-300 hover:border-gold/30">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                    <w.icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{w.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Become a speaker */}
      <section id="become-a-speaker" className="relative bg-slate950 py-20 lg:py-28">
        <div className="container-luxe section-pad">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start">
            <Reveal>
              <span className="eyebrow mb-4">
                <span className="h-px w-6 bg-gold/60" />
                Become a Speaker
              </span>
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">
                Tell us what you would <span className="text-gold-gradient">talk about</span>
              </h2>
              <p className="mt-5 leading-relaxed text-white/60">
                Send a short outline of your topic and why it matters to a property audience.
                Choose <strong className="text-white/85">Press &amp; media</strong> or{' '}
                <strong className="text-white/85">General enquiry</strong> and mention
                &ldquo;speaker&rdquo; in your message — it reaches the programme team either way.
              </p>

              <ul className="mt-8 space-y-3">
                {LOOKING_FOR.map((l) => (
                  <li key={l} className="flex items-start gap-3">
                    <Mic className="mt-1 h-4 w-4 flex-shrink-0 text-gold" />
                    <span className="text-sm leading-relaxed text-white/70">{l}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="rounded-3xl glass p-6 sm:p-8">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <PageCloser />
    </main>
  );
}
