import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpDown, Info } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { RecipientPreview } from '@/components/organiser/RecipientPreview';
import { RecipientDateFilter, type RangeKey } from '@/components/organiser/RecipientDateFilter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaign stats' };

const PAGE_SIZE = 50;
const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const fmt = (d: Date | string | null) => (d ? dateFmt.format(new Date(d)) : '-');
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const rate = (n: number, d: number) => {
  if (d <= 0) return '0%';
  const value = ((n / d) * 100).toFixed(1);
  return `${value.endsWith('.0') ? value.slice(0, -2) : value}%`;
};

const FILTERS = {
  all: '',
  accepted: "er.status IN ('sent','delivered','bounced','complained')",
  delivered: "er.status = 'delivered'",
  opened: 'er.opened_at IS NOT NULL',
  clicked: 'er.clicked_at IS NOT NULL',
  bounced: "er.status = 'bounced'",
  complained: "er.status = 'complained'",
  unsubscribed:
    "EXISTS (SELECT 1 FROM email_events ue WHERE ue.recipient_id = er.id AND ue.type = 'unsubscribed')",
  failed: "er.status IN ('failed','skipped')",
  remaining: "er.status IN ('pending','sending')",
} as const;

const SORTS = {
  email: 'er.email',
  status: 'er.status',
  opens: 'er.open_count',
  clicks: 'er.click_count',
  links: 'er.clicked_at',
  sent: 'er.sent_at',
} as const;

type FilterKey = keyof typeof FILTERS;
type SortKey = keyof typeof SORTS;
type Direction = 'asc' | 'desc';
type ClickedLink = { url: string; count: number };

// Default ordering: most recently sent first.
const DEFAULT_SORT: SortKey = 'sent';
const DEFAULT_DIR: Direction = 'desc';

const RANGES: RangeKey[] = ['today', 'yesterday', '7d', '30d', 'all', 'custom'];
function cleanRange(v?: string): RangeKey {
  return v && (RANGES as string[]).includes(v) ? (v as RangeKey) : 'today';
}
function cleanDate(v?: string): string {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
}

// Predicate that narrows the recipient LIST to those sent within the chosen
// range, evaluated in UK local time so "today" matches the organiser's day.
// `startIndex` is the count of params already bound before this clause's $N.
// Returns a clause prefixed with " AND " (or "" for all time / no dates).
function sentDateClause(
  range: RangeKey,
  from: string,
  to: string,
  startIndex: number,
): { sql: string; params: string[] } {
  const day = "(er.sent_at AT TIME ZONE 'Europe/London')::date";
  const today = "(now() AT TIME ZONE 'Europe/London')::date";
  switch (range) {
    case 'all':
      return { sql: '', params: [] };
    case 'yesterday':
      return { sql: ` AND ${day} = ${today} - 1`, params: [] };
    case '7d':
      return { sql: ` AND ${day} >= ${today} - 6`, params: [] };
    case '30d':
      return { sql: ` AND ${day} >= ${today} - 29`, params: [] };
    case 'custom': {
      const params: string[] = [];
      const parts: string[] = [];
      if (from) { params.push(from); parts.push(`${day} >= $${startIndex + params.length}`); }
      if (to) { params.push(to); parts.push(`${day} <= $${startIndex + params.length}`); }
      return { sql: parts.length ? ` AND ${parts.join(' AND ')}` : '', params };
    }
    case 'today':
    default:
      return { sql: ` AND ${day} = ${today}`, params: [] };
  }
}

function cleanFilter(v?: string): FilterKey {
  return v && v in FILTERS ? (v as FilterKey) : 'all';
}

function cleanSort(v?: string): SortKey {
  return v && v in SORTS ? (v as SortKey) : DEFAULT_SORT;
}

function cleanDirection(v?: string): Direction {
  // Only an explicit param overrides the default; absent ⇒ the default for the
  // initial (sent-desc) view. Column-header clicks always pass dir explicitly.
  return v === 'asc' ? 'asc' : v === 'desc' ? 'desc' : DEFAULT_DIR;
}

type ViewState = {
  filter: FilterKey;
  sort: SortKey;
  dir: Direction;
  range: RangeKey;
  from: string;
  to: string;
};

