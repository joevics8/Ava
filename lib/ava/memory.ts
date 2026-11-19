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
// Every entry she logged is kept and shown; only its LENGTH is cut:
//  - Ava's own notes (chat/insight rows) are left out: they are not things she reported;
//  - one line per day, one-letter category codes, no year (unless over a year old),
//    no clock time, cycle day as dN;
//  - filler words dropped and common words abbreviated (see shortenSummary).
// Nothing is limited when SAVING, and repeats on different days all show, so
// "cramps 2 weeks ago, cramps today" stays visible as a pattern. Only a flood of the
// same symptom within ONE day is shortened when shown (first 3, then "+N").

const CODE: Record<string, string> = { symptom: 's', mood: 'm', flow: 'f', cycle: 'c', sexual: 'x', test: 't', bbt: 'b', mucus: 'u' };
export const COMPACT_LEGEND = 's=symptom m=mood f=flow c=cycle x=sex t=test b=bbt u=mucus; dN=cycle day; abd=abdominal';

export interface CompactLog {
  category: string; summary: string; logged_at: string;
  event_date?: string | null; cycle_day?: number | null; source?: 'user' | 'ava';
}

const isHers = (l: CompactLog) => (l.source ? l.source === 'user' : l.category !== 'chat' && l.category !== 'insight') && l.category in CODE;
const dayOf = (l: CompactLog) => String(l.event_date ?? l.logged_at).slice(0, 10);

const FILLER = new Set(['experiencing', 'experienced', 'feeling', 'having', 'reported', 'noticed', 'noticing', 'got', 'getting', 'a', 'an', 'the', 'of', 'some', 'my', 'is', 'was', 'been']);
const ABBREV: Record<string, string> = {
  and: '&', with: 'w/', without: 'w/o', abdominal: 'abd', menstrual: 'mens', persistent: 'persist', frequent: 'freq', frequency: 'freq',
  temperature: 'temp', increased: '↑', decreased: '↓', reduced: '↓', morning: 'am', evening: 'pm', moderate: 'mod', discomfort: 'discomf',
  irritability: 'irritab', irritated: 'irritab', unprotected: 'unprot', intercourse: 'sex',
};

const HEAD_STOP = new Set(['that', 'this', 'with', 'from', 'time', 'daily', 'today']);

/** The noun a tag is about: "Persistent abdominal cramps" -> "cramps". */
export function topicOf(summary: string): string {
  const words = summary.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !HEAD_STOP.has(w));
  return words.length ? words[words.length - 1] : summary.toLowerCase().slice(0, 20);
}

/** Most times the same symptom is SHOWN for one day. Saving has no limit. */
export const PER_DAY_TOPIC_LIMIT = 3;

/** One day's rows with each topic shown at most `limit` times; the rest become "+N" on the last one shown. */
export function limitPerTopic<T extends CompactLog>(rows: readonly T[], limit = PER_DAY_TOPIC_LIMIT): { row: T; extra: number }[] {
  const shown = new Map<string, number>();
  const kept: { row: T; extra: number; key: string }[] = [];
  for (const row of rows) {
    const key = `${row.category}:${topicOf(row.summary)}`;
    const n = shown.get(key) ?? 0;
    shown.set(key, n + 1);
    if (n < limit) kept.push({ row, extra: 0, key });
    else {
      for (let i = kept.length - 1; i >= 0; i--) if (kept[i].key === key) { kept[i].extra++; break; }
    }
  }
  return kept.map(({ row, extra }) => ({ row, extra }));
}

/** "Experiencing menstrual cramps and feeling irritable" -> "mens cramps & irritable". Keeps every fact, drops only filler. */
export function shortenSummary(summary: string): string {
  const words = summary.replace(/^morning mood:\s*/i, '').split(/\s+/).filter(Boolean);
  const out = words.filter(w => !FILLER.has(w.toLowerCase())).map(w => ABBREV[w.toLowerCase()] ?? w);
  return (out.join(' ') || summary).trim();
}

