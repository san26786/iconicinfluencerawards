// The name a downloaded file arrives with.
//
// "nominations-2026-09-02.csv" says nothing about which of twenty award sites
// it came from, and an organiser who runs several ends the week with a
// downloads folder of files they cannot tell apart. Every export now leads with
// the site: "cardiff-excellence-awards-nominations-2026-09-02.csv" — which is
// how the visitors export has always named its files, now used everywhere.

/** A filename-safe version of a site's slug or name. */
export function siteSlug(site: string | null | undefined): string {
  const slug = (site ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // A site with no usable name still gets a file, just an anonymous one.
  return slug || 'site';
}

/**
 * `<site>-<what>-<today>.csv`.
 *
 * The date is the day of the download rather than of the data: two exports of a
 * moving list on the same day are the same question asked twice, and the
 * browser's "(1)" suffix is a good enough way to tell them apart.
 */
export function exportFilename(site: string | null | undefined, what: string): string {
  return `${siteSlug(site)}-${what}-${new Date().toISOString().slice(0, 10)}.csv`;
}
