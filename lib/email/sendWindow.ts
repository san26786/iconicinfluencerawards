// Daily send-window (Europe/London). When enabled, the queue only sends inside
// the window and auto-pauses outside it — e.g. stop at 18:30, resume at 09:00.
// Handles BST/GMT automatically via Intl and supports overnight windows
// (start > end, e.g. 22:00 → 06:00).

/** Minutes-since-midnight in UK local time (BST/GMT aware). */
export function ukMinutesNow(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return (h % 24) * 60 + m;
}

/** Parse "HH:MM" → minutes-since-midnight, or `fallback` if malformed. */
export function parseHHMM(v: string, fallback: number): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((v ?? "").trim());
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return fallback;
  return h * 60 + min;
}

/**
 * True when sending is allowed at `nowMin`.
 *  - start < end  → daytime window (e.g. 09:00–18:30)
 *  - start > end  → overnight window (e.g. 22:00–06:00)
 *  - start == end → always allowed
 */
export function isWithinWindow(nowMin: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) return true;
  if (startMin < endMin) return nowMin >= startMin && nowMin < endMin;
  return nowMin >= startMin || nowMin < endMin;
}
