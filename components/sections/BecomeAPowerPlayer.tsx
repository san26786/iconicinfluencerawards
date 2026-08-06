import Link from 'next/link';
import {
  ArrowRight,
  Megaphone,
  ShieldCheck,
  Handshake,
  Award,
  Newspaper,
} from 'lucide-react';
import { SITE } from '@/lib/content';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

const BENEFITS = [
  { icon: Megaphone, label: 'Brand visibility' },
  { icon: ShieldCheck, label: 'Local credibility' },
  { icon: Handshake, label: 'VIP networking' },
  { icon: Award, label: 'Category association' },
  { icon: Newspaper, label: 'Media exposure' },
];

export function BecomeAPowerPlayer() {
  return (
    <section className="relative overflow-hidden bg-slate950 py-20 lg:py-28">
      {/* Glow */}
      <div className="pointer-events-none absolute -right-20 top-0 h-[28rem] w-[28rem] rounded-full bg-gold/12 blur-[140px] hidden sm:block" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-[22rem] w-[22rem] rounded-full bg-gold/10 blur-[120px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Left — pitch */}
          <Reveal>
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-gold/60" />
              Partner With Us
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white text-balance">
              Become a <span className="text-gold-gradient">power player</span>
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-white/65">
              Stand alongside the businesses defining the region&apos;s future. Sponsorship puts
              your brand at the centre of the celebration — and inside the conversation that
              follows.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={SITE.partnerUrl}
                className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
              >
                Sponsor an Award
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href={SITE.partnerUrl}
                className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Request Sponsorship Pack
              </Link>
              <Link
                href={SITE.partnerUrl}
                className="text-sm font-medium text-gold/85 underline-offset-4 transition-colors hover:text-gold hover:underline"
              >
                Become a Partner →
              </Link>
            </div>
          </Reveal>

          {/* Right — benefits panel */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl glass p-7 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-luxe text-gold">
                What sponsorship unlocks
              </p>
              <RevealGroup className="mt-5 space-y-3" stagger={0.05}>
                {BENEFITS.map((b) => (
                  <RevealItem key={b.label}>
                    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 transition-colors duration-300 hover:border-gold/35">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
                        <b.icon className="h-5 w-5 text-ink" />
                      </span>
                      <span className="text-sm font-medium text-white">{b.label}</span>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
              <p className="mt-6 text-center text-xs italic text-white/45">
                Founding partners get first call on every category.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
