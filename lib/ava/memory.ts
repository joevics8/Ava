// Pure helpers for Ava's memory (no DB, no network) so they can be unit-tested.
//
// Memory has two shapes:
//  - EVENTS (memory_log): one row per thing that happened, with its real date,
//    cycle day and her own words. source 'user' = she said it; 'ava' = Ava's own
//    note about a conversation (never quoted back as something she said).
//  - FACTS (memory_facts): lasting things she told Ava about herself
//    (allergies, medication she takes, preferences, routines, goals).

export interface Fact { id?: string; key: string; value: string; source?: 'user' | 'ava'; updated_at?: string }

const STOP = new Set(['the', 'and', 'with', 'for', 'her', 'she', 'has', 'was', 'are', 'its', 'date', 'start', 'started']);

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w));
}

/**
 * True when two memory lines say the same thing ("Persistent cramps" /
 * "Persistent abdominal cramps"). Used to stop one event becoming several rows.
 */
export function isNearDuplicateSummary(a: string, b: string): boolean {
  const x = tokens(a), y = tokens(b);
  if (!x.length || !y.length) return a.trim().toLowerCase() === b.trim().toLowerCase();
  const setY = new Set(y);
  const overlap = x.filter(w => setY.has(w)).length;
  const smaller = Math.min(new Set(x).size, setY.size);
  return overlap / smaller >= 0.6;
}

export interface RecentRow { summary: string; event_date?: string | null; logged_at: string }

/**
 * Skip a new event when the same one is already on file for that DAY. (Never across
 * days: "Morning mood: good" today is not a repeat of yesterday's.) Rows without a
 * date fall back to the last 36 hours. `exactOnly` is for things like mood, where
 * "good" and "okay" must not count as the same.
 */
export function isDuplicateEvent(
  summary: string, eventDate: string | null, recent: readonly RecentRow[], now: Date = new Date(), exactOnly = false,
): boolean {
  const same = (a: string, b: string) => (exactOnly ? a.trim().toLowerCase() === b.trim().toLowerCase() : isNearDuplicateSummary(a, b));
  return recent.some(r => {
    const sameDay = eventDate && r.event_date
      ? String(r.event_date).slice(0, 10) === eventDate
      : now.getTime() - new Date(r.logged_at).getTime() < 36 * 3600 * 1000;
    return sameDay && same(summary, r.summary);
  });
}

export function normalizeFactKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
}

