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
