// Transactional "reset your password" email, sent when an organiser triggers
// a reset for a user. Uses the provider-agnostic sendMail() — which never
// throws and returns ok:false when no email provider is configured, so the
// caller can fall back to surfacing the link directly.

import type { SiteData } from '@/lib/site';
import { getBrandConfig } from './brand';
import { esc } from './render';
import { sendMail, type SendResult } from './send';

export function sendPasswordResetEmail(to: string, resetUrl: string, site?: SiteData): Promise<SendResult> {
  const brand = getBrandConfig(site);
  const name = esc(brand.name);
  const url = esc(resetUrl);

  const html = `<!doctype html><html><body style="margin:0;background:#0b0b12;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 8px;font-size:20px;color:#0b0b12">Reset your password</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#444">
          An organiser at ${name} has started a password reset for your account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <p style="margin:0 0 24px">
          <a href="${url}" style="display:inline-block;background:#caa24a;color:#1a1a1a;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:999px">Reset my password</a>
        </p>
        <p style="margin:0 0 8px;font-size:12px;color:#777">Or paste this link into your browser:</p>
        <p style="margin:0;font-size:12px;word-break:break-all"><a href="${url}" style="color:#8a6d1f">${url}</a></p>
        <p style="margin:24px 0 0;font-size:12px;color:#999">
          If you didn't expect this, you can safely ignore this email — your password won't change until you use the link.
        </p>
      </div>
      <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#666">${name}</p>
    </div>
  </body></html>`;

  const text = `Reset your password\n\nAn organiser at ${brand.name} has started a password reset for your account. Open this link (valid for 1 hour) to choose a new password:\n\n${resetUrl}\n\nIf you didn't expect this, you can ignore this email.`;

  return sendMail({ to, subject: `Reset your ${brand.name} password`, html, text, siteId: site?.id });
}
