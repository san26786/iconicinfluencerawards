// Applies a provider delivery/engagement event (from a Resend or Mailgun
// webhook) to the matching recipient: updates status, writes an event row, and
// adds a suppression for bounces / complaints / unsubscribes so we never email
// that address again.
//
// Recipients are matched by provider message id first, falling back to the most
// recent row for that email address (handles any id-format mismatch).

import { query } from '@/lib/db';

export type DeliveryEvent = 'delivered' | 'bounced' | 'complained' | 'unsubscribed';

const norm = (id: string | null | undefined) => (id || '').replace(/^<|>$/g, '').trim();

async function findRecipient(
  messageId?: string | null,
  email?: string | null,
): Promise<{ id: number; job_id: number; email: string } | null> {
  const mid = norm(messageId);
  if (mid) {
    const { rows } = await query<{ id: number; job_id: number; email: string }>(
      `SELECT id, job_id, email FROM email_recipients
        WHERE replace(replace(provider_message_id,'<',''),'>','') = $1
        ORDER BY id DESC LIMIT 1`,
      [mid],
    );
    if (rows[0]) return rows[0];
  }
  const e = (email || '').trim().toLowerCase();
  if (e) {
    const { rows } = await query<{ id: number; job_id: number; email: string }>(
      `SELECT id, job_id, email FROM email_recipients WHERE email=$1 ORDER BY id DESC LIMIT 1`,
      [e],
    );
    if (rows[0]) return rows[0];
  }
  return null;
}

export async function applyDeliveryEvent(
  type: DeliveryEvent,
  opts: { messageId?: string | null; email?: string | null },
): Promise<boolean> {
  const r = await findRecipient(opts.messageId, opts.email);
  if (!r) return false;

  // Delivery outcomes overwrite send status; unsubscribe is engagement-only.
  if (type === 'delivered') {
    await query(
      `UPDATE email_recipients SET status='delivered', delivered_at=now(), updated_at=now() WHERE id=$1`,
      [r.id],
    );
  } else if (type === 'bounced') {
    await query(
      `UPDATE email_recipients SET status='bounced', bounced_at=now(), updated_at=now() WHERE id=$1`,
      [r.id],
    );
  } else if (type === 'complained') {
    await query(`UPDATE email_recipients SET status='complained', updated_at=now() WHERE id=$1`, [r.id]);
  }

  await query(`INSERT INTO email_events (recipient_id, job_id, type) VALUES ($1, $2, $3)`, [
    r.id,
    r.job_id,
    type,
  ]);

  if (type === 'bounced' || type === 'complained' || type === 'unsubscribed') {
    const reason = type === 'unsubscribed' ? 'unsubscribed' : type;
    await query(
      `INSERT INTO email_suppressions (email, reason, job_id) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET deleted_at = NULL`,
      [r.email, reason, r.job_id],
    );
  }
  return true;
}
