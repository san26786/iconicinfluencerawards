import Image from 'next/image';
import { IMG } from '@/lib/content';
import { Reveal } from './ui/Reveal';

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  image?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-ink grain pt-36 pb-16 lg:pt-44 lg:pb-24">
      {image && (
        <div className="absolute inset-0">
          <Image
            src={IMG(image, 1280, 55)}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1280px"
            quality={50}
            className="object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
        </div>
      )}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[150px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <Reveal className="max-w-3xl">
          <span className="eyebrow mb-4">
            <span className="h-px w-6 bg-gold/60" />
            {eyebrow}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] text-white text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65 text-balance">
              {subtitle}
            </p>
          )}
        </Reveal>
      </div>

      <div className="absolute inset-x-0 bottom-0 gold-rule" />
    </section>
  );
}
