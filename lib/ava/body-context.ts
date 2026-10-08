import type { CycleData, MemoryLog } from '@/types';
import { getCycleStatus, wholeDaysBetween } from './cycle';
import { getDayData } from './cycle-lookup';

// Everything in this file is pure (no DB, no network) so it can be unit-tested
// and so the exact same facts reach every reply path (chat, log follow-ups,
// retrieval). The model is told to treat these as ground truth: before this
// existed, free-text conversation had NO idea where the user was in her cycle,
// which is how Ava told someone her period was "delayed" two days before the
// start of her expected window.

const MS_DAY = 24 * 60 * 60 * 1000;

// West Africa (UTC+1), matching getGreeting() and getCycleStatus().
function localNow(now: Date): Date {
  return new Date(now.getTime() + 60 * 60 * 1000);
}

function fmt(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * MS_DAY);
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function describePeriodStatus(daysPastExpected: number, isLate: boolean, stale: boolean): string {
  if (stale) {
    return `${plural(daysPastExpected, 'day')} past the expected date with no new period logged — the app is probably just missing her latest period. Ask when it last started instead of assuming it is late.`;
  }
  if (isLate) {
    return `${plural(daysPastExpected, 'day')} past the most likely date and outside the expected window — genuinely late.`;
  }
  if (daysPastExpected > 0) {
    return `${plural(daysPastExpected, 'day')} past the most likely date but still inside the normal window — NOT late yet.`;
  }
  if (daysPastExpected === 0) {
    return 'expected around now (inside the window) — NOT late.';
  }
  const toGo = -daysPastExpected;
  return toGo <= 2
    ? `due in ${plural(toGo, 'day')} — already inside the expected window, NOT late.`
    : `due in ${plural(toGo, 'day')} — NOT late.`;
}

export function describeCycleContext(cycle: CycleData | null | undefined, now: Date = new Date()): string {
  const dates = cycle?.period_start_dates;
  if (!cycle || !dates || dates.length === 0) {
    return 'CYCLE POSITION: not available yet (no period dates on file). Do not guess cycle day, phase, or whether a period is late.';
  }

  const avg = Number(cycle.avg_cycle_length) || 28;
  const duration = cycle.period_duration || 5;
  const sorted = [...dates].sort();
  const lastStart = new Date(sorted[sorted.length - 1]);
  const status = getCycleStatus(lastStart, avg, duration, now);
  const today = localNow(now);

  const expected = addDays(lastStart, avg);
  const windowStart = addDays(expected, -2);
  const windowEnd = addDays(expected, 2);
  const daysSinceStart = wholeDaysBetween(lastStart, today);

  const lines = [
    'CYCLE POSITION (calculated by the app — treat as fact; never recalculate or contradict it):',
    `- Last period started ${fmt(lastStart)} (${plural(daysSinceStart, 'day')} ago).`,
  ];

  if (status.stale) {
    lines.push(`- Cycle day: unknown — her last logged period is old (${plural(daysSinceStart, 'day')}); typical length is ~${avg} days.`);
  } else {
    // Same lookup /today uses, so chat and /today never name different phases.
    const phaseText = status.day > avg
      ? 'luteal stretch — period has not started yet'
      : getDayData(status.day, avg, duration).phaseLabel.toLowerCase();
    lines.push(`- Today is cycle day ${status.day} of ~${avg} (${phaseText}).`);
  }

  lines.push(
    `- Expected next period: ${fmt(windowStart)}–${fmt(windowEnd)}, most likely ${fmt(expected)}. Status: ${describePeriodStatus(status.daysPastExpected, status.isLate, status.stale)}`
  );

  // Only quote the stored fertile window while it still belongs to the
  // current cycle — otherwise it describes a cycle that's already over.
  if (cycle.next_ovulation_start && cycle.next_ovulation_end && !status.stale) {
    const ovStart = new Date(cycle.next_ovulation_start);
    const ovEnd = new Date(cycle.next_ovulation_end);
    if (ovEnd >= lastStart) {
      lines.push(`- Estimated fertile window this cycle: ${fmt(ovStart)}–${fmt(ovEnd)} (an estimate, not a measurement).`);
    }
  }

  const conf = cycle.confidence_pct != null ? `, prediction confidence ${cycle.confidence_pct}%` : '';
  lines.push(`- Cycle length used: ${avg} days${conf}. Period length: ${duration} days.`);
  return lines.join('\n');
}

// What she actually reported recently, with real dates and day-counts, so the
// model can reason about timing (e.g. "unprotected sex 4 days ago" matters for
// when a pregnancy test is meaningful) instead of guessing from vague tags.
// 'insight' rows are Ava's own bookkeeping and are skipped; 'chat' rows are
// Ava's short topic tags of past conversations, so they're labelled as such.
export function describeRecentLogs(logs: MemoryLog[], now: Date = new Date(), maxItems = 10, days = 14): string {
  const today = localNow(now);
  const cutoff = now.getTime() - days * MS_DAY;
  const rows = logs
    .filter(l => l.category !== 'insight' && new Date(l.logged_at).getTime() >= cutoff)
    .slice(0, maxItems);

  if (rows.length === 0) return 'RECENT LOGS: nothing logged in the last two weeks.';

  const lines = rows.map(l => {
    const when = new Date(l.logged_at);
    const ago = wholeDaysBetween(localNow(when), today);
    const label = l.category === 'chat' ? 'topic noted' : l.category;
    const agoText = ago <= 0 ? 'today' : ago === 1 ? 'yesterday' : `${ago} days ago`;
    return `- ${fmt(localNow(when))} (${agoText}) [${label}] ${l.summary}`;
  });
  return `RECENT LOGS (her own words, summarised; newest first):\n${lines.join('\n')}`;
}

