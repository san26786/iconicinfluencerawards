// Fetch the nominations connected to a user: ones they submitted while logged
// in (user_id), ones they submitted by email (nominator_email), and ones where
// they are the nominee (nominee_email). Email matched case-insensitively since
// public nominations can be made without an account.

import { query } from './db';
import type { MyNomination } from '@/components/account/NominationsList';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const fmt = (d: Date | string | null) => (d ? dateFmt.format(new Date(d)) : '—');
const fullName = (a: string | null, b: string | null) => [a, b].filter(Boolean).join(' ');

export async function nominationsForUser(userId: number, email: string): Promise<MyNomination[]> {
  const e = email.toLowerCase();
  const { rows } = await query<{
    id: number;
    user_id: number | null;
    submitted_at: Date | null;
    created_at: Date;
    award_categories: string[] | null;
    self_nominate: boolean;
    nominee_first_name: string | null;
    nominee_last_name: string | null;
    nominee_email: string | null;
    nominator_email: string | null;
  }>(
    `SELECT id, user_id, submitted_at, created_at, award_categories, self_nominate,
            nominee_first_name, nominee_last_name, nominee_email, nominator_email
       FROM nominations
      WHERE (user_id = $1 OR lower(nominator_email) = $2 OR lower(nominee_email) = $2)
        AND deleted_at IS NULL
      ORDER BY created_at DESC`,
    [userId, e],
  );

  return rows.map((n) => {
    const isNominator = n.user_id === userId || n.nominator_email?.toLowerCase() === e;
    const isNominee = n.nominee_email?.toLowerCase() === e;
    return {
      id: n.id,
      nominee: fullName(n.nominee_first_name, n.nominee_last_name) || '—',
      categories: Array.isArray(n.award_categories) ? n.award_categories : [],
      selfNominate: n.self_nominate,
      submitted: fmt(n.submitted_at ?? n.created_at),
      relation: isNominee && !isNominator ? 'You were nominated' : 'You nominated',
    };
  });
}
