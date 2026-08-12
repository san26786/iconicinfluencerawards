import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

const sizes = {
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-[0.95rem]',
};

export function PrimaryButton({
  href,
  children,
  size = 'lg',
  className = '',
  showArrow = true,
}: {
  href: string;
  children: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
  showArrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${sizes[size]} overflow-hidden bg-gold-gradient text-ink shadow-gold hover:shadow-gold hover:-translate-y-0.5 ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
      {showArrow && (
        <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </Link>
  );
}

export function GhostButton({
  href,
  children,
  size = 'lg',
  className = '',
}: {
  href: string;
  children: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${sizes[size]} glass-gold text-white hover:border-gold/50 hover:bg-gold/10 hover:-translate-y-0.5 ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
