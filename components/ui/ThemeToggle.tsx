'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const CYCLE: Theme[] = ['dark', 'light', 'system'];

const ICONS: Record<Theme, typeof Sun> = {
  light:  Sun,
  dark:   Moon,
  system: Monitor,
};

const LABELS: Record<Theme, string> = {
  light:  'Switch to System mode',
  dark:   'Switch to Light mode',
  system: 'Switch to Dark mode',
};

function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) || 'dark';
    setTheme(stored);
    setMounted(true);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (localStorage.getItem('theme') === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  }

  if (!mounted) return null;

  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/60 transition-colors hover:border-gold/30 hover:bg-white/[0.07] hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
