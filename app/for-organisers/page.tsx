import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Zap, Users, Trophy, Mail, BarChart3,
  Calendar, Star, Shield, Clock, TrendingUp, HeartHandshake,
  Sparkles, Layers, Globe, MessageSquare, Award, FileText,
  ChevronRight, Cpu, Target, Rocket
} from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { CtaBand } from '@/components/CtaBand';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { Icon } from '@/components/ui/Icon';
import { IMAGES } from '@/lib/content';
import { getSite } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'For Award Organisers — 360° Awards Management Platform',
    description:
      `${site.name} gives award organisers a complete AI-powered platform to manage nominations, judging, applicants, email campaigns and ceremony night — all in one place. Save time, reduce costs, and transform your awards.`,
  };
}

const PAINS = [
  {
    icon: Clock,
    title: 'Drowning in spreadsheets',
    body: 'Manually tracking hundreds of nominations across tabs, losing data, missing deadlines. It takes days just to know where you stand.',
  },
  {
    icon: Mail,
    title: 'Email chaos',
    body: 'Copy-pasting names into Mailchimp, chasing bounces manually, no idea who opened what or when. Every campaign feels like starting from scratch.',
  },
  {
    icon: Users,
    title: 'Judge co-ordination nightmares',
    body: 'Emailing PDFs back and forth, chasing scores via WhatsApp, trying to aggregate results manually the night before the ceremony.',
  },
  {
    icon: Calendar,
    title: 'Ceremony night anxiety',
    body: 'No centralised view of shortlists, finalists and winners. Every decision made under pressure, with no audit trail and no confidence.',
  },
];

const PILLARS = [
  {
    icon: 'Inbox',
    color: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/20',
    accent: 'text-violet-400',
    title: 'Nomination Management',
    tagline: 'Never miss an entry again',
    features: [
      'Custom nomination forms per event',
      'Multi-category entries in one flow',
      'View, edit and flag nominations',
      'Shortlist → Semi-finalist → Finalist pipeline',
      'Supporting document upload',
    ],
  },
  {
    icon: 'Mail',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20',
    accent: 'text-blue-400',
    title: 'Email Campaign Engine',
    tagline: 'Send smarter, not harder',
    features: [
      'Drag-and-drop template builder',
      'Automated reminder flows',
      'Real-time open / click / bounce tracking',
      'CSV contact import with custom fields',
      'Multi-mailbox SMTP / Resend / Mailgun',
    ],
  },
  {
    icon: 'Gavel',
    color: 'from-gold/20 to-gold/5',
    border: 'border-gold/20',
    accent: 'text-gold',
    title: 'Judging Workflow',
    tagline: 'Fair, transparent, effortless',
    features: [
      'Approve or reject judge applications',
      'Allocate judges to specific categories',
      'Assign applicants to judges in bulk',
      'Track scoring progress per category',
      'Average score ranking for decisions',
    ],
  },
  {
    icon: 'Trophy',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20',
    accent: 'text-emerald-400',
    title: 'Award Night Command Centre',
    tagline: 'Ceremony night, in full control',
    features: [
      'Live shortlist / finalist / winner views',
      'Action centre per applicant (status, notes, comms)',
      'Certificate generation',
      'Schedule booking & co-ordination',
      'Full comment and email trail per applicant',
    ],
  },
  {
    icon: 'Layers',
    color: 'from-rose-500/20 to-rose-500/5',
    border: 'border-rose-500/20',
    accent: 'text-rose-400',
    title: 'Event & Category Studio',
    tagline: 'Build your ceremony your way',
    features: [
      'Unlimited award categories per event',
      'CSV bulk import of categories',
      'Theme grouping with custom icons & logos',
      'Multi-site category sharing',
      'Clone events year-over-year instantly',
    ],
  },
  {
    icon: 'BarChart3',
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/20',
    accent: 'text-cyan-400',
    title: 'Analytics & Insights',
    tagline: 'Data that drives better decisions',
    features: [
      'Dashboard: registrations & nominations at a glance',
      'Campaign stats: per-recipient engagement',
      'Judge progress tracking',
      'Applicant pipeline visualisation',
      'Export data for stakeholder reporting',
    ],
  },
];

const STEPS = [
  {
    number: '01',
    icon: Rocket,
    title: 'Set up your ceremony in minutes',
    body: 'Create your event, build your award categories, import contacts, and configure your nomination form. What used to take weeks takes an afternoon.',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Run campaigns that convert',
    body: 'Launch targeted email campaigns to your contacts, track every open and click, automate reminders, and watch nominations roll in — without lifting a finger after setup.',
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Deliver a flawless ceremony',
    body: 'Allocate judges, collect scores, shortlist finalists, and walk into ceremony night with a complete, live view of every applicant and every decision.',
  },
];

