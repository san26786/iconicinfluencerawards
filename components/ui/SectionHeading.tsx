import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
}) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left';
  return (
    <Reveal className={`flex flex-col ${alignment} max-w-3xl ${className}`}>
      {eyebrow && (
        <span className="eyebrow mb-4">
          <span className="h-px w-6 bg-gold/60" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.08] text-balance text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base sm:text-lg leading-relaxed text-white/60 text-balance">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
