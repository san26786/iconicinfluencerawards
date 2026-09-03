// The shape a user guide is written in.
//
// Three guides share it — organiser, nominee and judge — because they are the
// same document written for three different jobs, and a reader who has been an
// entrant and is now a judge should not have to learn a second layout. One set
// of types, one renderer (components/GuideBook.tsx), three content files.

export type Step = {
  /** What to do, in one plain sentence. */
  do: string;
  /** Optional: what happens, or what to watch out for. */
  note?: string;
  /** Optional screenshot, e.g. 'potential-users-filters.jpg'. */
  shot?: string;
};

export type Module = {
  slug: string;
  title: string;
  /** Where it is on screen, so a reader can find it. */
  where: string;
  /** One sentence: what this screen is for. */
  purpose: string;
  tasks: { title: string; steps: Step[] }[];
  /** Things that surprise people. Each one is a real trap, not filler. */
  gotchas?: string[];
};

export type GuideSection = { id: string; title: string; blurb: string; modules: Module[] };
