// One source of truth for "when did her last period start" and for the
// "is your period out?" check. Pure functions (no DB, no network) so every
// surface (morning digest, /today, chat context, dashboard, alerts) reads the
// same date and the logic can be unit-tested.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Period starts closer together than this are one period, not two. */
export const MIN_CYCLE_GAP_DAYS = 15;

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

/** Asking stops being a daily thing this many days after the expected date (the digest's own "when did it last start?" line takes over). */
export const PERIOD_CHECK_MAX_DAYS = 14;
/** She is treated as gone after this many asked mornings in a row with no Yes/No reply. */
export const PERIOD_CHECK_MAX_UNANSWERED = 3;
/** Mornings 1..this REPLACE the digest (so it doesn't start counting days before she answers); later mornings keep the digest. */
export const PERIOD_CHECK_PAUSE_DAYS = 3;

export interface PeriodCheck {
  /** The date Ava is asking about (the predicted start). */
  date: string;
  /** 1 = the day itself, 2 = the next morning, and so on. */
  askNumber: number;
  /** True on the last morning Ava will ask daily. */
  isLastAsk: boolean;
}

type CheckCycle = {
  next_period_start?: string | null;
  period_start_dates?: readonly string[] | null;
  period_check_for?: string | null;
  period_check_last_asked?: string | null;
  period_check_unanswered?: number | null;
  period_check_answered_on?: string | null;
};

/**
 * Which question is open today, ignoring whether she has been answering.
 * Derived only from the dates on file. The check ends once she logs a period on
 * or after the asked date (that also moves next_period_start forward).
 */
export function periodCheckFor(cycle: CheckCycle | null | undefined, now: Date = new Date()): PeriodCheck | null {
  const next = cycle?.next_period_start ? String(cycle.next_period_start).slice(0, 10) : null;
  if (!next || !ISO.test(next)) return null;
  const last = latestPeriodStartStr(cycle);
  if (!last) return null;                                  // nothing to predict from
  if (last >= next) return null;                           // already logged for this expected date
  const askNumber = daysBetweenStr(next, localDateStr(now)) + 1;
  if (askNumber < 1 || askNumber > PERIOD_CHECK_MAX_DAYS) return null;
  return { date: next, askNumber, isLastAsk: askNumber === PERIOD_CHECK_MAX_DAYS };
}

export interface PeriodCheckPlan {
  check: PeriodCheck;
  /** True on mornings 1-3: send the question INSTEAD of the digest. */
  replaceDigest: boolean;
  /** What to store as period_check_unanswered once this question is sent. */
  unansweredAfter: number;
}

/**
 * Should Ava ask this morning, and how? Keeps asking for as long as she keeps
 * answering (Yes or No both count). It stops after 3 asked mornings in a row go
 * unanswered, and resumes with a fresh count whenever a new expected date is set.
 */
export function planPeriodCheck(cycle: CheckCycle | null | undefined, now: Date = new Date()): PeriodCheckPlan | null {
  const check = periodCheckFor(cycle, now);
  if (!check || !cycle) return null;
  const today = localDateStr(now);
  const sameCheck = cycle.period_check_for === check.date;
  const lastAsked = sameCheck ? cycle.period_check_last_asked ?? null : null;
  const answeredOn = sameCheck ? cycle.period_check_answered_on ?? null : null;
  const stored = sameCheck ? Math.max(0, cycle.period_check_unanswered ?? 0) : 0;

  if (answeredOn === today) return null;                   // already answered today
  // Unanswered asks BEFORE today: if she replied after the last question the run is broken.
  const before = !lastAsked ? 0
    : lastAsked === today ? Math.max(0, stored - 1)        // a re-run of today's cron
    : answeredOn && answeredOn >= lastAsked ? 0
    : stored;
  if (before >= PERIOD_CHECK_MAX_UNANSWERED) return null;  // gone quiet: stop asking, old date stays
  return { check, replaceDigest: check.askNumber <= PERIOD_CHECK_PAUSE_DAYS, unansweredAfter: before + 1 };
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

/**
 * A short, general-wellness nudge that depends on how late she actually is
 * (days past the most likely date), not on which morning of asking it is.
 * Shown only on a few specific days so it never turns into daily nagging.
 */
export function periodCheckNote(daysPastExpected: number): string {
  if (daysPastExpected === 1 || daysPastExpected === 3) {
    return `If there's any chance you could be pregnant, a home test is reliable from the first day of a missed period (first-morning urine works best). If it's negative and your period still hasn't come, retest in 3 to 7 days.`;
  }
  if (daysPastExpected === 7) {
    return `It's been about a week past your expected date. If a test is negative and it still hasn't come, or you have strong pain, dizziness or heavy bleeding, it's worth getting checked at a clinic.`;
  }
  return '';
}

/** The question itself. Day 1 asks about today; later days name the date. */
export function periodCheckMessage(name: string, check: PeriodCheck, greeting: string, note: string = '', withGreeting = true): string {
  const head = withGreeting ? `${greeting}, ${name} 🌸\n\n` : '🩸 ';
  const q = check.askNumber === 1
    ? `Your period is expected around today. Is your period out today?`
    : `Did your period come out on *${pretty(check.date)}*?`;
  return head + q + (note ? `\n\n${note}` : '');
}

export function periodCheckNoReply(name: string, check: PeriodCheck): string {
  if (check.isLastAsk) {
    return `Okay, ${name} 🌸 I'll stop the daily check now and keep your last date for now. Tell me the moment it starts and I'll update everything.`;
  }
  return check.askNumber <= PERIOD_CHECK_PAUSE_DAYS
    ? `No problem, ${name} 🌸 I'll check again tomorrow. Your daily summary is paused until then so I don't count days wrongly.`
    : `Thanks, ${name} 🌸 I'll check again tomorrow. Tell me the moment it starts and I'll update your cycle.`;
}
