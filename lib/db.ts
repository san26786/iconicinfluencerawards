// Postgres connection pool (node-postgres).
//
// A single shared Pool is reused across hot-reloads in dev and across
// invocations in production by stashing it on globalThis — otherwise Next's
// module re-evaluation would open a new pool on every request and exhaust
// the database's connection limit.
//
// The pool is created LAZILY (on first query) rather than at import time, so
// merely importing this module — which `next build` does while analysing route
// handlers — never throws if DATABASE_URL is absent. The error surfaces only
// when a query actually runs.
//
// Anything that imports this module must run on the Node.js runtime
// (route handlers / server components set `export const runtime = 'nodejs'`),
// never the Edge runtime — `pg` uses Node sockets.

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

const globalForPg = globalThis as unknown as { __seaPgPool?: Pool };

function getPool(): Pool {
  if (globalForPg.__seaPgPool) return globalForPg.__seaPgPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to your .env file (see .env.example).');
  }

  // Some hosted providers (Neon, Supabase, Heroku) require SSL. Local Postgres
  // usually does not. Toggle with DATABASE_SSL=true rather than baking it in.
  const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

  const pool = new Pool({ connectionString, ssl });
  globalForPg.__seaPgPool = pool;
  return pool;
}

/** Thin typed wrapper around pool.query for convenience. */
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as never);
}

/**
 * Run `fn` inside a single transaction on a dedicated client (BEGIN/COMMIT,
 * ROLLBACK on throw). Use this when several writes must be atomic AND invisible
 * to other connections until they all land — e.g. inserting an email job plus
 * its recipient rows, so the queue worker never sees a job before its
 * recipients exist (which would make it finish the job as "done" with 0 sent).
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore rollback errors */
    }
    throw err;
  } finally {
    client.release();
  }
}
