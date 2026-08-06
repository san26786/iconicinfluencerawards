import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser, hashPassword, randomToken } from '@/lib/auth';
import { getSite } from '@/lib/site';
import { sendMail } from '@/lib/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const judgeId = Number(id);
  if (!judgeId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json() as { action: 'approve' | 'reject' | 'pending' | 'resend' };
  const site = await getSite();
  const siteId = site.id;

  // Load judge
  const { rows } = await query(
    `SELECT * FROM judges WHERE id = $1 AND site_id = $2 LIMIT 1`,
    [judgeId, siteId],
  );
  const judge = rows[0];
  if (!judge) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.action === 'reject') {
    await query(
      `UPDATE judges SET status='rejected', updated_at=now() WHERE id=$1`,
      [judgeId],
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'pending') {
    await query(
      `UPDATE judges SET status='pending', updated_at=now() WHERE id=$1`,
      [judgeId],
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'approve' || body.action === 'resend') {
    // Generate a random password for the judge
    const plainPassword = randomToken(8); // 8-byte = ~11 chars base64url
    const passwordHash  = await hashPassword(plainPassword);

    // Create or reuse user account with role='judge'
    let judgeUserId: number;
    const { rows: existing } = await query<{ id: number; role: string }>(
      `SELECT id, role FROM users WHERE email = $1 LIMIT 1`,
      [judge.email],
    );

    if (existing.length > 0) {
      judgeUserId = existing[0].id;
      const existingRole = existing[0].role;
      // Never downgrade an organiser/hub-admin account — only update visitors or existing judges
      if (existingRole !== 'organiser') {
        await query(
          `UPDATE users SET role='judge', password_hash=$1, updated_at=now() WHERE id=$2`,
          [passwordHash, judgeUserId],
        );
      }
    } else {
      const { rows: created } = await query<{ id: number }>(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
         VALUES ($1,$2,'judge',$3,$4,$5) RETURNING id`,
        [judge.email, passwordHash, judge.first_name, judge.last_name, judge.phone],
      );
      judgeUserId = created[0].id;
    }

    // Update judge record
    await query(
      `UPDATE judges
          SET status='approved', user_id=$1, approved_at=now(), approved_by=$2, updated_at=now()
        WHERE id=$3`,
      [judgeUserId, user.sub, judgeId],
    );

    // Send login credentials directly — does not depend on a DB email template
    const loginUrl = `https://${site.domain}/login`;
    const firstName = (judge.first_name as string) || '';
    const lastName  = (judge.last_name  as string) || '';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b0a0e;font-family:Inter,Arial,sans-serif;color:#e5e7eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#14111a;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#b8860b,#d4a017,#f0c040);padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#0b0a0e;">${site.name}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#0b0a0e;opacity:0.75;">Judge Application Approved</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;">Dear ${firstName} ${lastName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#9ca3af;">
            Congratulations! Your application to be a judge for <strong style="color:#e5e7eb;">${site.name}</strong> has been approved.
            Your login credentials are below.
          </p>
          <!-- Credentials box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0a0e;border-radius:12px;margin:24px 0;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#d4a017;">Login Credentials</p>
              <p style="margin:0 0 8px;font-size:14px;color:#9ca3af;"><span style="color:#6b7280;">Email:</span>&nbsp;&nbsp;<strong style="color:#e5e7eb;">${judge.email as string}</strong></p>
              <p style="margin:0;font-size:14px;color:#9ca3af;"><span style="color:#6b7280;">Password:</span>&nbsp;&nbsp;<strong style="color:#e5e7eb;font-family:monospace;font-size:16px;letter-spacing:1px;">${plainPassword}</strong></p>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
            Please change your password after your first login. You can access the judge portal at the link below.
          </p>
          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:50px;background:linear-gradient(135deg,#b8860b,#d4a017,#f0c040);">
              <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#0b0a0e;text-decoration:none;">Log In to Judge Portal</a>
            </td></tr>
          </table>
          <p style="margin:32px 0 0;font-size:13px;color:#6b7280;">
            If the button above does not work, copy and paste this URL into your browser:<br>
            <a href="${loginUrl}" style="color:#d4a017;">${loginUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid #1f1b2e;padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#4b5563;">&copy; ${site.name}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    const text = `Dear ${firstName} ${lastName},\n\nYour judge application for ${site.name} has been approved.\n\nLogin credentials:\nEmail: ${judge.email as string}\nPassword: ${plainPassword}\n\nPlease log in at: ${loginUrl}\n\nChange your password after your first login.\n\n${site.name}`;

    const emailResult = await sendMail({
      to:      judge.email as string,
      subject: `Your judge application has been approved — ${site.name}`,
      html,
      text,
      siteId,
    });

    if (!emailResult.ok) {
      console.error('[judge-approve] email send failed:', emailResult.error);
    }

    return NextResponse.json({ ok: true, userId: judgeUserId });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const { id: siteId } = await getSite();
  try {
    await query(`DELETE FROM judges WHERE id=$1 AND site_id=$2`, [Number(id), siteId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
