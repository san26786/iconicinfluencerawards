// Public listings for the shortlist / semifinalist / finalist / winner pages.
//
// The organiser sets is_shortlisted / is_semifinalist / is_finalist / is_winner
// on nominations from Manage Award Night. Each stage is cumulative in practice
// (a finalist was also a semifinalist), so each page filters on its own flag
// only and shows the entrants who reached at least that stage.
//
// Nothing here exposes contact details — only the public-facing business name,
// the person's name where the entry is an individual, and the categories.

import { query } from './db';

export type Stage = 'shortlisted' | 'semifinalist' | 'finalist' | 'winner';

export type PublicNominee = {
  id: number;
  name: string;
  business: string | null;
  categories: string[];
};

const FLAG: Record<Stage, string> = {
  shortlisted: 'is_shortlisted',
  semifinalist: 'is_semifinalist',
  finalist: 'is_finalist',
  winner: 'is_winner',
};

const fullName = (a: string | null, b: string | null) =>
  [a, b].filter(Boolean).join(' ').trim();

/**
 * Everyone at the given stage for this site, ordered by score then name.
 *
 * Returns [] rather than throwing when the table or the is_winner column
 * doesn't exist yet — these pages must still render "to be announced" on a
 * fresh database instead of 500ing.
 */
export async function nomineesAtStage(
  siteId: number,
  stage: Stage,
): Promise<PublicNominee[]> {
  try {
    const { rows } = await query<{
      id: number;
      nominee_first_name: string | null;
      nominee_last_name: string | null;
      nominee_organisation: string | null;
      business_name: string | null;
      award_categories: string[] | null;
    }>(
      `SELECT id, nominee_first_name, nominee_last_name, nominee_organisation,
              business_name, award_categories
         FROM nominations
        WHERE site_id = $1
          AND deleted_at IS NULL
          AND ${FLAG[stage]} = true
        ORDER BY avg_score DESC NULLS LAST, nominee_organisation, nominee_last_name`,
      [siteId],
    );

    return rows.map((r) => ({
      id: r.id,
      name:
        fullName(r.nominee_first_name, r.nominee_last_name) ||
        r.nominee_organisation ||
        r.business_name ||
        'Entry',
      business: r.nominee_organisation ?? r.business_name,
      categories: r.award_categories ?? [],
    }));
  } catch {
    return [];
  }
}
