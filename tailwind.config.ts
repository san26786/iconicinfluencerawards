import type { Config } from 'tailwindcss';

// All brand colours are driven by CSS custom properties defined in globals.css.
// The variable values are RGB channel triplets (e.g. "204 27 27") so that
// Tailwind can inject the alpha value for utilities like bg-gold/25.
// The actual variable values come from the sites DB table and are injected
// per-request in app/layout.tsx — different sites get different colours with
// zero code changes.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:      'rgb(var(--c-bg)      / <alpha-value>)',
        slate950: 'rgb(var(--c-bg-slate)/ <alpha-value>)',
        gold: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          light:   'rgb(var(--c-light)   / <alpha-value>)',
          deep:    'rgb(var(--c-deep)    / <alpha-value>)',
          50:      'rgb(var(--c-50)      / <alpha-value>)',
        },
        cream: '#F8FAFC',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans:    ['var(--font-sans)',    'system-ui', 'sans-serif'],
        script:  ['var(--font-script)',  'cursive'],
      },
      letterSpacing: {
        luxe: '0.28em',
      },
      backgroundImage: {
        // CSS Color Level 4 rgb(R G B) — no commas needed; works in all modern browsers.
        'gold-gradient': 'linear-gradient(135deg, rgb(var(--c-light)) 0%, rgb(var(--c-primary)) 50%, rgb(var(--c-deep)) 100%)',
        'gold-sheen':    'linear-gradient(110deg, rgb(var(--c-deep)) 0%, rgb(var(--c-light)) 30%, #FFF5E0 50%, rgb(var(--c-light)) 70%, rgb(var(--c-primary)) 100%)',
        'dark-radial':   'radial-gradient(120% 120% at 50% 0%, rgb(var(--c-bg-warm)) 0%, rgb(var(--c-bg)) 55%, rgb(var(--c-bg-darkest)) 100%)',
        'glass-edge':    'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        gold:     '0 18px 50px -12px rgb(var(--c-primary) / 0.5)',
        'gold-sm': '0 8px 24px  -8px rgb(var(--c-primary) / 0.45)',
        glass:    '0 24px 60px -20px rgba(0, 0, 0, 0.7)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':      { transform: 'translateY(-22px) rotate(3deg)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.9' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        shimmer:      'shimmer 6s linear infinite',
        float:        'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'spin-slow':  'spin-slow 26s linear infinite',
        'pulse-glow': 'pulse-glow 5s ease-in-out infinite',
        marquee:      'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