function urlFor(
  jobId: number,
  current: ViewState,
  next: Partial<{ page: number; filter: FilterKey; sort: SortKey; dir: Direction }>,
) {
  const filter = next.filter ?? current.filter;
  const sort = next.sort ?? current.sort;
  const dir = next.dir ?? current.dir;
  const page = next.page ?? 1;
  const qs = new URLSearchParams();
  if (page > 1) qs.set('page', String(page));
  if (filter !== 'all') qs.set('filter', filter);
  if (sort !== DEFAULT_SORT) qs.set('sort', sort);
  if (dir !== DEFAULT_DIR) qs.set('dir', dir);
  // Preserve the active date range so changing status/sort/page doesn't reset it.
  if (current.range !== 'today') qs.set('range', current.range);
  if (current.range === 'custom') {
    if (current.from) qs.set('from', current.from);
    if (current.to) qs.set('to', current.to);
  }
  const s = qs.toString();
  return `/organiser/email-jobs/${jobId}${s ? `?${s}` : ''}`;
}

function linkLabel(raw: string) {
  try {
    const u = new URL(raw);
    const path = `${u.pathname}${u.search}`.replace(/\/$/, '') || '/';
    return `${u.hostname}${path}`;
  } catch {
    return raw;
  }
}

function rangeLabel(range: RangeKey): string {
  switch (range) {
    case 'today': return 'today';
    case 'yesterday': return 'yesterday';
    case '7d': return 'in the last 7 days';
    case '30d': return 'in the last 30 days';
    case 'custom': return 'in the selected range';
    default: return '';
  }
}

type Card = { label: string; value: string; sub?: string; filter: FilterKey };
type EngageRow =
  | { opened_unique: string; opens_total: string; clicked_unique: string; clicks_total: string }
  | undefined;

// Turn a job's status counts + engagement + unsubscribes into the stat tiles.
// Used for both the whole-campaign row and the date-scoped row, so they stay
// identical in shape and labels. `recipientsTotal` is the "% of list" base.
function buildCards(
  statusRows: { status: string; n: string }[],
  engage: EngageRow,
  unsub: number,
  recipientsTotal: number,
): Card[] {
  const sc: Record<string, number> = {};
  for (const r of statusRows) sc[r.status] = Number(r.n);
  const openedUnique = Number(engage?.opened_unique ?? 0);
  const clickedUnique = Number(engage?.clicked_unique ?? 0);
  const opensTotal = Number(engage?.opens_total ?? 0);
  const clicksTotal = Number(engage?.clicks_total ?? 0);
  const delivered = sc.delivered ?? 0;
  const accepted = (sc.sent ?? 0) + delivered + (sc.bounced ?? 0) + (sc.complained ?? 0);
  const remaining = (sc.pending ?? 0) + (sc.sending ?? 0);
  return [
    { label: 'Recipients', value: String(recipientsTotal), filter: 'all' },
    { label: 'Accepted', value: String(accepted), sub: `${pct(accepted, recipientsTotal)}% of list`, filter: 'accepted' },
    { label: 'Delivered', value: String(delivered), sub: 'confirmed (Resend/Mailgun)', filter: 'delivered' },
    { label: 'Opened', value: String(opensTotal), sub: 'total opens (incl. repeats)', filter: 'opened' },
    { label: 'Unique opened', value: String(openedUnique), sub: `${pct(openedUnique, accepted)}% of accepted`, filter: 'opened' },
    { label: 'Open rate', value: rate(openedUnique, accepted), sub: `${openedUnique} unique of ${accepted} accepted`, filter: 'opened' },
    { label: 'Clicked', value: String(clickedUnique), sub: `${pct(clickedUnique, accepted)}% - ${clicksTotal} total`, filter: 'clicked' },
    { label: 'Click rate', value: rate(clickedUnique, accepted), sub: `${clickedUnique} unique of ${accepted} accepted`, filter: 'clicked' },
    { label: 'Bounced', value: String(sc.bounced ?? 0), filter: 'bounced' },
    { label: 'Complaints', value: String(sc.complained ?? 0), filter: 'complained' },
    { label: 'Unsubscribed', value: String(unsub), filter: 'unsubscribed' },
    { label: 'Unsubscribe rate', value: rate(unsub, accepted), sub: `${unsub} of ${accepted} accepted`, filter: 'unsubscribed' },
    { label: 'Failed', value: String((sc.failed ?? 0) + (sc.skipped ?? 0)), filter: 'failed' },
    { label: 'Remaining', value: String(remaining), filter: 'remaining' },
  ];
}