export function compactLogs(logs: readonly CompactLog[], opts: { now?: Date } = {}): string {
  const now = opts.now ?? new Date();
  const hers = logs.filter(isHers);
  if (!hers.length) return 'MEM: nothing logged.';

  const byDay = new Map<string, CompactLog[]>();
  for (const l of hers) byDay.set(dayOf(l), [...(byDay.get(dayOf(l)) ?? []), l]);
  const lines = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, rows]) => {
    const cd = rows.find(r => r.cycle_day)?.cycle_day;
    const yr = now.getTime() - new Date(d).getTime() > 330 * 86400000 ? `/${d.slice(2, 4)}` : '';
    const items = limitPerTopic(rows).map(({ row, extra }) => `${CODE[row.category]}:${shortenSummary(row.summary)}${extra ? ` +${extra}` : ''}`).join('; ');
    return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}${yr}${cd ? ` d${cd}` : ''} ${items}`;
  });
  return [`MEM (${COMPACT_LEGEND}; m/d = date, newest first)`, ...lines].join('\n');
}

/** Rough token estimate (about 4 characters per token). */
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
  'hello', 'thanks', 'thank', 'good', 'great', 'nice', 'sure', 'yeah', 'help', 'need', 'want', 'make', 'going', 'give', 'here', 'well', 'very', 'more', 'less', 'little', 'days', 'happen', 'happened', 'happening', 'normal', 'okay', 'bring', 'thing', 'things', 'something', 'anything', 'because', 'every',
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

// Words that mean the same thing in a cycle log. A search for "cramps" must also find
// "spasms" or "abdominal ache"; stems are matched with a substring search, so one
// stem covers its plurals and endings ("cramp" finds cramps, cramping).
const SYNONYMS: string[][] = [
  ['cramp', 'spasm', 'abdominal', 'pelvic', 'dysmenorrh'],
  ['headache', 'migraine'],
  ['nausea', 'nauseous', 'vomit', 'queasy'],
  ['bloat', 'swollen', 'swelling'],
  ['acne', 'pimple', 'breakout'],
  ['fatigue', 'tired', 'exhaust', 'drained', 'energy'],
  ['spotting', 'brown', 'light bleeding'],
  ['discharge', 'mucus'],
  ['mood', 'irritab', 'anxi', 'anxious', 'moody', 'sad', 'depress', 'tearful'],
  ['sleep', 'insomnia', 'restless'],
  ['backache', 'back', 'lumbar'],
  ['breast', 'tender', 'sore'],
  ['dizz', 'lightheaded', 'faint'],
  ['clot', 'heavy', 'flow'],
  ['urin', 'bladder', 'pee'],
  ['sex', 'intercourse', 'unprotected', 'coital'],
  ['craving', 'appetite', 'hunger'],
  ['temperature', 'fever', 'warmth', 'hot'],
];

/** The stems to search for: what she said plus its synonyms (letters only, at most 12). */
export function recallTerms(text: string, max = 12): string[] {
  const base = recallKeywords(text);
  const out = new Set<string>(base);
  for (const stem of base) {
    for (const group of SYNONYMS) {
      if (group.some(t => !t.includes(' ') && (t.startsWith(stem) || stem.startsWith(t)))) {
        for (const t of group) if (!t.includes(' ')) out.add(t);
      }
    }
  }
  return Array.from(out).slice(0, max);
}

/** PostgREST `or` filter matching any keyword in the summary or her own words. Letters only: nothing to escape. */
export function recallOrFilter(keywords: readonly string[]): string {
  return keywords.filter(k => /^[a-z]{3,}$/.test(k)).flatMap(k => [`summary.ilike.%${k}%`, `detail.ilike.%${k}%`]).join(',');
}

/** Most recall entries listed. */
export const RECALL_MAX_ROWS = 15;

export function formatRecall(rows: readonly CompactLog[], opts: { now?: Date; maxRows?: number } = {}): string {
  const now = opts.now ?? new Date();
  const hers = rows.filter(isHers);
  if (!hers.length) return '';
  const byDay = new Map<string, CompactLog[]>();
  for (const l of hers) byDay.set(dayOf(l), [...(byDay.get(dayOf(l)) ?? []), l]);
  const lines: string[] = [];
  for (const [d, dayRows] of Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))) {
    const yr = now.getTime() - new Date(d).getTime() > 330 * 86400000 ? `/${d.slice(2, 4)}` : '';
    for (const { row, extra } of limitPerTopic(dayRows)) {
      lines.push(`${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}${yr}${row.cycle_day ? ` d${row.cycle_day}` : ''} ${CODE[row.category]}:${shortenSummary(row.summary)}${extra ? ` +${extra}` : ''}`);
    }
  }
  const shown = lines.slice(0, opts.maxRows ?? RECALL_MAX_ROWS);
  const more = lines.length - shown.length;
  return [
    'PAST ENTRIES MATCHING WHAT SHE JUST SAID (newest first, only things she reported; they show how often and when it happens; mention only what genuinely fits, and quote real dates):',
    ...shown,
    ...(more > 0 ? [`(+${more} older matching entries not shown)`] : []),
  ].join('\n');
}

/** The word match runs first; the meaning match fills in only when it found fewer than this many. */
export const SEMANTIC_FILL_BELOW = 8;

/** Union of both matchers by id, newest first (formatRecall then limits each day and shows 15). */
export function mergeRecallRows<T extends { id?: string; logged_at: string }>(byWords: readonly T[], byMeaning: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of [...byWords, ...byMeaning]) {
    const key = r.id ?? `${r.logged_at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out.sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1)).slice(0, 80);
}
