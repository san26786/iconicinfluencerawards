'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Globe, ChevronDown, Check } from 'lucide-react';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            autoDisplay?: boolean;
            multilanguagePage?: boolean;
          },
          id: string
        ) => void;
      };
    };
  }
}

const LANGUAGES = [
  { code: 'en',    label: 'English',    iso: 'GB' },
  { code: 'ar',    label: 'العربية',    iso: 'SA' },
  { code: 'zh-CN', label: '中文',       iso: 'CN' },
  { code: 'de',    label: 'Deutsch',    iso: 'DE' },
  { code: 'es',    label: 'Español',    iso: 'ES' },
  { code: 'fr',    label: 'Français',   iso: 'FR' },
  { code: 'hi',    label: 'हिन्दी',       iso: 'IN' },
  { code: 'hu',    label: 'Magyar',     iso: 'HU' },
  { code: 'it',    label: 'Italiano',   iso: 'IT' },
  { code: 'ja',    label: '日本語',     iso: 'JP' },
  { code: 'ko',    label: '한국어',     iso: 'KR' },
  { code: 'pl',    label: 'Polski',     iso: 'PL' },
  { code: 'pt',    label: 'Português',  iso: 'PT' },
  { code: 'ru',    label: 'Русский',    iso: 'RU' },
  { code: 'tr',    label: 'Türkçe',     iso: 'TR' },
  { code: 'ur',    label: 'اردو',       iso: 'PK' },
];

function triggerTranslation(langCode: string) {
  if (langCode === 'en') {
    // Restore original — find the "Show original" link or reset cookie
    const bar = document.querySelector<HTMLIFrameElement>('.goog-te-banner-frame');
    if (bar) {
      const restore = bar.contentDocument?.querySelector<HTMLElement>('.goog-te-banner-frame__link');
      restore?.click();
    }
    // Reset the combo select to English
    const sel = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (sel) { sel.value = 'en'; sel.dispatchEvent(new Event('change')); }
    return;
  }
  const sel = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (sel) {
    sel.value = langCode;
    sel.dispatchEvent(new Event('change'));
  }
}

export function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(LANGUAGES[0]);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Expose init callback for Google Translate script
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'gt-hidden-element',
      );
    };
  }, []);

  function select(lang: (typeof LANGUAGES)[0]) {
    setCurrent(lang);
    setOpen(false);
    triggerTranslation(lang.code);
  }

  return (
    <>
      {/* Hidden Google Translate widget — provides the underlying select */}
      <div id="gt-hidden-element" className="absolute -top-[9999px] -left-[9999px] overflow-hidden" aria-hidden="true" />

      {/* Custom dropdown */}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Change language"
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-gold/30 hover:bg-white/[0.07] hover:text-white"
        >
          <Globe className="h-3.5 w-3.5 text-gold/70" />
          <span className="hidden sm:inline">{current.iso}</span>
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-[300] mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f1a] shadow-2xl">
            <div className="max-h-80 overflow-y-auto py-1 scrollbar-thin">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => select(lang)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${
                    current.code === lang.code ? 'text-gold' : 'text-white/65 hover:text-white'
                  }`}
                >
                  <span className="w-6 text-center text-[0.6rem] font-bold text-white/30">{lang.iso}</span>
                  <span className="flex-1">{lang.label}</span>
                  {current.code === lang.code && <Check className="h-3.5 w-3.5 text-gold" />}
                </button>
              ))}
            </div>
            <div className="border-t border-white/8 px-4 py-2.5">
              <p className="text-[0.6rem] text-white/25">Powered by Google Translate</p>
            </div>
          </div>
        )}
      </div>

      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
