'use client';

// Interactive accordion. Extracted from Faq so the surrounding section
// chrome (eyebrow, heading, "Free to enter" callout, Start Your Entry
// button) can ship as static RSC. Only this list — the open/close state
// owner — hydrates on the client.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Reveal } from '../ui/Reveal';

// The list is resolved per site and passed in — this component can't read the
// request itself, and two of the answers name the region, venue and date.
export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Reveal delay={0.05} className="divide-y divide-white/10">
      {faqs.map((faq, i) => (
        <FaqItem
          key={faq.q}
          {...faq}
          isOpen={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
        />
      ))}
    </Reveal>
  );
}

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-gold"
      >
        <span className="font-display text-lg font-medium text-white sm:text-xl">{q}</span>
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen ? 'rotate-45 border-gold bg-gold-gradient text-ink' : 'border-white/20 text-white/70'
          }`}
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>
      {/* CSS grid-rows accordion — animates open/closed with no JS animation library. */}
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0">
          <p className="pb-6 pr-12 text-sm leading-relaxed text-white/60 sm:text-base">{a}</p>
        </div>
      </div>
    </div>
  );
}
