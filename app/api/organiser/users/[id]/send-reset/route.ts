// Organiser-only: issue a single-use password-reset token for a user and email
// them the link (1 hour expiry). If no email provider is configured the send
// fails gracefully and we return the link so the organiser can pass it on.

import { NextResponse } from 'next/server';
import { getSessionUser, randomToken, sha256 } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSite } from '@/lib/site';
import { sendPasswordResetEmail } from '@/lib/email/password-reset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const { rows } = await query<{ email: string }>('SELECT email FROM users WHERE id = $1', [numId]);
  const user = rows[0];
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const token = randomToken();
  await query(
    `UPDATE users
       SET reset_token_hash = $1, reset_token_expires = now() + interval '1 hour', updated_at = now()
     WHERE id = $2`,
    [sha256(token), numId],
  );

  const origin = new URL(req.url).origin;
  const resetUrl = `${origin}/reset-password?token=${token}`;

  const site = await getSite();
  const result = await sendPasswordResetEmail(user.email, resetUrl, site);
  const emailed = result.ok;
  if (!emailed) {
    console.log('[organiser/send-reset] email not sent, link for', user.email, '→', resetUrl);
  }

  return NextResponse.json({
    ok: true,
    emailed,
    email: user.email,
    message: emailed
      ? `A reset link has been emailed to ${user.email}.`
      : 'Email delivery is not configured — share the link below with the user.',
    // Surfaced when the email could not be sent (e.g. provider not set up).
    ...(emailed ? {} : { resetUrl }),
  });
}
