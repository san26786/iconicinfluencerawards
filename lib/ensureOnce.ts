// Per-process memoizer for self-healing schema migrations.
//
// Historically each page/route ran its `CREATE TABLE IF NOT EXISTS` / `ALTER
// TABLE ... IF NOT EXISTS` block on EVERY request — including Next.js background
// prefetch requests. On a cold serverless Postgres connection that meant a
// 3-5s stall per page and intermittent 503s on prefetch.
//
// `ensureOnce(key, fn)` runs `fn` at most once per server process (the flag is
// stashed on globalThis so it survives Next's module re-evaluation, exactly
// like the pg Pool in lib/db.ts). Concurrent callers await the same in-flight
// promise; later callers skip entirely. If `fn` throws, the cached entry is
// cleared so a subsequent request can retry — and the error is swallowed to
// preserve the old best-effort ".catch(() => {})" behaviour these blocks had.
//
// The authoritative migration path is POST /api/admin/migrate, run at deploy
// time; ensureOnce is the in-process safety net so a freshly booted instance
// self-heals once rather than on every hit.

const g = globalThis as unknown as { __seaEnsureOnce?: Map<string, Promise<void>> };

function store(): Map<string, Promise<void>> {
  if (!g.__seaEnsureOnce) g.__seaEnsureOnce = new Map();
  return g.__seaEnsureOnce;
}

export function ensureOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const map = store();
  const existing = map.get(key);
  if (existing) return existing;

  const p = (async () => {
    try {
      await fn();
    } catch {
      // Best-effort: clear so a later request in this process can retry.
      map.delete(key);
    }
  })();

  map.set(key, p);
  return p;
}
