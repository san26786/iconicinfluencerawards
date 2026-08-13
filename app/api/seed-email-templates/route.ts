import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN = 'seed-email-tpl-iia-2027';

const TEMPLATES = [
  {
    name: 'Application Received',
    subject: 'Your Iconic Influencer Awards application has been received',
    description: 'Sent when an application is first submitted',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#110A1A;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#D946EF;font-size:22px;margin-bottom:8px">Iconic Influencer Awards</h1>
<p>Dear {{first_name}},</p>
<p>Thank you for applying for the <strong>Iconic Influencer Awards</strong>. We have received your application and our team will review it shortly.</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>We will be in touch with further updates. In the meantime, if you have any questions please contact us at <a href="mailto:hello@iconicinfluencerawards.org" style="color:#D946EF">hello@iconicinfluencerawards.org</a>.</p>
<p>Best regards,<br>The Iconic Influencer Awards Team</p>
</div>`,
  },
  {
    name: 'Shortlist Notification',
    subject: 'Congratulations — You have been shortlisted!',
    description: 'Sent when an applicant is moved to shortlist status',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#110A1A;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#D946EF;font-size:22px;margin-bottom:8px">Iconic Influencer Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are delighted to inform you that your application has been <strong style="color:#D946EF">shortlisted</strong> for the Iconic Influencer Awards.</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>Our judging panel will now review shortlisted entries. You will hear from us shortly with further details about the next stage.</p>
<p>Congratulations and best of luck!</p>
<p>Best regards,<br>The Iconic Influencer Awards Team</p>
</div>`,
  },
  {
    name: 'Semi-Finalist Announcement',
    subject: 'You are a Semi-Finalist at the Iconic Influencer Awards!',
    description: 'Sent when an applicant reaches semi-finalist stage',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#110A1A;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#D946EF;font-size:22px;margin-bottom:8px">Iconic Influencer Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are thrilled to announce that you have been selected as a <strong style="color:#D946EF">Semi-Finalist</strong> at the Iconic Influencer Awards!</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>This is a fantastic achievement. Our judges were particularly impressed with your entry. We will be in touch shortly with details about the finalist selection process.</p>
<p>Congratulations!</p>
<p>Best regards,<br>The Iconic Influencer Awards Team</p>
</div>`,
  },
  {
    name: 'Finalist Announcement',
    subject: 'You are a Finalist at the Iconic Influencer Awards!',
    description: 'Sent when an applicant reaches finalist stage',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#110A1A;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#D946EF;font-size:22px;margin-bottom:8px">Iconic Influencer Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are incredibly proud to inform you that you are a <strong style="color:#D946EF">Finalist</strong> at the Iconic Influencer Awards!</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>Please join us for the Awards Ceremony where winners will be announced. Further details about the event will follow shortly.</p>
<p>Warmest congratulations!</p>
<p>Best regards,<br>The Iconic Influencer Awards Team</p>
</div>`,
  },
  {
    name: 'Winner Announcement',
    subject: 'Congratulations — You are a Winner at the Iconic Influencer Awards!',
    description: 'Sent to award winners',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#110A1A;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#D946EF;font-size:22px;margin-bottom:8px">Iconic Influencer Awards</h1>
<p>Dear {{first_name}},</p>
<p style="font-size:18px;color:#D946EF;font-weight:bold">Congratulations — You are a WINNER!</p>
<p>We are absolutely delighted to announce that you have won at the <strong>Iconic Influencer Awards</strong>. Your achievement is a true testament to your excellence and dedication.</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>Your certificate and trophy details will be sent separately. Please do not hesitate to share this wonderful news!</p>
<p>With warmest congratulations,<br>The Iconic Influencer Awards Team</p>
</div>`,
  },
  {
    name: 'Invitation to Apply',
    subject: 'You are invited to apply for the Iconic Influencer Awards',
    description: 'Invitation email for nominated individuals',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#110A1A;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#D946EF;font-size:22px;margin-bottom:8px">Iconic Influencer Awards</h1>
<p>Dear {{first_name}},</p>
<p>You have been nominated for the <strong>Iconic Influencer Awards</strong>. We would love for you to complete your application and take the next step in this prestigious recognition process.</p>
<p>Please visit our website to complete your application: <a href="https://iconicinfluencerawards.org" style="color:#D946EF">iconicinfluencerawards.org</a></p>
<p>If you have any questions, please contact us at <a href="mailto:hello@iconicinfluencerawards.org" style="color:#D946EF">hello@iconicinfluencerawards.org</a>.</p>
<p>We look forward to receiving your application!</p>
<p>Best regards,<br>The Iconic Influencer Awards Team</p>
</div>`,
  },
  {
    name: 'General Update',
    subject: 'An update regarding your Iconic Influencer Awards entry',
    description: 'General purpose update email',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#110A1A;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#D946EF;font-size:22px;margin-bottom:8px">Iconic Influencer Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are writing to provide you with an update regarding your Iconic Influencer Awards entry (Reference: {{ref_number}}).</p>
<p>If you have any questions or need assistance, please do not hesitate to contact us at <a href="mailto:hello@iconicinfluencerawards.org" style="color:#D946EF">hello@iconicinfluencerawards.org</a>.</p>
<p>Best regards,<br>The Iconic Influencer Awards Team</p>
</div>`,
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id            serial PRIMARY KEY,
      name          varchar(200) NOT NULL,
      subject       varchar(500) NOT NULL DEFAULT '',
      html          text NOT NULL DEFAULT '',
      description   text,
      design        jsonb,
      is_system     boolean NOT NULL DEFAULT false,
      deleted_at    timestamptz,
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now()
    )
  `);

  let inserted = 0;
  for (const tpl of TEMPLATES) {
    const existing = await query(
      `SELECT id FROM email_templates WHERE name = $1 AND deleted_at IS NULL LIMIT 1`,
      [tpl.name],
    );
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO email_templates (name, subject, html, description, is_system)
         VALUES ($1, $2, $3, $4, true)`,
        [tpl.name, tpl.subject, tpl.html, tpl.description],
      );
      inserted++;
    }
  }

  const { rows } = await query(
    `SELECT id, name, subject, description FROM email_templates WHERE deleted_at IS NULL ORDER BY name`,
  );

  return NextResponse.json({ ok: true, inserted, total: rows.length, templates: rows });
}