export function describeBodyContext(
  cycle: CycleData | null | undefined,
  logs: MemoryLog[],
  now: Date = new Date()
): string {
  return `${describeCycleContext(cycle, now)}\n\n${describeRecentLogs(logs, now)}`;
}

// ─── Symptom-recurrence matching ──────────────────────────────────────────────
// Used to answer "has this happened before?". Two ways this used to produce a
// confident-but-false "you logged this a month ago":
//   1. it matched Ava's own 'chat'/'insight' bookkeeping rows as if the USER had
//      reported them, so a topic Ava mentioned once looked like a recurring
//      pattern the user had reported; and
//   2. it matched filler words ("more", "frequent", "increased") that appear in
//      unrelated summaries.
// Now: only things the user actually logged, only distinctive words, and never
// the entry written in the last couple of hours (that's the current message).

const USER_LOG_CATEGORIES = new Set(['symptom', 'mood', 'flow', 'sexual', 'cycle', 'test', 'bbt', 'mucus']);

export const PATTERN_STOPWORDS = new Set([
  'about', 'today', 'again', 'still', 'really', 'quite', 'started', 'feeling',
  'cycle', 'cycles', 'menstrual', 'period', 'periods',
  'more', 'less', 'just', 'very', 'pretty', 'little', 'some', 'lots', 'much',
  'frequent', 'frequency', 'increased', 'decreased', 'having', 'normal', 'been',
  'morning', 'mood', 'good', 'okay', 'great', 'feel', 'felt',
]);

export function patternKeywords(summary: string): string[] {
  return summary
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length >= 4 && !PATTERN_STOPWORDS.has(w));
}

export function selectPriorMatch(
  logs: MemoryLog[],
  keywords: string[],
  now: Date = new Date()
): { prior: MemoryLog; daysSince: number } | null {
  if (keywords.length === 0) return null;
  const recentCutoff = now.getTime() - 2 * 60 * 60 * 1000;

  const prior = logs.find(l => {
    if (!USER_LOG_CATEGORIES.has(l.category)) return false;
    if (new Date(l.logged_at).getTime() > recentCutoff) return false;
    const s = l.summary.toLowerCase();
    return keywords.some(k => s.includes(k));
  });
  if (!prior) return null;

  const daysSince = wholeDaysBetween(localNow(new Date(prior.logged_at)), localNow(now));
  return { prior, daysSince };
}

// Reply when she answers "did your period start?" with "not yet". This used to
// be a one-size "cycles can vary" line; now it says where she actually is
// against her window and, if she's genuinely late, what is useful to know.
export function notYetReply(name: string, cycle: CycleData | null | undefined, now: Date = new Date()): string {
  const dates = cycle?.period_start_dates;
  if (!cycle || !dates || dates.length === 0) {
    return `No worries, ${name} 🌸 Cycles can vary by a few days. Tell me the moment it starts and I'll update your cycle.`;
  }
  const avg = Number(cycle.avg_cycle_length) || 28;
  const sorted = [...dates].sort();
  const lastStart = new Date(sorted[sorted.length - 1]);
  const status = getCycleStatus(lastStart, avg, cycle.period_duration || 5, now);
  const windowEnd = fmt(addDays(addDays(lastStart, avg), 2));

  if (status.stale) {
    return `Thanks, ${name}. It's been a while since the last period I have on record, so I may simply be out of date — when did your last period start? Just send me the date.`;
  }
  if (status.isLate) {
    return `Thanks for telling me, ${name}. You're ${plural(status.daysPastExpected, 'day')} past your most likely date. That happens — illness, stress, travel and poor sleep can all push a period later. If there's any chance you could be pregnant, a home test is reliable from the first day of a missed period (retest in 3 to 7 days if it's negative). Tell me the moment it starts and I'll update your cycle 🌸`;
  }
  return `That's completely normal so far, ${name} — your window runs until ${windowEnd}, so it isn't late yet. I'll keep watching; tell me when it starts and I'll update your cycle 🌸`;
}

// Reply when she confirms the period started.
export function periodStartedReply(name: string, nextStart: string | null, nextEnd: string | null): string {
  const range = nextStart && nextEnd
    ? `${fmt(new Date(nextStart))}–${fmt(new Date(nextEnd))}`
    : nextStart
      ? `around ${fmt(new Date(nextStart))}`
      : 'soon';
  return `Got it, ${name} 🩸 I've noted today as day 1. Your next period is expected ${range}.\n\nIf it actually started earlier, tell me how many days ago and I'll fix it. How are you feeling?`;
}
