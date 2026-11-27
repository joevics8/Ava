// ─── Picking up food preferences from chat ──────────────────────────────────
//
// "I'm vegetarian", "I don't eat pork", "I'm allergic to eggs" said in conversation are saved to her
// food profile (the same one the /foods questions fill), so every later suggestion — chat, /foods and
// the morning message — respects them without asking again. Deliberately strict: only first-person,
// explicit statements, and only items that are actual foods ("I don't eat much when stressed" saves nothing).

import { updateUser } from './db';
import { isFoodWord } from './food/plan';
import type { AvaUser, FoodProfile } from '@/types';

export interface FoundPrefs { diet?: string; avoid: string[]; allergies: string[] }

const DIET_RE = /\bi(?:'m|m| am| have become| became| follow(?: a)?| eat)\s+(?:a |an |now |strictly |fully |mostly )?(vegetarian|vegan|pescatarian|halal|kosher)(?![\w-])/;
const AVOID_RE = /\bi\s+(?:don'?t|do not|dont|never|can'?t|cannot|won'?t|no longer|stopped)\s+(?:really\s+)?(?:eat|eating|touch|have|take|drink)\s+([^.!?;\n]{2,70})/g;
const ALLERGIC_RE = /\bi(?:'m|m| am)\s+(?:very |severely |also |quite )?(?:allergic|intolerant|sensitive)\s+to\s+([^.!?;\n]{2,70})/g;
const ALLERGY_NOUN_RE = /\bi\s+have\s+(?:an?\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:allergy|intolerance)\b/g;
const INTOLERANT_RE = /\bi(?:'m|m| am)\s+(lactose|gluten)\s+intolerant\b/g;
const CUT = /\s+(?:because|but|since|when|if|so|anymore|any more|at all|these days|lately|now|though|as|cos|cause|and i|but i)\b.*$/;

// "I don't drink enough water", "I rarely eat well" are about amounts, not things she avoids.
const AMOUNT = /\b(enough|often|regularly|properly|well|healthily|healthy|properly|much|many|more|less|rarely|daily|on time|every)\b/;
const NEVER_AVOID = new Set(['water']);

function items(raw: string): string[] {
  if (AMOUNT.test(raw.replace(CUT, ''))) return [];
  return raw
    .replace(CUT, '')
    .split(/,|\band\b|\bor\b|&|\//)
    .map(x => x.replace(/\b(any|much|really|a lot of|lots of|too much|the|foods?|anything|things?|with|my|some)\b/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(x => x.length >= 3 && x.length <= 30 && !NEVER_AVOID.has(x) && x.split(' ').some(isFoodWord));
}

export function detectFoodPreferences(text: string): FoundPrefs | null {
  const t = text.toLowerCase().replace(/[’`]/g, "'");
  const found: FoundPrefs = { avoid: [], allergies: [] };
  const diet = DIET_RE.exec(t);
  if (diet) found.diet = diet[1];
  for (const m of Array.from(t.matchAll(AVOID_RE))) found.avoid.push(...items(m[1]));
  for (const m of Array.from(t.matchAll(ALLERGIC_RE))) found.allergies.push(...items(m[1]));
  for (const m of Array.from(t.matchAll(ALLERGY_NOUN_RE))) found.allergies.push(...items(m[1]));
  for (const m of Array.from(t.matchAll(INTOLERANT_RE))) found.allergies.push(m[1] === 'lactose' ? 'dairy (lactose)' : 'gluten');
  const uniq = (a: string[]) => a.filter((x, i) => a.indexOf(x) === i);
  found.avoid = uniq(found.avoid); found.allergies = uniq(found.allergies);
  return found.diet || found.avoid.length || found.allergies.length ? found : null;
}

const isNone = (v?: string) => !v || /^(none|no|nil|nothing|n\/a)$/i.test(v.trim());

function addTo(existing: string | undefined, add: string[]): { value: string; added: string[] } {
  const have = isNone(existing) ? [] : existing!.split(/,\s*/).filter(Boolean);
  const added = add.filter(a => !have.some(h => h.toLowerCase() === a.toLowerCase()));
  return { value: [...have, ...added].join(', '), added };
}

/** Merge into a profile; reports only what is actually new. */
export function mergePrefs(profile: FoodProfile, found: FoundPrefs): { profile: FoodProfile; changes: string[] } {
  const next: FoodProfile = { ...profile };
  const changes: string[] = [];
  if (found.diet && (profile.diet ?? '').toLowerCase() !== found.diet) { next.diet = found.diet; changes.push(`you're ${found.diet}`); }
  const av = addTo(profile.avoid, found.avoid);
  if (av.added.length) { next.avoid = av.value; changes.push(`you avoid ${av.added.join(', ')}`); }
  const al = addTo(profile.allergies, found.allergies);
  if (al.added.length) { next.allergies = al.value; changes.push(`you're allergic or sensitive to ${al.added.join(', ')}`); }
  return { profile: next, changes };
}

/**
 * Saves any new food preference found in her message and returns a short confirmation
 * (or null when there was nothing new). Updates `user` in place so the same reply already respects it.
 */
export async function captureFoodPreferences(user: AvaUser, text: string): Promise<string | null> {
  const found = detectFoodPreferences(text);
  if (!found) return null;
  const current = ((user as any).food_profile ?? {}) as FoodProfile;
  const { profile, changes } = mergePrefs(current, found);
  if (!changes.length) return null;
  await updateUser(user.telegram_id, { food_profile: profile } as any);
  (user as any).food_profile = profile;
  const said = changes.length === 1 ? changes[0] : changes.slice(0, -1).join(', ') + ' and ' + changes[changes.length - 1];
  return `📝 Noted — ${said}. I'll keep that in mind for food ideas (change it anytime in /foods).`;
}
