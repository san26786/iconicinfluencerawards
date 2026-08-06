import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { IMG, IMAGES, SITE, CATEGORIES, CATEGORY_COUNT } from '@/lib/content';
import { Icon, type IconName } from './ui/Icon';
import { Reveal } from './ui/Reveal';
import { PrimaryButton } from './ui/Button';

// A handful of categories shown as a teaser to spark curiosity. The "+N more"
// count is against the full taxonomy, not just this highlight list, so the
// number a visitor sees matches what the categories page actually offers.
const TEASER = CATEGORIES.slice(0, 6);
const REMAINING = CATEGORY_COUNT - TEASER.length;

export function CategoriesBanner() {
  return (
    <section id="categories" className="relative overflow-hidden bg-ink py-24 lg:py-32">
      {/* Cinematic backdrop */}
      <div className="absolute inset-0">
        <Image
          src={IMG(IMAGES.audienceHands, 1280, 55)}
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
            Explore the Categories · Free to enter
          </span>

          <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.04] text-white text-balance sm:text-5xl lg:text-6xl">
            There&apos;s a category with <span className="text-gold-shimmer">your name on it</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 text-balance">
            {CATEGORY_COUNT} honours across agency, development, property services, innovation,
            people and impact — each a different stage for a different story. Find the one built
            for yours, and enter as many as genuinely fit.
          </p>

          {/* Teaser chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {TEASER.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-2 text-xs font-medium text-white/70"
              >
                <Icon name={c.icon as IconName} className="h-4 w-4 text-gold" />
                {c.name}
              </span>
            ))}
            <span className="inline-flex items-center rounded-full glass-gold px-3.5 py-2 text-xs font-semibold text-gold">
              + {REMAINING} more
            </span>
          </div>

          <div className="mt-10">
            <PrimaryButton href={SITE.categoriesUrl}>Explore All Categories</PrimaryButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
