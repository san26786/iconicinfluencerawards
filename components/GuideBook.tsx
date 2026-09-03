// The renderer behind every user guide.
//
// Three guides run through it — organiser, nominee and judge — each supplying
// its own sections and its own nav. They started as one page for organisers;
// the entrant and judge guides are the same document written for a different
// job, and copying the layout three times would mean three places to fix a
// broken heading level. The content files are the only thing that differs.
//
// Print-friendly on purpose — Ctrl+P gives a PDF that can be handed to a new
// starter, an entrant or a panel member without anyone maintaining a second
// copy of it.
//
// SCREENSHOTS ARE PER SITE
//
// public/guide/<site-slug>/<file>.jpg is used when it exists, and
// public/guide/default/<file>.jpg otherwise. Every brand's screens are its own
// colours and its own data, so a South Wales reader following a screenshot of
// London's board is being shown somebody else's site — but a site whose shots
// have not been taken yet still gets a complete guide rather than a page of
// broken images. The folder is read once per render, not probed per image.

import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, BookOpen, Image as ImageIcon, MapPin, Printer } from 'lucide-react';
import type { GuideSection } from '@/lib/guide/types';

/** The screenshots that exist in one folder under public/guide. */
function shotsIn(folder: string): Set<string> {
  try {
    return new Set(fs.readdirSync(path.join(process.cwd(), 'public', 'guide', folder)));
  } catch {
    // No folder yet for this site — perfectly normal, and not an error.
    return new Set();
  }
}

export function GuideBook({
  sections,
  siteSlug,
  eyebrow,
  intro,
  nav,
  backHref,
  backLabel,
}: {
  sections: GuideSection[];
  /** Which site's screenshot folder to prefer. */
  siteSlug: string;
  /** Who this guide is for — 'Organiser', 'Entrant', 'Judge'. */
  eyebrow: string;
  /** One paragraph under the title, in this guide's own words. */
  intro: string;
  /** The role's own menu, rendered only when the reader is signed in as that role. */
  nav?: React.ReactNode;
  backHref: string;
  backLabel: string;
}) {
  const mine = shotsIn(siteSlug);
  const fallback = shotsIn('default');
  /** This site's screenshot, the generic one, or none — in that order. */
  const shotSrc = (file: string): string | null => {
    if (mine.has(file)) return `/guide/${siteSlug}/${file}`;
    if (fallback.has(file)) return `/guide/default/${file}`;
    return null;
  };
  const ownShots = mine.size;

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        {nav}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">{eyebrow}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              User guide
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">{intro}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/65">
              <Printer className="h-4 w-4 text-gold" /> Ctrl&nbsp;+&nbsp;P to save as PDF
            </p>
            {ownShots > 0 && (
              <p className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.05] px-4 py-2 text-xs font-semibold text-white/70">
                <ImageIcon className="h-4 w-4 text-gold" /> {ownShots} screenshots from this site
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Contents */}
          <nav className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-white/45">
              Contents
            </p>
            <ol className="mt-3 space-y-3 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="font-semibold text-white/80 hover:text-gold">
                    {s.title}
                  </a>
                  <ul className="mt-1 space-y-1 border-l border-white/10 pl-3">
                    {s.modules.map((m) => (
                      <li key={m.slug}>
                        <a href={`#${m.slug}`} className="text-xs text-white/50 hover:text-gold">
                          {m.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-white/50">{section.blurb}</p>

                <div className="mt-5 space-y-5">
                  {section.modules.map((m) => (
                    <article
                      key={m.slug}
                      id={m.slug}
                      className="scroll-mt-28 rounded-3xl glass p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-lg font-semibold text-white">{m.title}</h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-[0.65rem] font-semibold text-white/55">
                          <MapPin className="h-3 w-3 text-gold" /> {m.where}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/65">{m.purpose}</p>

                      {m.tasks.map((task) => (
                        <div key={task.title} className="mt-5">
                          <h4 className="text-sm font-semibold text-gold">{task.title}</h4>
                          <ol className="mt-2 space-y-2.5">
                            {task.steps.map((step, i) => (
                              <li key={i} className="flex gap-3">
                                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[0.65rem] font-semibold text-white/70">
                                  {i + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm text-white/80">{step.do}</p>
                                  {step.note && (
                                    <p className="mt-0.5 text-xs text-white/45">{step.note}</p>
                                  )}
                                  {(() => {
                                    // Optional per step, and per site: this
                                    // site's shot if it has one, the generic one
                                    // if not, and nothing at all rather than a
                                    // hole in the instructions.
                                    const src = step.shot ? shotSrc(step.shot) : null;
                                    if (!src) return null;
                                    return (
                                      <Image
                                        src={src}
                                        alt={step.do}
                                        width={1200}
                                        height={700}
                                        className="mt-2 w-full rounded-xl border border-white/10"
                                      />
                                    );
                                  })()}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}

                      {m.gotchas && m.gotchas.length > 0 && (
                        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
                          <p className="flex items-center gap-2 text-xs font-semibold text-amber-200/90">
                            <AlertTriangle className="h-3.5 w-3.5" /> Worth knowing
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {m.gotchas.map((g) => (
                              <li key={g} className="text-xs leading-relaxed text-white/60">
                                • {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <p className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/45">
              <BookOpen className="h-4 w-4 shrink-0 text-gold" />
              Something here not match what you see? Tell your platform contact — this guide is part
              of the site, so it is corrected once and every award site gets the fix.
            </p>

            <Link href={backHref} className="inline-block text-sm font-semibold text-gold hover:underline">
              &larr; {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
