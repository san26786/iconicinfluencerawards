// Minimal RFC 4180 CSV reader/writer.
//
// Hand-rolled rather than pulled in as a dependency because the requirement is
// small and the failure mode of a naive `split(',')` is not: category text here
// routinely contains commas ("Recognising agencies whose service, results and
// integrity…"), quotes, and newlines inside eligibility and judging criteria.
// Splitting on commas would silently shred those fields on import.

/**
 * Column layout for category CSVs.
 *
 * Deliberately the SAME columns, in the same order, as the existing per-event
 * category export in components/organiser/ManageEventCategoriesClient.tsx, so a
 * file saved from either screen imports into the other without editing.
 *
 * `slug` is appended rather than inserted: it's the key the hub import matches
 * on, but a file from the older screen won't have it, and the import falls back
 * to matching on name in that case.
 *
 * Lives here rather than in the route because a Next.js route module may only
 * export its handlers and route config — anything else is a build error.
 */
export const CATEGORY_CSV_HEADERS = [
  'name', 'short_name', 'tagline', 'icon', 'theme_name',
  'display_order', 'is_active', 'promo', 'entry_fee',
  'short_summary', 'description', 'eligibility',
  'judging_criteria', 'qualitative_criteria', 'metrics', 'additional_criteria',
  'slug',
];

export type CsvParse = {
  rows: string[][];
  /**
   * True when the file's quoting was broken: a quoted field that never closed,
   * which had to be ended by force so the rest of the file could be read.
   */
  recovered: boolean;
};

export type CsvOptions = {
  /**
   * Force the line-break rule instead of letting the file decide.
   *
   * Leave it unset. The parser reads the file both ways when it has reason to
   * doubt the quoting and keeps whichever produced more well-formed rows —
   * because both kinds of file are real and they are not distinguishable up
   * front. A contact export from one tool has profile summaries running over
   * dozens of lines inside quoted cells; the same-shaped export from another has
   * a stray quote and one line per contact. Guessing wrong either way loses
   * almost everything, and it loses it silently.
   */
  allowMultilineFields?: boolean;
};

/**
 * A quoted cell holding more line breaks than any real paragraph — the signature
 * of a quote that was never closed, swallowing the rows below it.
 */
const RUNAWAY_NEWLINES = 100;

/**
 * Parse CSV text into rows of cells. Handles quotes, "" escapes, CRLF and BOM.
 *
 * TOLERANT OF FILES THAT ARE NOT QUITE CSV, because the files are not quite CSV.
 *
 * A contact export carried a name of a single quote character — `Ta,",Ta …` on
 * line 31,791 of 106,455. Under the ordinary rule, that quote opened a field
 * that never closed, so every line after it was swallowed into one cell: the
 * import wizard read 31,790 rows out of a 106,455-row file, showed no error, and
 * 74,665 contacts were silently not imported. Nothing about the screen suggested
 * anything was missing.
 *
 * Three rules make that survivable:
 *
 *   1. A quote only opens a field at the START of one. `Ibrahim "the great"` is
 *      then read as written rather than as a quoted field beginning mid-cell,
 *      and a closing quote is only closing when a comma, a line ending or the
 *      end of the file follows it — otherwise it is part of the text.
 *
 *   2. When a quoted cell swallows more than a hundred line breaks, the file is
 *      read a second time with line endings closing quoted fields, and whichever
 *      reading produced more rows of the right width is kept. A file whose cells
 *      really do run over many lines — the profile summaries in a contact export
 *      — wins the first reading; a file with a stray quote wins the second. Both
 *      kinds are real, they look alike until read, and guessing wrong loses
 *      almost everything.
 *
 *   3. If a field is still open when the file ends, quoting is not trustworthy
 *      at all, so the file is read again with quotes treated as ordinary
 *      characters.
 *
 * `recovered` is true whenever 2 or 3 had to step in, so a screen can tell
 * somebody their file has a stray quote rather than leave them to notice a
 * shortfall months later.
 */
