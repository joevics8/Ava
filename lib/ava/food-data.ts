// ─── Country & region food data (public API) ───────────────────────────────
//
// The lists themselves live in lib/ava/food/data/<slug>.ts (50 countries, 17 regions, 1 general
// list) and the day-by-day rotation in lib/ava/food/plan.ts. This file is the small surface the
// rest of the bot uses:
//   • getCountryFoods     — the foods we know for a user (country list, or region + general)
//   • pickLocalFoods      — tag-matched foods, for one-off suggestions
//   • localizeEatTip      — the morning digest / /today "Eat" line
//
// A user's country comes from onboarding (free text, users.country). If that isn't one of our 50,
// the region is taken from the country itself (countries.ts) or, failing that, the one they picked
// (users.food_region). With neither, callers keep their generic tip.

import { FOOD_LISTS } from './food/index';
import { sourcesFor, foodsForCycleDay, avoidTerms, joinFoods, isExcluded, type FoodWho } from './food/plan';
import type { Food } from './food/types';

export type CountryFood = Food;

/** The {country, region} pair for a user row. */
export function foodWho(user: { country?: string | null; food_region?: string | null } | null | undefined): FoodWho {
  return { country: user?.country ?? null, region: user?.food_region ?? null };
}

/** Words to exclude, from her saved diet profile (foods avoided + allergies). */
export function avoidFromProfile(profile: { avoid?: string; allergies?: string; diet?: string } | null | undefined): string[] {
  return avoidTerms(profile?.avoid, profile?.allergies, profile?.diet);
}

export { isExcluded };

/** Every food we know for this user: their country's list, or their region's list plus the general list. */
export function getCountryFoods(country?: string | null, region?: string | null): CountryFood[] {
  const s = sourcesFor({ country, region });
  if (!s) return [];
  return s.source === 'country' ? s.main : [...s.main, ...s.general];
}

/** Everyday foods that match any requested tag (max `max`), or null when nothing matches. */
export function pickLocalFoods(tags: string[], country?: string | null, max = 3, region?: string | null): string | null {
  const matches = getCountryFoods(country, region).filter(f => f.tags.some(t => tags.includes(t))).map(f => f.name);
  if (!matches.length) return null;
  return joinFoods(matches.slice(0, max));
}

export interface EatTipOpts {
  /** Her cycle day. With it, the 3 foods rotate day by day over a 31-day plan. */
  day?: number;
  avg?: number;
  duration?: number;
  region?: string | null;
  avoid?: string[];
}

// Swaps the generic food examples for this user's own foods when we know their country/region —
// otherwise returns the generic tip untouched. No AI call: safe in the deterministic digest.
export function localizeEatTip(
  eatTipGeneric: string,
  nutrientTags: string[],
  eatReasonClause: string,
  country?: string | null,
  opts: EatTipOpts = {}
): string {
  const who = { country, region: opts.region };
  if (opts.day) {
    const pick = foodsForCycleDay(opts.day, { ...who, avg: opts.avg, duration: opts.duration, avoid: opts.avoid });
    if (pick?.names.length) return `Try ${joinFoods(pick.names)} today — ${eatReasonClause}.`;
  }
  const local = pickLocalFoods(nutrientTags, country, 3, opts.region);
  return local ? `Try ${local} today — ${eatReasonClause}.` : eatTipGeneric;
}

export { FOOD_LISTS };
