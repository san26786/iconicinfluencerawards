// Authentication primitives: password hashing + a small self-contained
// signed-cookie session (HMAC-SHA256). We deliberately avoid a third-party
// JWT/session library — the requirement is a simple two-role login, and an
// HMAC-signed token keeps the dependency surface (and the credit budget) low.
//
// Token format:  base64url(payloadJSON) "." base64url(HMAC_SHA256(payload))
// Payload:       { sub, email, role, exp }   (exp = unix seconds)
//
// Node.js runtime only (uses node:crypto). Read with getSessionUser() in
// server components; set/clear via the NextResponse cookies API in route
// handlers (see lib helpers below).

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'sea_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = 'visitor' | 'organiser' | 'judge';

export type SessionUser = {
  sub: number; // user id
  email: string;
  role: Role;
  exp: number; // unix seconds
};

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Add a long random value to .env (see .env.example).',
    );
  }
  return s;
}

/* ── Passwords ────────────────────────────────────────────────────────── */

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ── Reset tokens ─────────────────────────────────────────────────────── */

/** A random URL-safe token (the raw value goes to the user; only its hash is stored). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/* ── Session token ────────────────────────────────────────────────────── */

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

export function createSessionToken(user: {
  id: number;
  email: string;
  role: Role;
}): string {
  const payload: SessionUser = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  // Constant-time comparison to avoid leaking signature bytes via timing.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: SessionUser;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

/** Read + verify the current session from the request cookies (server side). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
