import { Facebook, Instagram, Linkedin } from 'lucide-react';

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

const ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  x: XIcon,
};

export function SocialLinks({
  buttonClass = 'h-10 w-10',
  iconClass = 'h-4 w-4',
  className = '',
  // The site's own social URLs. Anything not set is simply not rendered.
  facebook,
  instagram,
  linkedin,
  x,
}: {
  buttonClass?: string;
  iconClass?: string;
  className?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
}) {
  // Only ever the links this site actually has. There used to be a fallback to
  // the static SOCIAL list here, which meant a site with no social columns set
  // silently rendered another brand's Facebook/LinkedIn/Instagram/X accounts.
  const links = [
    facebook  && { label: 'Facebook',  href: facebook,  icon: 'facebook'  },
    instagram && { label: 'Instagram', href: instagram, icon: 'instagram' },
    linkedin  && { label: 'LinkedIn',  href: linkedin,  icon: 'linkedin'  },
    x         && { label: 'X',         href: x,         icon: 'x'         },
  ].filter(Boolean) as { label: string; href: string; icon: string }[];

  if (links.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map((s) => {
        const I = ICONS[s.icon as keyof typeof ICONS];
        return (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className={`inline-flex ${buttonClass} items-center justify-center rounded-full glass text-white/70 transition-colors hover:border-gold/40 hover:text-gold`}
          >
            <I className={iconClass} />
          </a>
        );
      })}
    </div>
  );
}
