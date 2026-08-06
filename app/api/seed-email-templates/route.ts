import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN = 'seed-email-tpl-pea-2027';

const TEMPLATES = [
  {
    name: 'Application Received',
    subject: 'Your Property Excellence Awards application has been received',
    description: 'Sent when an application is first submitted',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1424;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#FFAD24;font-size:22px;margin-bottom:8px">Property Excellence Awards</h1>
<p>Dear {{first_name}},</p>
<p>Thank you for applying for the <strong>Property Excellence Awards</strong>. We have received your application and our team will review it shortly.</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>We will be in touch with further updates. In the meantime, if you have any questions please contact us at <a href="mailto:info@propertyexcellenceawards.org" style="color:#FFAD24">info@propertyexcellenceawards.org</a>.</p>
<p>Best regards,<br>The Property Excellence Awards Team</p>
</div>`,
  },
  {
    name: 'Shortlist Notification',
    subject: 'Congratulations — You have been shortlisted!',
    description: 'Sent when an applicant is moved to shortlist status',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1424;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#FFAD24;font-size:22px;margin-bottom:8px">Property Excellence Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are delighted to inform you that your application has been <strong style="color:#FFAD24">shortlisted</strong> for the Property Excellence Awards.</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>Our judging panel will now review shortlisted entries. You will hear from us shortly with further details about the next stage.</p>
<p>Congratulations and best of luck!</p>
<p>Best regards,<br>The Property Excellence Awards Team</p>
</div>`,
  },
  {
    name: 'Semi-Finalist Announcement',
    subject: 'You are a Semi-Finalist at the Property Excellence Awards!',
    description: 'Sent when an applicant reaches semi-finalist stage',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1424;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#FFAD24;font-size:22px;margin-bottom:8px">Property Excellence Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are thrilled to announce that you have been selected as a <strong style="color:#FFAD24">Semi-Finalist</strong> at the Property Excellence Awards!</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>This is a fantastic achievement. Our judges were particularly impressed with your entry. We will be in touch shortly with details about the finalist selection process.</p>
<p>Congratulations!</p>
<p>Best regards,<br>The Property Excellence Awards Team</p>
</div>`,
  },
  {
    name: 'Finalist Announcement',
    subject: 'You are a Finalist at the Property Excellence Awards!',
    description: 'Sent when an applicant reaches finalist stage',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1424;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#FFAD24;font-size:22px;margin-bottom:8px">Property Excellence Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are incredibly proud to inform you that you are a <strong style="color:#FFAD24">Finalist</strong> at the Property Excellence Awards!</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>Please join us for the Awards Ceremony where winners will be announced. Further details about the event will follow shortly.</p>
<p>Warmest congratulations!</p>
<p>Best regards,<br>The Property Excellence Awards Team</p>
</div>`,
  },
  {
    name: 'Winner Announcement',
    subject: 'Congratulations — You are a Winner at the Property Excellence Awards!',
    description: 'Sent to award winners',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1424;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#FFAD24;font-size:22px;margin-bottom:8px">Property Excellence Awards</h1>
<p>Dear {{first_name}},</p>
<p style="font-size:18px;color:#FFAD24;font-weight:bold">Congratulations — You are a WINNER!</p>
<p>We are absolutely delighted to announce that you have won at the <strong>Property Excellence Awards</strong>. Your achievement is a true testament to your excellence and dedication.</p>
<p><strong>Reference:</strong> {{ref_number}}</p>
<p>Your certificate and trophy details will be sent separately. Please do not hesitate to share this wonderful news!</p>
<p>With warmest congratulations,<br>The Property Excellence Awards Team</p>
</div>`,
  },
  {
    name: 'Invitation to Apply',
    subject: 'You are invited to apply for the Property Excellence Awards',
    description: 'Invitation email for nominated individuals',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1424;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#FFAD24;font-size:22px;margin-bottom:8px">Property Excellence Awards</h1>
<p>Dear {{first_name}},</p>
<p>You have been nominated for the <strong>Property Excellence Awards</strong>. We would love for you to complete your application and take the next step in this prestigious recognition process.</p>
<p>Please visit our website to complete your application: <a href="https://propertyexcellenceawards.org" style="color:#FFAD24">propertyexcellenceawards.org</a></p>
<p>If you have any questions, please contact us at <a href="mailto:info@propertyexcellenceawards.org" style="color:#FFAD24">info@propertyexcellenceawards.org</a>.</p>
<p>We look forward to receiving your application!</p>
<p>Best regards,<br>The Property Excellence Awards Team</p>
</div>`,
  },
  {
    name: 'General Update',
    subject: 'An update regarding your Property Excellence Awards entry',
    description: 'General purpose update email',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1424;color:#ffffff;padding:32px;border-radius:12px">
<h1 style="color:#FFAD24;font-size:22px;margin-bottom:8px">Property Excellence Awards</h1>
<p>Dear {{first_name}},</p>
<p>We are writing to provide you with an update regarding your Property Excellence Awards entry (Reference: {{ref_number}}).</p>
<p>If you have any questions or need assistance, please do not hesitate to contact us at <a href="mailto:info@propertyexcellenceawards.org" style="color:#FFAD24">info@propertyexcellenceawards.org</a>.</p>
<p>Best regards,<br>The Property Excellence Awards Team</p>
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
