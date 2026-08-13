/**
 * Typographic fallback for the site's logo.
 *
 * No Iconic Influencer Awards logo asset ships in this repo, and shipping another
 * brand's mark in its place is worse than shipping none — so until a real logo
 * is uploaded (organiser → Site Settings, which writes sites.logo_url), the
 * header and footer render the site name as a wordmark.
 *
 * Splits the name so the last word sits under the rest in tracked caps, which
 * is how awards lockups are normally set.
 */
export function Wordmark({
  siteName,
  size = 'lg',
  className = '',
}: {
  siteName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const words = siteName.trim().split(/\s+/);
  const lead = words.slice(0, -1).join(' ');
  const tail = words.length > 1 ? words[words.length - 1] : '';

  const S = {
    sm: { lead: 'text-sm', tail: 'text-[0.5rem] tracking-[0.3em]' },
    md: { lead: 'text-lg', tail: 'text-[0.6rem] tracking-[0.32em]' },
    lg: { lead: 'text-2xl sm:text-[1.6rem]', tail: 'text-[0.65rem] tracking-[0.34em]' },
  }[size];

  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className={`font-display font-semibold text-gold-gradient ${S.lead}`}>
        {lead || siteName}
      </span>
      {tail && (
        <span className={`mt-1 font-sans font-bold uppercase text-white/70 ${S.tail}`}>
          {tail}
        </span>
      )}
    </span>
  );
}