const STATS = [
  { value: '360°', label: 'end-to-end management', sub: 'from first nomination to winners\' announcement' },
  { value: '70+', label: 'platform features', sub: 'across nominations, judging, email, categories & settings' },
  { value: '10×', label: 'faster than manual', sub: 'bulk actions, automation and AI eliminate repetitive work' },
  { value: '1', label: 'platform, everything included', sub: 'no patchwork of tools, spreadsheets or agencies needed' },
];

const AI_FEATURES = [
  { icon: Cpu, title: 'Smart Contact Segmentation', body: 'AI-assisted filtering surfaces the right contacts for every campaign — by industry, status, engagement history and custom fields.' },
  { icon: Target, title: 'Judging Score Intelligence', body: 'Automatic average score calculation ranks applicants objectively, removing bias and giving your judging panel a clear, data-backed view.' },
  { icon: MessageSquare, title: 'Applicant Communication Hub', body: 'Every email, comment, status change and document per applicant lives in one thread — your team always knows the full picture.' },
  { icon: Globe, title: 'Multi-Site Architecture', body: 'Run multiple award ceremonies from one account. Share categories, themes and contacts across brands without duplicating effort.' },
];

export default async function ForOrganisersPage() {
  const site = await getSite();
  return (
    <main id="main">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.08] blur-[140px]" />
          <div className="absolute right-1/4 bottom-1/4 h-[30rem] w-[30rem] rounded-full bg-violet-500/[0.06] blur-[120px]" />
        </div>
        <div className="container-luxe section-pad relative z-10 py-32 text-center">
          <Reveal>
            <span className="eyebrow mb-6 justify-center gap-3">
              <span className="h-px w-8 bg-gold/60" />
              For Award Ceremony Organisers
              <span className="h-px w-8 bg-gold/60" />
            </span>
            <h1 className="font-display text-5xl font-bold leading-[1.1] text-white text-balance sm:text-6xl lg:text-7xl">
              Run Your Entire Awards<br />
              <span className="text-gold-gradient">From One Intelligent Platform</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/65 text-balance sm:text-xl">
              {site.name} gives you a complete 360° awards management solution —
              nominations, judging, email campaigns, ceremony night and beyond.
              Save weeks of effort, cut costs, and deliver an award ceremony your nominees will never forget.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-8 py-4 text-sm font-bold uppercase tracking-wider text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
              >
                Request a Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                See All Features
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
              {['No spreadsheets', 'No agency fees', 'No technical skill needed', 'Launch in days'].map(t => (
                <span key={t} className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle2 className="h-4 w-4 text-gold/70 shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pain Points ───────────────────────────────────────────────────── */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-rule" />
        <div className="container-luxe section-pad">
          <Reveal className="mx-auto max-w-3xl text-center mb-14">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              Sound Familiar?
            </span>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl text-balance">
              Organising awards is <span className="text-gold-gradient">harder than it should be</span>
            </h2>
            <p className="mt-4 text-white/55 leading-relaxed">
              Most award organisers are stitching together spreadsheets, email tools, WhatsApp groups and last-minute panic.
              It costs time, money and credibility — and it doesn&apos;t have to.
            </p>
          </Reveal>
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {PAINS.map(p => (
              <RevealItem key={p.title}>
                <div className="h-full rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 mb-4">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{p.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Solution intro ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-24 lg:py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[50rem] w-[70rem] rounded-full bg-gold/[0.05] blur-[160px]" />
        <div className="container-luxe section-pad relative">
          <Reveal className="mx-auto max-w-3xl text-center mb-20">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              The Platform
            </span>
            <h2 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl text-balance">
              Everything you need.<br />
              <span className="text-gold-gradient">Nothing you don&apos;t.</span>
            </h2>
            <p className="mt-5 text-lg text-white/60 leading-relaxed text-balance">
              {site.name} is a fully integrated awards management platform built by
              organisers who understand the pressure of running a successful ceremony.
              Every feature exists to give you back time, reduce cost and elevate the experience
              for your nominees, judges and guests.
            </p>
          </Reveal>

          {/* Stats row */}
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-20" stagger={0.07}>
            {STATS.map(s => (
              <RevealItem key={s.value}>
                <div className="rounded-2xl glass p-7 text-center">
                  <p className="font-display text-4xl font-bold text-gold">{s.value}</p>
                  <p className="mt-1.5 text-sm font-semibold text-white">{s.label}</p>
                  <p className="mt-1 text-xs text-white/40 leading-relaxed">{s.sub}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Feature Pillars ───────────────────────────────────────────────── */}
      <section id="features" className="relative bg-slate950 py-20 lg:py-28 scroll-mt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-rule" />
        <div className="container-luxe section-pad">
          <Reveal className="mx-auto max-w-3xl text-center mb-14">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              Platform Capabilities
            </span>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl text-balance">
              Six pillars of a <span className="text-gold-gradient">world-class ceremony</span>
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
            {PILLARS.map(p => (
              <RevealItem key={p.title}>
                <div className={`h-full rounded-2xl border ${p.border} bg-gradient-to-br ${p.color} p-7`}>
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${p.border} bg-white/5 mb-5 ${p.accent}`}>
                    <Icon name={p.icon as never} className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-white">{p.title}</h3>
                  <p className={`mt-0.5 text-xs font-semibold uppercase tracking-wider ${p.accent}`}>{p.tagline}</p>
                  <ul className="mt-4 space-y-2">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                        <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${p.accent}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-24 lg:py-32">
        <div className="container-luxe section-pad">
          <Reveal className="mx-auto max-w-3xl text-center mb-16">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              How It Works
            </span>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl text-balance">
              From setup to standing ovation <span className="text-gold-gradient">in three steps</span>
            </h2>
          </Reveal>
          <div className="relative mx-auto max-w-4xl">
            <div className="pointer-events-none absolute left-[2.25rem] top-16 bottom-16 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent hidden lg:block" />
            <RevealGroup className="space-y-10" stagger={0.12}>
              {STEPS.map((step, i) => (
                <RevealItem key={step.number}>
                  <div className="flex gap-8 items-start">
                    <div className="relative shrink-0 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                      <step.icon className="h-6 w-6" />
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink">
                        {i + 1}
                      </span>
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold/50 mb-1">{step.number}</p>
                      <h3 className="font-display text-xl font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-white/55 leading-relaxed max-w-xl">{step.body}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── AI Features ───────────────────────────────────────────────────── */}
      <section className="relative bg-slate950 py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-rule" />
        <div className="container-luxe section-pad">
          <Reveal className="mx-auto max-w-3xl text-center mb-14">
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              AI-Powered Intelligence
            </span>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl text-balance">
              The platform that <span className="text-gold-gradient">thinks ahead for you</span>
            </h2>
            <p className="mt-4 text-white/55 leading-relaxed">
              Intelligent automation removes the repetitive work so you can focus on what matters —
              creating a ceremony experience that inspires, celebrates and connects.
            </p>
          </Reveal>
          <RevealGroup className="grid gap-6 sm:grid-cols-2" stagger={0.08}>
            {AI_FEATURES.map(f => (
              <RevealItem key={f.title}>
                <div className="h-full flex gap-5 rounded-2xl glass p-7">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-gradient text-ink shadow-gold-sm">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/55">{f.body}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Emotional pull quote ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-28 lg:py-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[40rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.07] blur-[140px]" />
        </div>
        <div className="container-luxe section-pad relative text-center">
          <Reveal>
            <span className="font-display text-6xl text-gold/20 leading-none select-none">&ldquo;</span>
            <blockquote className="mx-auto max-w-3xl font-display text-2xl font-semibold leading-relaxed text-white sm:text-3xl text-balance -mt-4">
              Your nominees worked hard to deserve recognition.
              They deserve an organiser whose platform works just as hard.
            </blockquote>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-gold/60">
              {site.name} — Built for Organisers Who Care
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-8 py-4 text-sm font-bold uppercase tracking-wider text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
              >
                Start the Conversation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What's included summary ───────────────────────────────────────── */}
      <section className="relative bg-slate950 py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-rule" />
        <div className="container-luxe section-pad">
          <Reveal className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Everything included. <span className="text-gold-gradient">Nothing extra to buy.</span>
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
            {[
              'Unlimited award categories',
              'Unlimited email templates',
              'Automated reminder campaigns',
              'Email open & click analytics',
              'Judge application management',
              'Judge-to-category allocation',
              'Applicant scoring & ranking',
              'Shortlist / finalist pipeline',
              'Certificate generation',
              'CSV bulk import for contacts & categories',
              'Multi-site theme sharing',
              'Event cloning (year-over-year)',
              'Custom eligibility questions',
              'Per-applicant comment threads',
              'Full email trail per applicant',
              'SMTP / Resend / Mailgun support',
              'Global email suppression list',
              'Schedule booking integration',
              'Site settings & custom branding',
              'Organiser dashboard & stats',
              'Role-based access (organiser / judge / applicant)',
            ].map(item => (
              <RevealItem key={item}>
                <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-gold/[0.09] blur-[140px]" />
        <div className="container-luxe section-pad relative mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="eyebrow mb-4 justify-center">
              <span className="h-px w-6 bg-gold/60" />
              Ready to Transform Your Awards?
            </span>
            <h2 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl text-balance">
              Let&apos;s build your next ceremony <span className="text-gold-gradient">together</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60">
              Join a growing community of award organisers who&apos;ve replaced the chaos with clarity.
              Book a free demo and see the full platform in action — no commitment required.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-9 py-4 text-sm font-bold uppercase tracking-wider text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
              >
                Book a Free Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Talk to the Team
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/30">
              No setup fees · No long contracts · Onboarding support included
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