export default async function CampaignStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; filter?: string; sort?: string; dir?: string; range?: string; from?: string; to?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id } = await params;
  const sp = await searchParams;
  const jobId = Number(id);
  if (!Number.isInteger(jobId)) notFound();

  const page = Math.max(1, Number(sp.page) || 1);
  const filter = cleanFilter(sp.filter);
  const sort = cleanSort(sp.sort);
  const dir = cleanDirection(sp.dir);
  const range = cleanRange(sp.range);
  const from = cleanDate(sp.from);
  const to = cleanDate(sp.to);
  const state: ViewState = { filter, sort, dir, range, from, to };

  const jobRes = await query<{
    id: number;
    name: string | null;
    status: string;
    total: number;
    created_at: Date;
  }>('SELECT id, name, status, total, created_at FROM email_jobs WHERE id = $1', [jobId]);
  const job = jobRes.rows[0];
  if (!job) notFound();

  const filterSql = FILTERS[filter];
  // Date range narrows only the recipient LIST (and its count) — bound after $1.
  const dateF = sentDateClause(range, from, to, 1);
  const whereSql = `WHERE er.job_id = $1${filterSql ? ` AND (${filterSql})` : ''}${dateF.sql}`;
  const orderSql = `${SORTS[sort]} ${dir.toUpperCase()} NULLS LAST, er.id ASC`;
  // LIMIT/OFFSET placeholders sit after jobId + any date params.
  const limitIdx = 2 + dateF.params.length;
  const offsetIdx = 3 + dateF.params.length;

  const [statusRes, engageRes, unsubRes, filteredTotalRes, recipRes] = await Promise.all([
    query<{ status: string; n: string }>(
      'SELECT status, count(*) AS n FROM email_recipients WHERE job_id=$1 GROUP BY status',
      [jobId],
    ),
    query<{ opened_unique: string; opens_total: string; clicked_unique: string; clicks_total: string }>(
      `SELECT
         count(*) FILTER (WHERE opened_at IS NOT NULL)  AS opened_unique,
         COALESCE(sum(open_count),0)                    AS opens_total,
         count(*) FILTER (WHERE clicked_at IS NOT NULL) AS clicked_unique,
         COALESCE(sum(click_count),0)                   AS clicks_total
       FROM email_recipients WHERE job_id=$1`,
      [jobId],
    ),
    query<{ n: string }>(
      `SELECT count(DISTINCT recipient_id) AS n
         FROM email_events
        WHERE job_id=$1 AND type='unsubscribed'`,
      [jobId],
    ),
    query<{ n: string }>(
      `SELECT count(*) AS n FROM email_recipients er ${whereSql}`,
      [jobId, ...dateF.params],
    ),
    query<{
      id: number;
      email: string;
      status: string;
      open_count: number;
      click_count: number;
      clicked_links: ClickedLink[];
      sent_at: Date | null;
      error: string | null;
    }>(
      `SELECT er.id, er.email, er.status, er.open_count, er.click_count,
              COALESCE(link_stats.links, '[]'::jsonb) AS clicked_links,
              er.sent_at, er.error
         FROM email_recipients er
         LEFT JOIN LATERAL (
           SELECT jsonb_agg(jsonb_build_object('url', x.url, 'count', x.n) ORDER BY x.n DESC, x.url) AS links
             FROM (
               SELECT url, count(*)::int AS n
                 FROM email_events
                WHERE recipient_id = er.id
                  AND job_id = $1
                  AND type = 'clicked'
                  AND url IS NOT NULL
                GROUP BY url
             ) x
         ) link_stats ON true
        ${whereSql}
        ORDER BY ${orderSql}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [jobId, ...dateF.params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    ),
  ]);

  const filteredTotal = Number(filteredTotalRes.rows[0]?.n ?? 0);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  // Top row: whole-campaign totals.
  const cards = buildCards(statusRes.rows, engageRes.rows[0], Number(unsubRes.rows[0]?.n ?? 0), job.total);

  // Per sending-account breakdown — only populated for multi-mailbox SMTP
  // sends, so the section stays hidden for single-account / API-provider jobs.
  const acctRes = await query<{ account: string; n: string }>(
    `SELECT sent_account AS account, count(*) AS n
       FROM email_recipients
      WHERE job_id = $1 AND sent_account IS NOT NULL AND sent_account <> ''
      GROUP BY sent_account
      ORDER BY n DESC, sent_account`,
    [jobId],
  );
  const accountRows = acctRes.rows.map((r) => ({ account: r.account, n: Number(r.n) }));
  const accountTotal = accountRows.reduce((s, r) => s + r.n, 0);

  // Second row: the same metrics restricted to recipients SENT within the chosen
  // range. Skipped for "all time" (it would just duplicate the top row).
  let scopedCards: Card[] | null = null;
  if (range !== 'all') {
    const dw = `WHERE er.job_id = $1${dateF.sql}`;
    const dp = [jobId, ...dateF.params];
    const [s2, e2, u2] = await Promise.all([
      query<{ status: string; n: string }>(
        `SELECT er.status AS status, count(*) AS n FROM email_recipients er ${dw} GROUP BY er.status`,
        dp,
      ),
      query<{ opened_unique: string; opens_total: string; clicked_unique: string; clicks_total: string }>(
        `SELECT
           count(*) FILTER (WHERE er.opened_at IS NOT NULL)  AS opened_unique,
           COALESCE(sum(er.open_count),0)                    AS opens_total,
           count(*) FILTER (WHERE er.clicked_at IS NOT NULL) AS clicked_unique,
           COALESCE(sum(er.click_count),0)                   AS clicks_total
         FROM email_recipients er ${dw}`,
        dp,
      ),
      query<{ n: string }>(
        `SELECT count(DISTINCT ev.recipient_id) AS n
           FROM email_events ev
           JOIN email_recipients er ON er.id = ev.recipient_id
          WHERE ev.job_id = $1 AND ev.type = 'unsubscribed'${dateF.sql}`,
        dp,
      ),
    ]);
    const scopedTotal = s2.rows.reduce((sum, r) => sum + Number(r.n), 0);
    scopedCards = buildCards(s2.rows, e2.rows[0], Number(u2.rows[0]?.n ?? 0), scopedTotal);
  }

  const sortHeader = (key: SortKey, label: string, align = 'left') => {
    const nextDir: Direction = sort === key && dir === 'asc' ? 'desc' : 'asc';
    return (
      <th className={`px-5 py-4 font-semibold ${align === 'right' ? 'text-right' : ''}`}>
        <Link
          href={urlFor(job.id, state, { sort: key, dir: nextDir })}
          className={`inline-flex items-center gap-1.5 hover:text-gold ${align === 'right' ? 'justify-end' : ''}`}
        >
          {label}
          <ArrowUpDown className="h-3.5 w-3.5" />
        </Link>
      </th>
    );
  };

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <Link href="/organiser/email-jobs" className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Back to Send Queue
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
          {job.name || `Job #${job.id}`}
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Queued {fmt(job.created_at)} - status <span className="text-white/80">{job.status}</span>
        </p>

        <div className="mt-6">
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">Whole campaign</p>
          <StatGrid cards={cards} jobId={job.id} state={state} activeFilter={filter} />
        </div>

        {accountRows.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
              Sending accounts <span className="text-white/30">· {accountRows.length} mailbox{accountRows.length === 1 ? '' : 'es'}, {accountTotal} sent</span>
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {accountRows.map((a) => (
                <div key={a.account} className="rounded-2xl glass p-4">
                  <p className="truncate font-display text-2xl font-semibold text-white" title={a.account}>{a.n}</p>
                  <p className="mt-0.5 truncate text-[0.7rem] text-white/55" title={a.account}>{a.account}</p>
                  <p className="mt-0.5 text-[0.7rem] text-gold/80">{pct(a.n, accountTotal)}% of sent</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/55">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
          <span>
            The top tiles show whole-campaign totals; the tiles under the date filter cover the selected date
            range. Click any tile to filter the recipient list, and any column header to sort. Opens are
            approximate; clicks are the reliable signal. Delivered, bounced and complaints come from Resend or
            Mailgun only.
          </span>
        </div>

        <div className="mt-4">
          <RecipientDateFilter />
        </div>

        {scopedCards && (
          <div className="mt-4">
            <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-gold/80">
              Sent {rangeLabel(range)}
            </p>
            <StatGrid cards={scopedCards} jobId={job.id} state={state} activeFilter={filter} />
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-3xl glass">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-white/45">
                  {sortHeader('email', 'Email')}
                  {sortHeader('status', 'Status')}
                  {sortHeader('opens', 'Opens')}
                  {sortHeader('clicks', 'Clicks')}
                  {sortHeader('links', 'Clicked links')}
                  {sortHeader('sent', 'Sent')}
                  <th className="px-5 py-4 text-right font-semibold">Preview</th>
                </tr>
              </thead>
              <tbody>
                {recipRes.rows.map((r, i) => (
                  <tr key={`${r.email}-${i}`} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-5 py-3 text-white/80">{r.email}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} error={r.error} /></td>
                    <td className="px-5 py-3 text-white/60">{r.open_count || '-'}</td>
                    <td className="px-5 py-3 text-white/60">{r.click_count || '-'}</td>
                    <td className="max-w-[280px] px-5 py-3 text-white/60">
                      {r.clicked_links.length === 0 ? (
                        '-'
                      ) : (
                        <div className="space-y-1">
                          {r.clicked_links.map((l) => (
                            <div key={l.url} className="truncate" title={l.url}>
                              <span className="text-white/80">{linkLabel(l.url)}</span>
                              {l.count > 1 && <span className="text-white/40"> x{l.count}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-white/50">{fmt(r.sent_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <RecipientPreview jobId={job.id} recipientId={r.id} email={r.email} />
                    </td>
                  </tr>
                ))}
                {recipRes.rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-white/50">
                      {range === 'all'
                        ? 'No recipients match this filter.'
                        : 'No recipients were sent in this date range — try “All time” above.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {(totalPages > 1 || filter !== 'all' || range !== 'all') && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
            <span>
              Showing {filteredTotal} recipient{filteredTotal === 1 ? '' : 's'}
              {filter !== 'all' ? ` for ${filter}` : ''}
              {range !== 'all' ? ` (${range === 'custom' ? 'custom range' : range})` : ''} - page {Math.min(page, totalPages)} of {totalPages}
            </span>
            <div className="flex gap-2">
              {filter !== 'all' && (
                <Link
                  href={urlFor(job.id, state, { filter: 'all' })}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-white/75 transition-colors hover:border-gold/40 hover:text-white"
                >
                  Clear filter
                </Link>
              )}
              <PageLink href={urlFor(job.id, state, { page: page - 1 })} disabled={page <= 1} label="Prev" />
              <PageLink href={urlFor(job.id, state, { page: page + 1 })} disabled={page >= totalPages} label="Next" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatGrid({
  cards,
  jobId,
  state,
  activeFilter,
}: {
  cards: Card[];
  jobId: number;
  state: ViewState;
  activeFilter: FilterKey;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => {
        const active = activeFilter === c.filter;
        return (
          <Link
            key={c.label}
            href={urlFor(jobId, state, { filter: c.filter })}
            className={`rounded-2xl glass p-4 transition-colors hover:border-gold/40 ${
              active ? 'border-gold/60 bg-gold/[0.08]' : ''
            }`}
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-white/45">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{c.value}</p>
            {c.sub && <p className="mt-0.5 text-[0.7rem] text-white/45">{c.sub}</p>}
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ status, error }: { status: string; error: string | null }) {
  const map: Record<string, string> = {
    delivered: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    sent: 'border-gold/40 bg-gold/10 text-white',
    pending: 'border-white/15 text-white/55',
    sending: 'border-white/15 text-white/55',
    bounced: 'border-red-400/40 bg-red-500/10 text-red-200',
    complained: 'border-red-400/40 bg-red-500/10 text-red-200',
    failed: 'border-red-400/40 bg-red-500/10 text-red-200',
    skipped: 'border-white/15 text-white/45',
  };
  return (
    <span
      title={error ?? undefined}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${map[status] ?? 'border-white/15 text-white/55'}`}
    >
      {status}
    </span>
  );
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  if (disabled) {
    return <span className="rounded-lg border border-white/10 px-3 py-1.5 text-white/30">{label}</span>;
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-white/75 transition-colors hover:border-gold/40 hover:text-white"
    >
      {label}
    </Link>
  );
}
