// Port of the PHP `crytid()` helper used by the upstream Award platform.
//
// PHP reference (kept here so the symmetry is obvious):
//   $key = hash('sha256', $secret_key);                            // 64 hex chars
//   $iv  = substr(hash('sha256', $secret_iv), 0, 16);              // 16 hex chars
//   $cipher = openssl_encrypt($string, 'AES-256-CBC', $key, 0, $iv);
//   return base64_encode($cipher);                                 // double base64
//
// Important gotchas the port has to honour exactly so the upstream PHP can
// decrypt our links:
//   1. PHP passes the *hex digest string* as the key — not the raw 32-byte
//      digest. The string is 64 ASCII bytes; AES-256-CBC needs a 32-byte key,
//      so OpenSSL silently truncates the first 32 bytes (= first 32 hex chars).
//   2. Same trick for the IV: the 16-char hex substring is taken as ASCII —
//      16 chars = 16 bytes, which is the exact CBC block size.
//   3. `openssl_encrypt(..., $options = 0, ...)` returns base64 already, then
//      the wrapper calls `base64_encode()` a SECOND time. Our output therefore
//      must also be double-base64 encoded — otherwise the PHP `decrypt` path
//      throws on `base64_decode` of raw ciphertext.

import { createCipheriv, createDecipheriv, createHash } from 'crypto';

const SECRET_KEY = 'findusonweb';

function deriveKey(): Buffer {
  // hash('sha256', 'findusonweb') as a hex string, first 32 ASCII bytes
  const hex = createHash('sha256').update(SECRET_KEY).digest('hex');
  return Buffer.from(hex, 'utf8').subarray(0, 32);
}

function deriveIv(secretIv: string | number): Buffer {
  // substr(hash('sha256', $secret_iv), 0, 16) — 16 ASCII bytes
  const hex = createHash('sha256').update(String(secretIv)).digest('hex');
  return Buffer.from(hex.slice(0, 16), 'utf8');
}

/**
 * Encrypt a string the way the upstream Award platform expects so that links
 * we generate (application URLs, unsubscribe tokens, etc.) can be decrypted
 * server-side by the existing PHP code.
 *
 * @param value    Plaintext to encrypt.
 * @param userId   The `$user_id` argument from the PHP signature. Defaults to
 *                 0 to mirror the PHP default; in practice the upstream often
 *                 passes a numeric user id so the IV is per-user. We always
 *                 cast to string before hashing.
 */
export function crytidEncrypt(value: string, userId: string | number = 0): string {
  const key = deriveKey();
  const iv = deriveIv(userId);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  // PHP options=0 → openssl_encrypt returns base64; the wrapper then
  // base64_encode()s the result again. Reproduce both passes.
  const onceB64 = encrypted.toString('base64');
  return Buffer.from(onceB64, 'utf8').toString('base64');
}

/**
 * Mirror of the `d` branch — provided for completeness / testing.
 */
export function crytidDecrypt(value: string, userId: string | number = 0): string {
  const key = deriveKey();
  const iv = deriveIv(userId);
  const onceB64 = Buffer.from(value, 'base64').toString('utf8');
  const cipherBytes = Buffer.from(onceB64, 'base64');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(cipherBytes), decipher.final()]).toString('utf8');
}

/**
 * URL-safe wrapper: crytid output can contain `/`, `+` and `=` which break in
 * query strings depending on how the receiver decodes. We pass through
 * encodeURIComponent so the link is always safe to drop into an href.
 */
export function crytidEncryptForUrl(value: string, userId: string | number = 0): string {
  return encodeURIComponent(crytidEncrypt(value, userId));
}
