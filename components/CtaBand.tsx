import { Sparkles } from 'lucide-react';
import { REASSURE } from '@/lib/content';
import { getSite } from '@/lib/site';
import { PrimaryButton, GhostButton } from './ui/Button';
import { Reveal } from './ui/Reveal';

export async function CtaBand({
  title = 'Ready to gain the recognition you deserve?',
  text = 'Nominations are free and open now. Enter as many categories as genuinely fit — there is nothing to lose and a stage to gain.',
}: {
  title?: string;
  text?: string;
}) {
  const site = await getSite();
  return (
    <section className="relative overflow-hidden bg-slate950 py-20 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[140px] hidden sm:block" />
      <div className="container-luxe section-pad relative">
        <Reveal className="mx-auto max-w-3xl rounded-3xl glass-gold p-10 text-center lg:p-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/40 px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-luxe text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Free To Enter · {site.year}
          </span>
          <h2 className="mt-6 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white text-balance">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/65 text-balance">{text}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton href="/register-interest">Start Your Free Entry</PrimaryButton>
            <GhostButton href="/register-interest?mode=nominate">Nominate a Business You Love</GhostButton>
          </div>
          <p className="mt-5 text-sm text-white/55">{REASSURE}</p>
        </Reveal>
      </div>
    </section>
  );
}
