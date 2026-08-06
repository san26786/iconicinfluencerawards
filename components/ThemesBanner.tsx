import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { IMG, IMAGES, SITE, THEMES } from '@/lib/content';
import { Icon, type IconName } from './ui/Icon';
import { Reveal } from './ui/Reveal';
import { PrimaryButton } from './ui/Button';

export function ThemesBanner() {
  return (
    <section id="themes" className="relative overflow-hidden bg-ink py-24 lg:py-32">
      {/* Cinematic backdrop */}
      <div className="absolute inset-0">
        <Image
          src={IMG(IMAGES.conferenceCrowd, 1280, 55)}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1280px"
          quality={50}
          className="object-cover object-center opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/85 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-transparent to-ink/90" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/20 blur-[150px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass-gold px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-luxe text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            One Vision · One Environment
          </span>

          <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.08] text-white text-balance sm:text-5xl">
            Distinct Themes. <span className="text-gold-shimmer">One Vision.</span> Engage with What
            Matters Most to You.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 text-balance">
            Women in business and business excellence — distinct areas of focus, united by a single
            vision. Find the one that aligns with your values and ambitions, and step into a
            community built for you.
          </p>

          {/* Theme chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {THEMES.map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-2 text-xs font-medium text-white/70"
              >
                <Icon name={t.icon as IconName} className="h-4 w-4 text-gold" />
                {t.theme}
              </span>
            ))}
          </div>

          <div className="mt-10">
            <PrimaryButton href={SITE.themesUrl}>Explore Our Themes</PrimaryButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
