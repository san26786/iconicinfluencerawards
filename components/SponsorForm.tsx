'use client';

import { useState } from 'react';
import { ArrowRight, Check, Handshake, CheckCircle2, ShieldCheck } from 'lucide-react';

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

const INTERESTS = [
  'Headline / title sponsorship',
  'Category sponsorship',
  'VIP tables & hospitality',
  'Speaking & panels',
  'Media, advertising & branding',
  'Long-term partnership',
];

const INVESTMENT = [
  { title: 'Supporter', sub: 'Under £500 — attendance and networking access.' },
  { title: 'Professional', sub: '£500 – £1,999 — branding and premium seating.' },
  { title: 'Strategic', sub: '£2,000 – £4,999 — enhanced visibility and corporate hospitality.' },
  { title: 'Headline', sub: '£10,000+ — title sponsorship and full brand integration.' },
];

export function SponsorForm({ siteName }: { siteName?: string } = {}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '' });
  const [interests, setInterests] = useState<string[]>([]);
  const [investment, setInvestment] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggle = (list: string[], setList: (v: string[]) => void) => (v: string) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.business.trim() || !emailOk) {
      setError('Please add your name, organisation and a valid email address.');
      return;
    }
    if (!interests.length) {
      setError('Please select at least one area of interest.');
      return;
    }
    if (!consent) {
      setError('Please tick the consent box to continue.');
      return;
    }
    setError('');
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-3xl glass-gold p-8 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
          <Handshake className="h-8 w-8 text-ink" />
        </span>
        <h3 className="mt-6 font-display text-2xl font-semibold text-white">
          Thank you — let us talk
        </h3>
        <p className="mx-auto mt-3 max-w-md text-white/70">
          Thank you, {form.name.split(' ')[0] || 'there'}. Our partnerships team will prepare a
          tailored proposal for {form.business || 'your organisation'} and be in touch shortly.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 text-sm text-gold">
          <CheckCircle2 className="h-4 w-4" />
          No commitment — a conversation first
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl glass p-7 sm:p-9 lg:p-10">
      <div className="space-y-8">
        <div>
          <h3 className="font-display text-xl font-semibold text-white">Tell us about your organisation</h3>
          <p className="mt-1.5 text-sm text-white/55">A quick enquiry — our team handles the rest.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name *" htmlFor="s-name">
              <input id="s-name" value={form.name} onChange={set('name')} type="text" placeholder="Jane Smith" className={inputBase} />
            </Field>
            <Field label="Organisation *" htmlFor="s-business">
              <input id="s-business" value={form.business} onChange={set('business')} type="text" placeholder="Your organisation" className={inputBase} />
            </Field>
            <Field label="Email *" htmlFor="s-email">
              <input id="s-email" value={form.email} onChange={set('email')} type="email" placeholder="jane@business.com" className={inputBase} />
            </Field>
            <Field label="Phone" htmlFor="s-phone">
              <input id="s-phone" value={form.phone} onChange={set('phone')} type="tel" placeholder="07000 000000" className={inputBase} />
            </Field>
          </div>
        </div>

        <Group label="What are you interested in? *" hint="Select all that apply">
          {INTERESTS.map((o) => (
            <OptionCard key={o} title={o} checked={interests.includes(o)} onToggle={() => toggle(interests, setInterests)(o)} />
          ))}
        </Group>

        <Group label="Indicative level of investment" hint="Optional · select all that apply">
          {INVESTMENT.map((o) => (
            <OptionCard
              key={o.title}
              title={o.title}
              sub={o.sub}
              checked={investment.includes(o.title)}
              onToggle={() => toggle(investment, setInvestment)(o.title)}
            />
          ))}
        </Group>

        <div>
          <span className="mb-2 block text-sm font-semibold text-white">Anything else we should know?</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Tell us about your goals — brand visibility, lead generation, community impact, hospitality."
            className={`${inputBase} resize-none`}
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/65">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-[#CC1B1B]"
          />
          <span>
            I consent to being contacted with a tailored partnership proposal and occasional updates
            regarding {siteName ?? 'the awards'}. *
          </span>
        </label>

        {error && <ErrorNote>{error}</ErrorNote>}

        <button
          type="submit"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-4 text-sm font-semibold text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
        >
          Request Partnership Details
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-white/40">
          <ShieldCheck className="h-3.5 w-3.5 text-gold/70" />
          Your details are kept confidential and never shared.
        </p>
      </div>
    </form>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display text-lg font-semibold text-white">{label}</legend>
      {hint && <p className="mt-0.5 text-xs text-white/40">{hint}</p>}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function OptionCard({
  title,
  sub,
  checked,
  onToggle,
}: {
  title: string;
  sub?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
        checked
          ? 'border-gold/60 bg-gold/10 shadow-gold-sm'
          : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked ? 'border-transparent bg-gold-gradient' : 'border-white/30'
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 text-ink" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-snug text-white">{title}</span>
        {sub && <span className="mt-0.5 block text-xs leading-snug text-white/50">{sub}</span>}
      </span>
    </button>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">{label}</span>
      {children}
    </label>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{children}</p>
  );
}
