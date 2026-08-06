// Custom gold trophy mark — used for floating hero elements and accents.
export function TrophyMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ECFFF9" />
          <stop offset="30%" stopColor="#7BF0D5" />
          <stop offset="60%" stopColor="#23B89B" />
          <stop offset="100%" stopColor="#0C6E5B" />
        </linearGradient>
        <linearGradient id="trophyShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* handles */}
      <path
        d="M30 28C16 28 12 40 16 52C19 61 28 66 38 66"
        stroke="url(#trophyGold)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M90 28C104 28 108 40 104 52C101 61 92 66 82 66"
        stroke="url(#trophyGold)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* cup */}
      <path
        d="M30 20H90V44C90 64 78 78 60 78C42 78 30 64 30 44V20Z"
        fill="url(#trophyGold)"
      />
      <path
        d="M38 26H82V42C82 58 73 70 60 70C47 70 38 58 38 42V26Z"
        fill="url(#trophyShine)"
        opacity="0.5"
      />
      {/* stem */}
      <rect x="54" y="76" width="12" height="20" fill="url(#trophyGold)" />
      {/* base */}
      <path d="M40 96H80L84 110H36L40 96Z" fill="url(#trophyGold)" />
      <rect x="30" y="110" width="60" height="12" rx="3" fill="url(#trophyGold)" />
      {/* star */}
      <path
        d="M60 34L63.5 43H73L65.5 49L68.5 58L60 52L51.5 58L54.5 49L47 43H56.5L60 34Z"
        fill="#07151C"
        opacity="0.55"
      />
    </svg>
  );
}
