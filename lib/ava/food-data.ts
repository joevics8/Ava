// ─── Country Food Data ─────────────────────────────────────────────────────
//
// WHY THIS EXISTS
// ────────────────
// The morning digest's "Eat" line and the /foods AI suggestions are more
// useful when they name foods the user actually recognises and can get —
// "beans, ugu and liver" lands very differently for a Nigerian user than
// the generic "beans, lentils, spinach" fallback.
//
// This file is a seed, not a finished product. Nigeria now has 50 foods
// (the primary market right now) — the intended path forward — per product
// notes — is to research a similar ~50 common foods for each additional
// target country and tag each with the nutrients/benefits it's known for
// (energy, iron, protein, strength, etc.), so this list can grow country by
// country without touching any of the code that reads it.
//
// Tag vocabulary is intentionally small and shared with cycle-lookup.ts's
// CycleDayData.nutrientTags: 'iron' | 'energy' | 'protein' | 'magnesium' |
// 'mood' | 'hydration' | 'fiber' | 'comfort' | 'carbs' | 'strength' |
// 'digestion'. A food can carry more than one tag.

export interface CountryFood {
  name: string;
  tags: string[];
}

export const COUNTRY_FOODS: Record<string, CountryFood[]> = {
  nigeria: [
    { name: 'beans', tags: ['iron', 'protein', 'energy'] },
    { name: 'ugu (fluted pumpkin leaf)', tags: ['iron'] },
    { name: 'liver', tags: ['iron', 'protein', 'strength'] },
    { name: 'moi moi', tags: ['protein'] },
    { name: 'akara', tags: ['protein', 'energy'] },
    { name: 'jollof rice', tags: ['energy', 'carbs'] },
    { name: 'yam', tags: ['strength', 'energy', 'carbs'] },
    { name: 'plantain', tags: ['energy', 'carbs'] },
    { name: 'eggs', tags: ['protein'] },
    { name: 'fish', tags: ['protein'] },
    { name: 'chicken', tags: ['protein'] },
    { name: 'beef', tags: ['protein', 'iron', 'strength'] },
    { name: 'ewedu', tags: ['digestion'] },
    { name: 'okra', tags: ['digestion'] },
    { name: 'garden egg', tags: ['digestion'] },
    { name: 'groundnut', tags: ['energy', 'magnesium'] },
    { name: 'watermelon', tags: ['hydration'] },
    { name: 'cucumber', tags: ['hydration'] },
    { name: 'coconut water', tags: ['hydration'] },
    { name: 'banana', tags: ['mood'] },
    { name: 'pepper soup', tags: ['comfort'] },
    { name: 'pap (ogi)', tags: ['comfort', 'carbs'] },
    { name: 'dark leafy greens (efo)', tags: ['iron', 'magnesium'] },
    { name: 'tomatoes', tags: ['digestion', 'hydration'] },
    { name: 'onions', tags: ['digestion'] },
    { name: 'scent leaf (nchanwu)', tags: ['digestion', 'comfort'] },
    { name: 'bitter leaf', tags: ['digestion'] },
    { name: 'pumpkin (elegede)', tags: ['fiber', 'carbs'] },
    { name: 'sweet potato', tags: ['carbs', 'energy', 'fiber'] },
    { name: 'garri (cassava)', tags: ['carbs', 'energy'] },
    { name: 'millet', tags: ['fiber', 'energy'] },
    { name: 'guinea corn (sorghum)', tags: ['fiber', 'iron'] },
    { name: 'brown rice', tags: ['fiber', 'carbs'] },
    { name: 'oats', tags: ['fiber', 'energy'] },
    { name: 'tigernut (aya)', tags: ['energy', 'digestion'] },
    { name: 'cashew nuts', tags: ['magnesium', 'energy'] },
    { name: 'African walnut (asala)', tags: ['magnesium', 'mood'] },
    { name: 'honey', tags: ['energy', 'comfort'] },
    { name: 'ginger', tags: ['digestion', 'comfort'] },
    { name: 'garlic', tags: ['digestion'] },
    { name: 'turmeric', tags: ['digestion'] },
    { name: 'lemon', tags: ['hydration', 'digestion'] },
    { name: 'orange', tags: ['hydration', 'fiber'] },
    { name: 'pineapple', tags: ['digestion', 'hydration'] },
    { name: 'pawpaw (papaya)', tags: ['digestion', 'fiber'] },
    { name: 'mango', tags: ['energy', 'fiber'] },
    { name: 'avocado (ube)', tags: ['magnesium', 'strength'] },
    { name: 'crayfish', tags: ['protein', 'iron'] },
    { name: 'snail', tags: ['protein', 'iron'] },
    { name: 'yoghurt (fura da nono)', tags: ['protein', 'digestion'] },
  ],
};

// Aliases so "Nigeria", "nigeria", "NG", "naija" all resolve to the same
// seed list. Extend this as more countries get their own entries.
const COUNTRY_ALIASES: Record<string, string> = {
  nigeria: 'nigeria',
  ng: 'nigeria',
  naija: 'nigeria',
};

function normalizeCountry(country: string): string | null {
  const key = country.trim().toLowerCase();
  return COUNTRY_ALIASES[key] || null;
}

export function getCountryFoods(country?: string | null): CountryFood[] {
  if (!country) return [];
  const normalized = normalizeCountry(country);
  if (!normalized) return [];
  return COUNTRY_FOODS[normalized] || [];
}

// Picks up to `max` local food names whose tags overlap the requested
// nutrient tags. Returns null (never an empty string) when nothing matches,
// so callers can cleanly fall back to the generic tip.
export function pickLocalFoods(tags: string[], country?: string | null, max = 3): string | null {
  const foods = getCountryFoods(country);
  if (!foods.length) return null;

  const matches = foods.filter(f => f.tags.some(t => tags.includes(t))).map(f => f.name);
  if (!matches.length) return null;

  const picked = matches.slice(0, max);
  if (picked.length === 1) return picked[0];
  if (picked.length === 2) return picked.join(' or ');
  return picked.slice(0, -1).join(', ') + ' or ' + picked[picked.length - 1];
}

// Swaps generic food examples for local ones when the user's country has
// seed data covering the needed nutrient tags — otherwise returns the
// generic tip untouched. No AI call, so it's safe to use in the
// deterministic morning digest / /today summary.
export function localizeEatTip(
  eatTipGeneric: string,
  nutrientTags: string[],
  eatReasonClause: string,
  country?: string | null
): string {
  const localFoods = pickLocalFoods(nutrientTags, country);
  if (!localFoods) return eatTipGeneric;
  return `Try ${localFoods} today — ${eatReasonClause}.`;
}