export function parseCsvWithReport(text: string, opts: CsvOptions = {}): CsvParse {
  const src = text.replace(/^﻿/, '');

  const scan = (honourQuotes: boolean, multiline: boolean) => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    /** True while the current cell has taken no characters yet. */
    let atFieldStart = true;
    /** Quoted fields that had to be closed by a line ending or the file's end. */
    let forced = 0;
    /** The most line breaks any single quoted cell absorbed. */
    let deepest = 0;
    let inCell = 0;

    const endRow = () => {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      atFieldStart = true;
    };

    for (let i = 0; i < src.length; i++) {
      const ch = src[i];

      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') { cell += '"'; i++; continue; }  // escaped quote
          const next = src[i + 1];
          // Closing only when the field is genuinely ending. Anything else is a
          // quote character inside the text.
          if (next === undefined || next === ',' || next === '\r' || next === '\n') {
            inQuotes = false;
            continue;
          }
          cell += ch;
          continue;
        }
        if (ch === '\n' || ch === '\r') {
          if (!multiline) {
            // The quote was never closed on this line. End it here rather than
            // reading the rest of the file into it.
            if (ch === '\r' && src[i + 1] === '\n') i++;
            inQuotes = false;
            forced++;
            endRow();
            continue;
          }
          if (ch === '\n' && ++inCell > deepest) deepest = inCell;
        }
        cell += ch;
        continue;
      }

      if (ch === '"' && honourQuotes && atFieldStart) {
        inQuotes = true;
        atFieldStart = false;
        inCell = 0;
        continue;
      }
      if (ch === ',') { row.push(cell); cell = ''; atFieldStart = true; continue; }
      if (ch === '\r') continue;
      if (ch === '\n') { endRow(); continue; }
      cell += ch;
      atFieldStart = false;
    }

    // Trailing cell/row, unless the file ended cleanly on a newline.
    if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }

    // Drop wholly blank lines — spreadsheets love adding them.
    return {
      rows: rows.filter((r) => r.some((c) => c.trim() !== '')),
      unterminated: inQuotes,
      forced,
      deepest,
    };
  };

  /** Rows of the width the header declares — the ones an import can actually use. */
  const wellFormed = (rows: string[][]) => {
    const width = rows[0]?.length ?? 0;
    return width === 0 ? 0 : rows.filter((r) => r.length === width).length;
  };

  // Asked for explicitly: do that and nothing else.
  if (opts.allowMultilineFields !== undefined) {
    const only = scan(true, opts.allowMultilineFields);
    if (only.unterminated) return { rows: scan(false, false).rows, recovered: true };
    return { rows: only.rows, recovered: only.forced > 0 };
  }

  const rfc = scan(true, true);
  if (rfc.unterminated) {
    // Nothing closed it before the end of the file. Quoting is not trustworthy.
    const perLine = scan(true, false);
    const noQuotes = scan(false, false);
    return wellFormed(perLine.rows) >= wellFormed(noQuotes.rows)
      ? { rows: perLine.rows, recovered: true }
      : { rows: noQuotes.rows, recovered: true };
  }
  if (rfc.deepest <= RUNAWAY_NEWLINES) return { rows: rfc.rows, recovered: false };

  // One cell absorbed more lines than a paragraph ever does. Read it the other
  // way and keep whichever reading yields more usable rows.
  const perLine = scan(true, false);
  return wellFormed(perLine.rows) > wellFormed(rfc.rows)
    ? { rows: perLine.rows, recovered: true }
    : { rows: rfc.rows, recovered: false };
}

/** Parse CSV text into rows of cells. */
export function parseCsv(text: string, opts: CsvOptions = {}): string[][] {
  return parseCsvWithReport(text, opts).rows;
}

/** Parse into objects keyed by the header row, lower-cased and trimmed. */
export function parseCsvObjects(text: string, opts: CsvOptions = {}): Record<string, string>[] {
  const rows = parseCsv(text, opts);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
    return obj;
  });
}

/** Quote a cell only when it needs it, doubling any embedded quotes. */
export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build CSV text from a header list and matching row objects.
 *
 * A repeated heading is dropped rather than written twice. Rows are keyed by
 * heading, so the second copy of a column could only ever hold the same value
 * as the first — but a file with two columns called `phone` is one that Excel's
 * import, Google Sheets and this codebase's own parser each resolve differently.
 * Every export here now appends a shared block of contact columns to its own,
 * and that is exactly how a name gets used twice by accident.
 */
export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const seen = new Set<string>();
  headers = headers.filter((h) => {
    const key = h.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(','));
  // Leading BOM so Excel opens UTF-8 correctly rather than mangling accents.
  return '﻿' + lines.join('\r\n') + '\r\n';
}
