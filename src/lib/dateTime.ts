/**
 * Centralized date/time utilities for America/Sao_Paulo timezone.
 *
 * Rule: every piece of UI that shows a time or compares a date MUST go
 * through these helpers. Never use Date.getDay(), Date.getHours(), or
 * toISOString().split('T') directly — those are all UTC/browser-local.
 */

const TZ = 'America/Sao_Paulo';

// ── Low-level helpers ────────────────────────────────────────────────────────

/** Decompose a Date into year/month/day/hour/minute parts in SP timezone. */
function partsBR(date: Date): { y: number; mo: number; d: number; h: number; mi: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute') };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns "YYYY-MM-DD" representing today in America/Sao_Paulo.
 * Fixes the AdminDashboard UTC bug where `new Date().toISOString().split('T')[0]`
 * returns the wrong date for Brazilian users after 21h UTC (= midnight SP).
 */
export function todayBR(): string {
  const { y, mo, d } = partsBR(new Date());
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Returns the day-of-week (0 = Sunday … 6 = Saturday) in America/Sao_Paulo.
 * Replaces `Date.getDay()` which returns the UTC-based day-of-week.
 */
export function getDayOfWeekBR(date: Date = new Date()): number {
  // 'en-US' weekday short gives: Sun Mon Tue Wed Thu Fri Sat
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[short] ?? 0;
}

/**
 * Returns the current time in America/Sao_Paulo as total minutes since midnight.
 * Replaces `Date.getHours() * 60 + Date.getMinutes()`.
 */
export function getTimeMinutesBR(date: Date = new Date()): number {
  const { h, mi } = partsBR(date);
  // Intl can return h=24 for midnight in some environments — normalise
  return (h % 24) * 60 + mi;
}

/**
 * Returns true if the given UTC ISO string falls on today in America/Sao_Paulo.
 * Fixes `o.createdAt.startsWith(new Date().toISOString().split('T')[0])`.
 */
export function isTodayBR(isoString: string): boolean {
  const { y, mo, d } = partsBR(new Date(isoString));
  const dateStr = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return dateStr === todayBR();
}

/**
 * Formats a UTC ISO string for display in pt-BR with America/Sao_Paulo timezone.
 * Replaces `new Date(iso).toLocaleString('pt-BR')` which uses browser-local timezone.
 *
 * Output example: "17/03/2026 às 21:05"
 */
export function formatDatetimeBR(isoString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

/**
 * Returns the current time string "HH:MM" in America/Sao_Paulo, suitable for
 * display in the AdminHours status banner.
 */
export function currentTimeBR(): string {
  const { h, mi } = partsBR(new Date());
  return `${String(h % 24).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}
