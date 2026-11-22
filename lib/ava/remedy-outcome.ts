// Reading her reply to "how is it going?" and using past outcomes. Pure functions.

export type Outcome = 'helped' | 'partially' | 'didnt_help' | 'not_started';

const NOT_STARTED = /\b(haven'?t|have not|hasn'?t|did ?n'?t|did not|not)\s+(started|start|tried|try|begun|begin|used|got round|gotten round)\b|\bnot yet\b|\bforgot\b|\bnever (started|tried)\b/;
const DIDNT = /\b(not|no|isn'?t|aren'?t|n'?t)\s+(any\s+)?(better|improved|improving|improvement)\b|\b(did ?n'?t|did not|does ?n'?t|doesn'?t|do not|don'?t|not|never|barely|hardly)\s+(really\s+)?(help|helped|work|worked|working|helping|make|made|change|changed)\b|\bno (difference|change|improvement|effect|relief)\b|\bnothing (changed|happened|helped)\b|\b(useless|worse|made it worse|waste)\b|\bstill (the same|bad|hurts|painful)\b/;
const PARTIAL = /\b(partial|partially|partly|a (little|bit)|slightly|somewhat|some (relief|improvement|difference)|kind of|kinda|sort of|not (completely|fully|totally|entirely|much))\b/;
const HELPED = /\b(help|helped|helping|helps|work|worked|working|works|better|improv\w+|great|amazing|gone|relief|relieved|love it|loving it)\b/;

/** What her message says about a remedy, or null when it does not read like an answer. */
export function classifyOutcome(text: string): Outcome | null {
  const t = text.toLowerCase().replace(/[’‘]/g, "'").trim();
  if (!t || t.length > 200) return null;
  if (NOT_STARTED.test(t)) return 'not_started';
  if (DIDNT.test(t)) return 'didnt_help';
  if (PARTIAL.test(t) && (HELPED.test(t) || /\bhelp/.test(t) || /\bbit\b|\blittle\b|\bslightly\b|\bsomewhat\b/.test(t))) return 'partially';
  if (HELPED.test(t)) return 'helped';
  return null;
}

export interface TriedRemedy { remedy_id: string; outcome: string | null }

/** Worked-for-her first, untried next, didn't-help last. Stable within each group. */
export function orderByHistory<T extends { id: string }>(remedies: T[], tried: TriedRemedy[]): T[] {
  const best = new Map<string, string>();
  for (const t of tried) {
    if (!t.outcome) continue;
    const prev = best.get(t.remedy_id);
    if (!prev || t.outcome === 'helped' || (t.outcome === 'partially' && prev !== 'helped')) best.set(t.remedy_id, t.outcome);
  }
  const rank = (r: T) => (best.get(r.id) === 'helped' ? 0 : best.get(r.id) === 'didnt_help' ? 2 : 1);
  return remedies.map((r, i) => ({ r, i })).sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i).map(x => x.r);
}

export const workedBefore = (tried: TriedRemedy[], id: string): boolean => tried.some(t => t.remedy_id === id && t.outcome === 'helped');

/** One compact line for the AI: what she tried and how it went. */
export function describeRemedyHistory(rows: { remedy_name: string; condition: string; outcome: string | null }[]): string {
  const done = rows.filter(r => r.outcome).slice(0, 6);
  if (!done.length) return '';
  const word: Record<string, string> = { helped: 'helped', partially: 'helped a little', didnt_help: 'did not help' };
  return 'REMEDIES SHE HAS TRIED: ' + done.map(r => `${r.remedy_name} for ${r.condition.replace(/_/g, ' ')} ${word[r.outcome!] ?? r.outcome}`).join('; ') + '. If one fits again, say it worked for her before; do not suggest ones that did not help.';
}

/** Cooldown check on recent "insight" log rows (summary text, ISO time). */
export function suggestedRecently(rows: { summary: string; logged_at: string }[], summary: string, days: number, now = new Date()): boolean {
  const since = now.getTime() - days * 86400000;
  return rows.some(r => r.summary === summary && new Date(r.logged_at).getTime() >= since);
}