const FACT_HINT = /\b(i am|i'm|i have|i've|i take|i'm taking|i was diagnosed|allergic|allergy|intolerant|i always|i usually|i never|i prefer|i like|i love|i hate|i don't eat|i do not eat|i avoid|my doctor|i work|i sleep|my goal|trying to|i'm on|i am on|i drink|i smoke|i exercise|i run|i'm vegetarian|i'm vegan|breastfeeding|pregnant)\b/i;

/** Cheap gate: only messages that sound like a lasting statement about herself go to the fact extractor. */
export function mightStateFact(text: string): boolean {
  return !!text && text.length >= 12 && text.length <= 400 && FACT_HINT.test(text);
}

/** Keep at most `max` well-formed facts from the extractor's output. */
export function cleanFacts(raw: unknown, max = 3): { key: string; value: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { key: string; value: string }[] = [];
  for (const f of raw) {
    const key = normalizeFactKey(String((f as any)?.key ?? ''));
    const value = String((f as any)?.value ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (key.length >= 2 && value.length >= 2 && !out.some(o => o.key === key)) out.push({ key, value });
    if (out.length >= max) break;
  }
  return out;
}

/** Facts as the model should see them. Only facts she stated are presented as true. */
export function describeFacts(facts: readonly Fact[]): string {
  const mine = facts.filter(f => (f.source ?? 'user') === 'user');
  if (!mine.length) return 'WHAT SHE HAS TOLD YOU ABOUT HERSELF: nothing saved yet.';
  const lines = mine.map(f => `- ${f.key.replace(/_/g, ' ')}: ${f.value}`);
  return `WHAT SHE HAS TOLD YOU ABOUT HERSELF (lasting facts she stated; treat as true unless she says otherwise, and use them when they fit):\n${lines.join('\n')}`;
}

/** Cycle day for an event: day 1 = first day of bleeding. null when unknown or the log is long out of date. */
export function cycleDayOn(latestStart: string | null, onDate: string, maxDays = 60): number | null {
  if (!latestStart) return null;
  const a = Date.UTC(+latestStart.slice(0, 4), +latestStart.slice(5, 7) - 1, +latestStart.slice(8, 10));
  const b = Date.UTC(+onDate.slice(0, 4), +onDate.slice(5, 7) - 1, +onDate.slice(8, 10));
  const n = Math.round((b - a) / 86400000) + 1;
  return n >= 1 && n <= maxDays ? n : null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "9 Nov" from YYYY-MM-DD */
export function shortDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
}

// ─── Compact memory for prompts ───────────────────────────────────────────────
// Reading months of memory must not cost thousands of tokens on every call. So:
//  - Ava's own notes (chat/insight rows) are dropped: they were ~70% of the rows
//    and are not things she reported.
//  - recent days (default 30) are one line per day, one-letter category codes,
//    no year, no clock time, cycle day instead of the repeated date arithmetic;
//  - older history collapses into counts ("cramps x5 (d1-3,26)"), which is what
//    pattern questions actually need;
//  - the whole block stops at a character budget (about 4 chars per token).

const CODE: Record<string, string> = { symptom: 's', mood: 'm', flow: 'f', cycle: 'c', sexual: 'x', test: 't', bbt: 'b', mucus: 'u' };
export const COMPACT_LEGEND = 's=symptom m=mood f=flow c=cycle x=sex t=test b=bbt u=mucus; dN=cycle day';

export interface CompactLog {
  category: string; summary: string; logged_at: string;
  event_date?: string | null; cycle_day?: number | null; source?: 'user' | 'ava';
}

const isHers = (l: CompactLog) => (l.source ? l.source === 'user' : l.category !== 'chat' && l.category !== 'insight') && l.category in CODE;
const dayOf = (l: CompactLog) => String(l.event_date ?? l.logged_at).slice(0, 10);
const HEAD_STOP = new Set(['that', 'this', 'with', 'from', 'time', 'daily', 'today']);

/** The noun a tag is about: "Persistent abdominal cramps" -> "cramps". */
export function topicOf(summary: string): string {
  const words = summary.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !HEAD_STOP.has(w));
  return words.length ? words[words.length - 1] : summary.toLowerCase().slice(0, 20);
}

function compactRuns(days: number[]): string {
  const sorted = Array.from(new Set(days)).sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j > i ? `${sorted[i]}-${sorted[j]}` : String(sorted[i]));
    i = j + 1;
  }
  return parts.join(',');
}

