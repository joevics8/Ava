// One source of truth for "when did her last period start" and for the
// "is your period out?" check. Pure functions (no DB, no network) so every
// surface (morning digest, /today, chat context, dashboard, alerts) reads the
// same date and the logic can be unit-tested.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Period starts closer together than this are one period, not two. */
export const MIN_CYCLE_GAP_DAYS = 15;
/** How many consecutive mornings Ava asks before giving up and keeping the old date. */
export const PERIOD_CHECK_DAYS = 3;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function utcDay(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Today's calendar date in West Africa (UTC+1) as YYYY-MM-DD, matching getCycleStatus(). */
export function localDateStr(now: Date = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function addDaysStr(iso: string, n: number): string {
  return new Date(utcDay(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetweenStr(a: string, b: string): number {
  return Math.round((utcDay(b) - utcDay(a)) / DAY_MS);
}

/** Valid, de-duplicated, ascending. The array's stored order is NOT trusted. */
export function sortedPeriodDates(dates: readonly string[] | null | undefined): string[] {
  return Array.from(new Set((dates ?? []).map((d) => String(d).slice(0, 10)).filter((d) => ISO.test(d)))).sort();
}

/** The newest period start on file (YYYY-MM-DD), or null. */
export function latestPeriodStartStr(cycle: { period_start_dates?: readonly string[] | null } | null | undefined): string | null {
  const s = sortedPeriodDates(cycle?.period_start_dates);
  return s.length ? s[s.length - 1] : null;
}

export function latestPeriodStart(cycle: { period_start_dates?: readonly string[] | null } | null | undefined): Date | null {
  const s = latestPeriodStartStr(cycle);
  return s ? new Date(s) : null;
}

/**
 * Add a newly reported period start. A date within MIN_CYCLE_GAP_DAYS of an
 * existing one is a correction of that period ("it was actually the 2nd"), so it
 * replaces the old entry instead of sitting beside it as a second period.
 */
export function mergePeriodStart(existing: readonly string[] | null | undefined, startDate: string): string[] {
  const kept = sortedPeriodDates(existing).filter((d) => Math.abs(daysBetweenStr(d, startDate)) >= MIN_CYCLE_GAP_DAYS);
  return [...kept, startDate].sort();
}

export interface PeriodCheck {
  /** The date Ava is asking about (the predicted start). */
  date: string;
  /** 1 = the day itself, 2 and 3 = the follow-up mornings. */
  askNumber: number;
  isLastAsk: boolean;
}

/**
 * Is today one of the (up to 3) mornings Ava should ask "is your period out?"
 * Derived only from stored data, so the morning digest, the webhook and any
 * re-run all agree without a separate flag to keep in sync. The check is over
 * once she logs a period on/after the asked date (that also moves
 * next_period_start forward) or once the 3 mornings have passed.
 */
export function periodCheckFor(
  cycle: { next_period_start?: string | null; period_start_dates?: readonly string[] | null } | null | undefined,
  now: Date = new Date(),
): PeriodCheck | null {
  const next = cycle?.next_period_start ? String(cycle.next_period_start).slice(0, 10) : null;
  if (!next || !ISO.test(next)) return null;
  const last = latestPeriodStartStr(cycle);
  if (!last) return null;                                  // nothing to predict from
  if (last >= next) return null;                           // already logged for this expected date
  const askNumber = daysBetweenStr(next, localDateStr(now)) + 1;
  if (askNumber < 1 || askNumber > PERIOD_CHECK_DAYS) return null;
  return { date: next, askNumber, isLastAsk: askNumber === PERIOD_CHECK_DAYS };
}

export function periodCheckButtons(date: string) {
  return [[
    { text: 'Yes', callback_data: `pc_yes:${date}` },
    { text: 'No', callback_data: `pc_no:${date}` },
  ]];
}

function pretty(iso: string): string {
  return new Date(utcDay(iso)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** The question itself. Day 1 asks about today; later days name the date. */
export function periodCheckMessage(name: string, check: PeriodCheck, greeting: string): string {
  if (check.askNumber === 1) {
    return `${greeting}, ${name} 🌸\n\nYour period is expected around today. Is your period out today?`;
  }
  return `${greeting}, ${name} 🌸\n\nDid your period come out on *${pretty(check.date)}*?`;
}

export function periodCheckNoReply(name: string, check: PeriodCheck): string {
  return check.isLastAsk
    ? `Okay, ${name} 🌸 I'll stop asking and keep your last date for now. Tell me the moment it starts and I'll update everything.`
    : `No problem, ${name} 🌸 I'll check again tomorrow. Your daily summary is paused until then so I don't count days wrongly.`;
}
