// ─── The 31-day food rotation ───────────────────────────────────────────────
//
// For a user, the "Eat" line shows 3 foods for their cycle day (1–31; longer cycles wrap).
//   country in our 50  → 3 foods from that country's list
//   any other country  → 2 from their region's list + 1 from the general list
//   nothing known      → no plan (callers keep the generic tip)
// Each day's foods favour the day's nutrient tags (from cycle-lookup), and the rotation spreads
// use evenly: nothing repeats within 4 days, and every food in the list gets its turn.
// Deterministic — same user, same day, same answer — so there is no storage and no AI call.

import { FOOD_LISTS } from './index';
import type { Food } from './types';
import { resolveCountry, isRegionId, type RegionId } from '../countries';
import { getDayData } from '../cycle-lookup';

export const PLAN_DAYS = 31;
export type FoodSource = 'country' | 'region' | 'general';

export interface FoodPick { names: string[]; source: FoodSource; slug: string }

// ─── "Foods I avoid / allergies" → words to exclude ─────────────────────────
// Best effort on free text: matches words and a few families (meat, dairy, nuts…).
// Never a safety guarantee — the wording of the line says so.
const FAMILIES: Record<string, string[]> = {
  meat: ['beef', 'chicken', 'lamb', 'goat', 'pork', 'mutton', 'turkey', 'duck', 'liver', 'sausage', 'bacon', 'ham', 'steak', 'kebab', 'meat', 'suya', 'tripe', 'oxtail'],
  fish: ['fish', 'sardine', 'tuna', 'salmon', 'mackerel', 'cod', 'tilapia', 'catfish', 'herring', 'anchov', 'shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'mussel', 'squid', 'crayfish', 'seafood'],
  dairy: ['milk', 'yoghurt', 'yogurt', 'cheese', 'butter', 'cream', 'paneer', 'ghee', 'curd', 'kefir', 'lassi', 'fura da nono', 'custard'],
  egg: ['egg', 'omelette', 'frittata'],
  nut: ['nut', 'peanut', 'groundnut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'tahini', 'satay'],
  gluten: ['bread', 'wheat', 'pasta', 'noodle', 'couscous', 'bulgur', 'barley', 'oats', 'roti', 'chapati', 'naan', 'pita', 'dumpling', 'pancake', 'toast', 'cracker', 'biscuit', 'semolina', 'freekeh', 'seitan'],
  soy: ['soy', 'tofu', 'tempeh', 'miso', 'edamame', 'natto'],
  pork: ['pork', 'bacon', 'ham', 'sausage', 'lard'],
};
const ALIASES: Record<string, string> = {
  meats: 'meat', seafood: 'fish', shellfish: 'fish', milk: 'dairy', lactose: 'dairy', eggs: 'egg', nuts: 'nut', peanuts: 'nut', peanut: 'nut',
  wheat: 'gluten', soya: 'soy', soybeans: 'soy',
};

// Ways of eating → the families they leave out. Matches the first word of what she typed
// ("vegetarian", "halal, no pork", "I'm vegan").
const SHELLFISH = ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'mussel', 'squid', 'crayfish', 'clam', 'scallop'];
const DIETS: Record<string, string[]> = {
  vegetarian: ['meat', 'fish'],
  vegan: ['meat', 'fish', 'dairy', 'egg', 'honey'],
  pescatarian: ['meat'],
  halal: ['pork'],
  kosher: ['pork', ...SHELLFISH],
};
const DIET_WORDS = Object.keys(DIETS);

/** Terms a way of eating rules out, e.g. "I am vegetarian" → meat and fish words. */
export function dietTerms(diet: string | undefined | null): string[] {
  const text = (diet ?? '').toLowerCase();
  const terms = new Set<string>();
  for (const w of DIET_WORDS) {
    if (new RegExp(`\\b${w}\\b`).test(text)) for (const x of DIETS[w]) (FAMILIES[x] ?? [x]).forEach(t => terms.add(t));
  }
  return Array.from(terms).sort();
}
/** Words that mean "a food or food family" — used to tell "I don't eat pork" from "I don't eat much". */
let vocab: Set<string> | null = null;
export function isFoodWord(word: string): boolean {
  if (!vocab) {
    vocab = new Set<string>([...Object.keys(FAMILIES), ...Object.values(FAMILIES).flat(), ...Object.keys(ALIASES), ...Object.keys(DIETS), 'honey', 'rice', 'bread', 'sugar', 'spicy', 'fried']);
    for (const list of Object.values(FOOD_LISTS)) for (const f of list) for (const w of f.name.toLowerCase().split(/[^a-z]+/)) if (w.length >= 4) vocab.add(w);
  }
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  return vocab.has(w) || vocab.has(w.replace(/(?:es|s)$/, ''));
}

const NONE = new Set(['none', 'no', 'nil', 'nothing', 'n/a', 'na', 'nope', 'nill', 'not any']);

export function avoidTerms(...raw: (string | undefined | null)[]): string[] {
  const terms = new Set<string>();
  for (const text of raw) {
    for (const part of (text ?? '').toLowerCase().split(/[,;\n/]|\band\b|\bor\b/)) {
      const t = part.replace(/\b(i|am|allergic|to|dont|don't|do|not|eat|avoid|no|any|food|foods|intolerant|intolerance|allergy|allergies)\b/g, ' ').replace(/\s+/g, ' ').trim();
      if (!t || NONE.has(t) || t.length < 3) continue;
      const fam = FAMILIES[ALIASES[t] ?? t];
      if (fam) fam.forEach(x => terms.add(x));
      else if (DIET_WORDS.includes(t)) dietTerms(t).forEach(x => terms.add(x));
      else terms.add(t.replace(/s$/, ''));
    }
  }
  return Array.from(terms).sort();
}

/**
 * Does this food name contain one of the avoided words? Short words must match a whole word
 * ("ham" is not "chamomile", "nut" is not "coconut", "egg" is not "eggplant"); longer ones match
 * from the start of a word so "anchov" catches "anchovies". Plurals count either way.
 */
export function isExcluded(name: string, terms: string[]): boolean {
  const n = name.toLowerCase();
  return terms.some(t => {
    const w = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(t.length >= 5 ? `\\b${w}` : `\\b${w}(?:s|es)?\\b`).test(n);
  });
}
const excluded = (food: Food, terms: string[]) => isExcluded(food.name, terms);

// ─── Greedy rotation over one list ──────────────────────────────────────────
function hash01(s: string): number { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }

/** For each of 31 days pick `perDay` foods: tag fit first, then least-used, never repeating inside 4 days. */
export function rotate(list: Food[], dayTags: string[][], perDay: number, salt: string): string[][] {
  const uses = new Map<string, number>();
  const lastDay = new Map<string, number>();
  const plan: string[][] = [];
  for (let d = 0; d < PLAN_DAYS; d++) {
    const chosen: Food[] = [];
    for (let k = 0; k < Math.min(perDay, list.length); k++) {
      let best: Food | null = null; let bestScore = -Infinity;
      for (const f of list) {
        if (chosen.includes(f)) continue;
        const overlap = f.tags.filter(t => dayTags[d].includes(t)).length;
        const sameTags = chosen.filter(c => c.tags.join() === f.tags.join()).length;
        const recent = d - (lastDay.get(f.name) ?? -99) <= 4 ? 8 : 0;
        const score = 3 * Math.min(overlap, 2) - 2.5 * (uses.get(f.name) ?? 0) - recent - sameTags + hash01(`${salt}|${f.name}|${d}`) * 0.9;
        if (score > bestScore) { bestScore = score; best = f; }
      }
      if (best) chosen.push(best);
    }
    chosen.forEach(f => { uses.set(f.name, (uses.get(f.name) ?? 0) + 1); lastDay.set(f.name, d); });
    plan.push(chosen.map(f => f.name));
  }
  return plan;
}

// ─── Which list(s) a user gets ──────────────────────────────────────────────
export interface FoodWho { country?: string | null; region?: string | null }

export function sourcesFor(who: FoodWho): { source: FoodSource; slug: string; main: Food[]; general: Food[] } | null {
  const general = FOOD_LISTS['general'] ?? [];
  const c = resolveCountry(who.country);
  if (c?.foodSlug && FOOD_LISTS[c.foodSlug]) return { source: 'country', slug: c.foodSlug, main: FOOD_LISTS[c.foodSlug], general };
  const region: RegionId | null = c?.region ?? (isRegionId(who.region) ? who.region : null);
  if (region && FOOD_LISTS[region]) return { source: 'region', slug: region, main: FOOD_LISTS[region], general };
  return null;
}

/** Every food name a user's lists contain (used to prime the AI prompt). */
export function allFoodNames(who: FoodWho, avoid: string[] = []): string[] {
  const s = sourcesFor(who);
  if (!s) return [];
  const pool = s.source === 'country' ? s.main : [...s.main, ...s.general];
  return pool.filter(f => !excluded(f, avoid)).map(f => f.name);
}

const cache = new Map<string, string[][]>();
function planFor(key: string, build: () => string[][]): string[][] {
  let p = cache.get(key);
  if (!p) { if (cache.size > 300) cache.clear(); p = build(); cache.set(key, p); }
  return p;
}

const tagCache = new Map<string, string[][]>();
function tagsFor(avg: number, duration: number): string[][] {
  const k = `${avg}|${duration}`;
  let t = tagCache.get(k);
  if (!t) { t = Array.from({ length: PLAN_DAYS }, (_, i) => getDayData(i + 1, avg, duration).nutrientTags as string[]); tagCache.set(k, t); }
  return t;
}

export interface PlanOpts extends FoodWho { avg?: number; duration?: number; avoid?: string[] }

/** The 3 foods for a cycle day, or null when we know neither country nor region. */
export function foodsForCycleDay(cycleDay: number, opts: PlanOpts): FoodPick | null {
  const s = sourcesFor(opts);
  if (!s) return null;
  const avg = Math.min(36, Math.max(21, Math.round(opts.avg || 28)));
  const duration = opts.duration || 5;
  const avoid = opts.avoid ?? [];
  const d = ((Math.max(1, Math.floor(cycleDay)) - 1) % PLAN_DAYS);
  const tagsKey = `${avg}|${duration}|${avoid.join(',')}`;
  const dayTags = tagsFor(avg, duration);
  const keep = (list: Food[]) => { const k = list.filter(f => !excluded(f, avoid)); return k.length >= 3 ? k : list; };

  if (s.source === 'country') {
    const p = planFor(`c|${s.slug}|${tagsKey}`, () => rotate(keep(s.main), dayTags, 3, s.slug));
    return { names: p[d], source: 'country', slug: s.slug };
  }
  const regional = planFor(`r|${s.slug}|${tagsKey}`, () => rotate(keep(s.main), dayTags, 2, s.slug));
  const generic = planFor(`g|${tagsKey}`, () => rotate(keep(s.general), dayTags, 1, 'general'));
  const names = [...regional[d], ...generic[d]].filter((n, i, a) => a.indexOf(n) === i);
  return { names, source: 'region', slug: s.slug };
}

export const joinFoods = (names: string[]): string =>
  names.length <= 1 ? (names[0] ?? '') : names.length === 2 ? names.join(' or ') : names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1];
