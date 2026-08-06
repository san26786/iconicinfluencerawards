import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureTable() {
  return ensureOnce('application_comments', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS application_comments (
        id         serial PRIMARY KEY,
        app_id     int NOT NULL,
        user_id    int NOT NULL,
        user_name  varchar(200),
        comment    text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS app_comments_app_id ON application_comments(app_id)`);
  });
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();
  const { searchParams } = new URL(req.url);
  const appId = Number(searchParams.get('id'));
  if (!appId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { rows } = await query(
    `SELECT id, app_id, user_name, comment, created_at::text AS created_at
     FROM application_comments WHERE app_id = $1 ORDER BY created_at DESC`,
    [appId],
  );
  return NextResponse.json({ comments: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();
  const { app_id, comment } = await req.json() as { app_id: number; comment: string };
  if (!app_id || !comment?.trim()) {
    return NextResponse.json({ error: 'app_id and comment required' }, { status: 400 });
  }

  const authorName = user.email || 'Organiser';
  const { rows } = await query(
    `INSERT INTO application_comments (app_id, user_id, user_name, comment)
     VALUES ($1, $2, $3, $4) RETURNING id, user_name, comment, created_at::text AS created_at`,
    [app_id, user.sub, authorName, comment.trim()],
  );
  return NextResponse.json({ ok: true, comment: rows[0] });
}
