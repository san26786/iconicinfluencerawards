import Link from 'next/link';
import { ArrowRight, Scale, Star, Users, Trophy, Medal, BadgeCheck } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

const PERKS = [
  { icon: Scale,      label: 'Shape who wins',         desc: 'Your expertise drives fair, meaningful outcomes.' },
  { icon: Users,      label: 'Elite networking',        desc: 'Connect with founders, CEOs, and industry leaders.' },
  { icon: Trophy,     label: 'VIP ceremony seat',       desc: 'Attend the ceremony as a distinguished guest.' },
  { icon: Medal,      label: 'Official judge title',    desc: 'Recognised on our website, socials, and press.' },
  { icon: BadgeCheck, label: 'Certificate of honour',   desc: 'A framed digital certificate for your profile.' },
  { icon: Star,       label: 'Media exposure',          desc: 'Featured in our award season coverage.' },
];

export function JudgesSection() {
  return (
    <section id="judges" className="relative overflow-hidden bg-ink py-20 lg:py-28">
      {/* Glows */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-[30rem] w-[30rem] rounded-full bg-gold/10 blur-[150px] hidden sm:block" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-[22rem] w-[22rem] rounded-full bg-gold/8 blur-[120px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left — pitch */}
          <Reveal>
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-gold/60" />
              Join the Panel
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white text-balance">
              Become a <span className="text-gold-gradient">judge</span>
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-white/65">
              We&apos;re looking for experienced professionals to help us identify and celebrate
              the businesses shaping our region. As a judge, you&apos;ll evaluate applications,
              attend the award ceremony, and be recognised as a leader in your field.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/45">
              Applications take under 5 minutes. Our team reviews every submission and will be
              in touch within 5 working days.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/apply-judge"
                className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
              >
                Become a Judge
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/judges"
                className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Meet the Panel
              </Link>
            </div>
          </Reveal>

          {/* Right — perks grid */}
          <Reveal delay={0.1}>
            <p className="mb-5 text-xs font-semibold uppercase tracking-luxe text-gold">
              What you get as a judge
            </p>
            <RevealGroup className="grid gap-3 sm:grid-cols-2" stagger={0.05}>
              {PERKS.map((p) => (
                <RevealItem key={p.label}>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition-colors duration-300 hover:border-gold/30">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                      <p.icon className="h-4 w-4 text-ink" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/50">{p.desc}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
