import Image from 'next/image';
import { TrendingUp } from 'lucide-react';
import { IMG, IMAGES, IMPACT_POINTS, IMPACT_STATS, IMPACT_NOTE } from '@/lib/content';
import { Icon, type IconName } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';
import { Counter } from '../ui/Counter';

export function Impact() {
  return (
    <section className="relative overflow-hidden bg-slate950 py-24 lg:py-32">
      <div className="pointer-events-none absolute right-0 top-1/4 h-[36rem] w-[36rem] rounded-full bg-gold/10 blur-[150px] hidden sm:block" />
      <div className="container-luxe section-pad relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Visual side */}
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src={IMG(IMAGES.stageSpeaker, 1200, 75)}
              alt="Presenter on stage at a prestigious award function"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          </div>

          {/* Secondary inset image */}
          <div className="absolute -bottom-8 -right-4 hidden w-44 overflow-hidden rounded-2xl border-2 border-ink shadow-glass sm:block lg:-right-8 lg:w-52">
            <div className="relative aspect-[4/3]">
              <Image
                src={IMG(IMAGES.handshake, 600, 75)}
                alt="Congratulations after a win"
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Floating stat chip */}
          <div className="absolute -left-4 top-8 glass-gold rounded-2xl px-5 py-4 shadow-gold lg:-left-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-gradient">
                <TrendingUp className="h-5 w-5 text-ink" />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold text-white">
                  <Counter value={92} suffix="%" />
                </p>
                <p className="text-[0.65rem] uppercase tracking-wider text-white/60">
                  of award winners report growth
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Content side */}
        <div>
          <Reveal>
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-gold/60" />
              The Impact of Recognition
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.08] text-white text-balance">
              Recognition that <span className="text-gold-gradient">changes everything</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65 text-balance">
              Businesses that win awards gain trust faster, attract more opportunities, and stand out
              in crowded markets. A single accolade becomes a story you tell for years.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10 grid grid-cols-3 gap-4">
            {IMPACT_STATS.map((s) => (
              <div key={s.label} className="rounded-2xl glass p-4 sm:p-5">
                <div className="font-display text-3xl sm:text-4xl font-semibold text-gold-gradient">
                  <Counter value={s.value} suffix={s.suffix} />
                </div>
                <p className="mt-2 text-[0.72rem] leading-snug text-white/55">{s.label}</p>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.14} className="mt-3">
            <p className="text-[0.7rem] leading-snug text-white/35">{IMPACT_NOTE}</p>
          </Reveal>

          <Reveal delay={0.18} className="mt-9">
            <p className="mb-4 text-xs font-semibold uppercase tracking-luxe text-white/40">
              What recognition unlocks
            </p>
            <div className="flex flex-wrap gap-2.5">
              {IMPACT_POINTS.map((p) => (
                <span
                  key={p.label}
                  className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-white/75 transition-colors hover:border-gold/40 hover:text-white"
                >
                  <Icon name={p.icon as IconName} className="h-4 w-4 text-gold" />
                  {p.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