export function compactLogs(
  logs: readonly CompactLog[],
  opts: { now?: Date; fullDays?: number; budgetChars?: number } = {},
): string {
  const now = opts.now ?? new Date();
  const fullDays = opts.fullDays ?? 21;
  const budget = opts.budgetChars ?? 1400;
  const hers = logs.filter(isHers);
  if (!hers.length) return 'MEM: nothing logged.';

  const cutoff = new Date(now.getTime() - fullDays * 86400000).toISOString().slice(0, 10);
  const recent = hers.filter(l => dayOf(l) >= cutoff);
  const older = hers.filter(l => dayOf(l) < cutoff);

  // Recent: one line per day, newest first.
  const byDay = new Map<string, CompactLog[]>();
  for (const l of recent) byDay.set(dayOf(l), [...(byDay.get(dayOf(l)) ?? []), l]);
  const dayLines = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, rows]) => {
    const cd = rows.find(r => r.cycle_day)?.cycle_day;
    const items = rows.map(r => `${CODE[r.category]}:${r.summary.replace(/^morning mood:\s*/i, '')}`).join('; ');
    return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}${cd ? ` d${cd}` : ''} ${items}`;
  });

  // Older: counts per topic, most frequent first.
  const topics = new Map<string, { n: number; days: number[]; cat: string }>();
  for (const l of older) {
    const t = topicOf(l.summary);
    const e = topics.get(t) ?? { n: 0, days: [], cat: CODE[l.category] };
    e.n++; if (l.cycle_day) e.days.push(l.cycle_day);
    topics.set(t, e);
  }
  const oldLines = Array.from(topics.entries()).sort((a, b) => b[1].n - a[1].n).slice(0, 12)
    .map(([t, e]) => `${e.cat}:${t} x${e.n}${e.days.length ? ` (d${compactRuns(e.days)})` : ''}`);

  const head = `MEM (${COMPACT_LEGEND}; m/d = date)`;
  const lines: string[] = [head];
  let used = head.length;
  const push = (line: string) => { if (used + line.length + 1 > budget) return false; lines.push(line); used += line.length + 1; return true; };
  for (const l of dayLines) if (!push(l)) break;
  if (oldLines.length) {
    push(`Older than ${fullDays}d, counts:`);
    for (const l of oldLines) if (!push(l)) break;
  }
  return lines.join('\n');
}

/** Rough token estimate (about 4 characters per token) for budgets and tests. */
export const approxTokens = (s: string) => Math.ceil(s.length / 4);

// ─── Recall: old entries about what she is talking about right now ────────────
// The compact block above keeps only 21 days of detail. When she brings up a topic
// ("my cramps", "that headache again") we also fetch the matching OLDER entries,
// so Ava can say "you logged this on 14 Sep, cycle day 26" without reading all of
// the history on every message.

const RECALL_STOP = new Set([
  'when', 'what', 'which', 'have', 'last', 'time', 'times', 'much', 'many', 'does', 'with', 'that', 'this', 'from', 'been', 'them',
  'they', 'about', 'again', 'ever', 'often', 'other', 'before', 'after', 'since', 'still', 'tell', 'know', 'please', 'there', 'their',
  'these', 'those', 'would', 'could', 'should', 'really', 'just', 'like', 'also', 'into', 'your', 'mine', 'myself', 'feel', 'feeling',
  'period', 'periods', 'cycle', 'cycles', 'menstrual', 'health', 'today', 'yesterday', 'tomorrow', 'month', 'months', 'week', 'weeks',
  'days', 'happen', 'happened', 'happening', 'normal', 'okay', 'bring', 'thing', 'things', 'something', 'anything', 'because', 'every',
]);

/** Up to 4 stems from a message ("cramps" -> "cramp"), longest first. Letters only, so they are safe in a query. */
export function recallKeywords(text: string, max = 4): string[] {
  const seen = new Set<string>();
  for (const w of text.toLowerCase().split(/[^a-z]+/)) {
    if (w.length < 4 || RECALL_STOP.has(w)) continue;
    seen.add(w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w);
  }
  return Array.from(seen).sort((a, b) => b.length - a.length).slice(0, max);
}

/** PostgREST `or` filter matching any keyword in the summary or her own words. Letters only: nothing to escape. */
export function recallOrFilter(keywords: readonly string[]): string {
  return keywords.filter(k => /^[a-z]{3,}$/.test(k)).flatMap(k => [`summary.ilike.%${k}%`, `detail.ilike.%${k}%`]).join(',');
}

export function formatRecall(rows: readonly CompactLog[], opts: { now?: Date; budgetChars?: number; maxRows?: number } = {}): string {
  const now = opts.now ?? new Date();
  const budget = opts.budgetChars ?? 900;
  const hers = rows.filter(isHers).slice(0, opts.maxRows ?? 15);
  if (!hers.length) return '';
  const head = 'PAST ENTRIES MATCHING WHAT SHE JUST SAID (older, only things she reported; mention one only if it genuinely fits, and quote its real date):';
  const lines = [head];
  let used = head.length;
  for (const l of hers) {
    const d = dayOf(l);
    const yr = now.getTime() - new Date(d).getTime() > 330 * 86400000 ? `/${d.slice(2, 4)}` : '';
    const line = `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}${yr}${l.cycle_day ? ` d${l.cycle_day}` : ''} ${CODE[l.category]}:${l.summary.replace(/^morning mood:\s*/i, '')}`;
    if (used + line.length + 1 > budget) break;
    lines.push(line); used += line.length + 1;
  }
  return lines.length > 1 ? lines.join('\n') : '';
}
