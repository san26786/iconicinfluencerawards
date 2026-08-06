// Forgot-password: issue a single-use reset token (valid 1 hour).
//
// NOTE: email delivery is intentionally NOT wired up yet (the email path is
// being parked, same as the nomination emails). So that the flow is testable
// today, the reset URL is returned in the JSON response **in development only**
// and always logged server-side. In production the response reveals nothing.
// When email is reinstated, send `resetUrl` to the user and stop returning it.

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { randomToken, sha256 } from '@/lib/auth';
import { sendMail } from '@/lib/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const { rows } = await query<{ id: number }>('SELECT id FROM users WHERE email = $1', [email]);
  const user = rows[0];

  let resetUrl: string | null = null;
  if (user) {
    const token = randomToken();
    const tokenHash = sha256(token);
    // 1 hour expiry.
    await query(
      `UPDATE users
       SET reset_token_hash = $1,
           reset_token_expires = now() + interval '1 hour',
           updated_at = now()
       WHERE id = $2`,
      [tokenHash, user.id],
    );
    // x-forwarded-host is the real public hostname Vercel receives (custom domain or .vercel.app)
    const headersList = await headers();
    const proto = headersList.get('x-forwarded-proto') ?? 'https';
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? new URL(req.url).host;
    resetUrl = `${proto}://${host}/reset-password?token=${token}`;
    console.log('[/api/auth/forgot-password] reset link for', email, '→', resetUrl);

    await sendMail({
      to: email,
      subject: 'Reset your password',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#c9a84c;padding:24px 32px;">
          <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;">Reset your password</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#333;">
            We received a request to reset the password for your account. Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:6px;background:#c9a84c;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Reset Password</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:13px;color:#888;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color:#c9a84c;word-break:break-all;">${resetUrl}</a>
          </p>
          <p style="margin:20px 0 0;font-size:12px;color:#aaa;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      text: `Reset your password by visiting:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
      siteId: await getSiteId(),
    });
  }

  // Same shape regardless of whether the email exists (no account enumeration).
  return NextResponse.json({
    ok: true,
    message: 'If an account exists for that email, a reset link has been generated.',
    // Dev convenience only — see note at top of file.
    ...(process.env.NODE_ENV !== 'production' && resetUrl ? { resetUrl } : {}),
  });
}
