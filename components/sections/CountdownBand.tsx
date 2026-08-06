import { getSite } from '@/lib/site';
import { STATS } from '@/lib/content';
import { Countdown } from '../ui/Countdown';
import { Counter } from '../ui/Counter';
import { Reveal } from '../ui/Reveal';

/**
 * "The inaugural night is almost here" — the countdown band that sits directly
 * under the hero, pairing the clock with the headline numbers for the event.
 */
export async function CountdownBand() {
  const site = await getSite();

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-slate950 py-20 lg:py-24">
      <div className="container-luxe section-pad relative">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal>
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-gold/60" />
              Counting down to the ceremony
            </span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">
              The inaugural night is <span className="text-gold-gradient">almost here</span>
            </h2>

            {site.event_date_iso ? (
              <Countdown
                className="mt-8 max-w-md"
                deadline={site.event_date_iso}
                variant="panel"
                label={`${site.name} ${site.year}`}
                closedLabel="The ceremony has taken place"
              />
            ) : (
              <p className="mt-6 text-sm text-white/55">
                The ceremony date is confirmed shortly — join the pre-launch list to hear first.
              </p>
            )}
          </Reveal>

          <Reveal delay={0.12}>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl glass">
              {STATS.map((s) => (
                <div key={s.label} className="bg-white/[0.015] p-7 text-center">
                  <div className="font-display text-4xl font-semibold text-gold-gradient">
                    <Counter value={s.value} suffix={s.suffix} />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wider text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
