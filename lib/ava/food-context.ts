// ─── Food context for free-flowing chat ─────────────────────────────────────
//
// When someone asks Ava about food in conversation ("what can I eat for iron?", "I'm hungry, ideas?"),
// the model gets a short FOOD CONTEXT block: her country's foods that fit what she asked (not
// just the first few in a list), today's rotation picks for her cycle day, and her saved diet profile
// (diet type, avoided foods, allergies, budget, cooking). Only built when the message is about food,
// so unrelated chats pay nothing. No AI and no storage here — pure functions plus one cycle lookup.

import { getCycleData } from './db';
import { latestPeriodStart } from './period';
import { getCurrentPhase } from './cycle';
import { getDayData } from './cycle-lookup';
import { getCountryFoods, avoidFromProfile } from './food-data';
import { foodsForCycleDay, sourcesFor, joinFoods, isExcluded } from './food/plan';
import { resolveCountry, regionLabel, regionFor } from './countries';
import type { AvaUser, FoodProfile } from '@/types';

const FOOD_WORDS = /\b(eat|eating|ate|food|foods|meal|meals|hungry|hunger|starving|cook|cooking|recipe|recipes|breakfast|lunch|dinner|supper|snack|snacks|diet|nutrition|nutrient|nutrients|vitamin|vitamins|cravings?|craving|appetite|drink|drinking|fruit|fruits|vegetable|vegetables|protein|iron|fibre|fiber|magnesium|hydrat\w*|groceries|grocery|menu|dish|soup|stew|tea)\b/i;
const FOOD_PHRASES = /\b(what (?:should|can|do) i (?:eat|have|cook|make)|something to eat|good for (?:my )?(?:cramps|bloating|energy|period|mood)|what to eat|anything to eat)\b/i;

/** Is this message about food? (cheap check so we only build context when it matters) */
export function looksFoodRelated(text: string): boolean {
  return FOOD_WORDS.test(text) || FOOD_PHRASES.test(text);
}

// What she is asking about → the food tags that help most.
const TOPICS: [RegExp, string[]][] = [
  [/\b(tired|fatigue|exhaust\w*|energy|sluggish|weak|drained)\b/i, ['energy', 'iron']],
  [/\b(iron|anaemi\w*|anemi\w*|heavy (?:period|flow|bleeding)|bleeding|low blood)\b/i, ['iron', 'strength']],
  [/\b(cramp\w*|pain|ache\w*|migraine|headache)\b/i, ['magnesium', 'comfort']],
  [/\b(mood|anxious|anxiety|sad|low|stress\w*|irritable|pms|pmdd)\b/i, ['mood', 'magnesium']],
  [/\b(bloat\w*|constipat\w*|digest\w*|gas|gassy|nausea|nauseous|stomach)\b/i, ['digestion', 'fiber']],
  [/\b(protein|gym|workout|exercise|muscle|training|fitness)\b/i, ['protein', 'strength']],
  [/\b(thirst\w*|dehydrat\w*|water|hydrat\w*)\b/i, ['hydration']],
  [/\b(sleep|insomnia|rest|relax)\b/i, ['magnesium', 'comfort']],
  [/\b(weight gain|gain weight|underweight|skinny)\b/i, ['energy', 'carbs', 'protein']],
  [/\b(snack|snacks|quick)\b/i, ['energy']],
];

export function topicTags(text: string): string[] {
  const out: string[] = [];
  for (const [re, tags] of TOPICS) if (re.test(text)) for (const t of tags) if (!out.includes(t)) out.push(t);
  return out;
}

export interface CycleInfo { day: number; avg: number; duration: number; phase?: string }

/** Her current cycle day, or undefined when unknown or pregnant (the rotation follows the cycle). */
export async function currentCycleInfo(user: AvaUser): Promise<CycleInfo | undefined> {
  if ((user as any).mode === 'pregnant') return undefined;
  try {
    const data = await getCycleData(user.id);
    if (!data?.period_start_dates?.length) return undefined;
    const avg = Number(data.avg_cycle_length) || 28;
    const duration = data.period_duration || 5;
    const last = latestPeriodStart(data);
    if (!last) return undefined;
    const { day } = getCurrentPhase(last, avg, duration);
    return { day, avg, duration, phase: getDayData(day, avg, duration).phaseLabel };
  } catch {
    return undefined;
  }
}

const label = (k: string) => k.replace(/_/g, ' ');

/** One compact line per saved preference (skips empty and "none"). */
export function profileLines(profile: FoodProfile | null | undefined): string[] {
  const names: Record<string, string> = {
    diet: 'Way of eating', favourites: 'Foods she likes', breakfast: 'Usual breakfast', avoid: 'Avoids', allergies: 'Allergies',
    budget: 'Budget', meals_per_day: 'Meals per day', cooking: 'Cooking',
  };
  return Object.entries(profile ?? {})
    .filter(([, v]) => v && !/^(none|no|nil|nothing|n\/a)$/i.test(String(v).trim()))
    .map(([k, v]) => `${names[k] ?? label(k)}: ${v}`);
}

const MAX_FOODS = 18;

/**
 * The FOOD CONTEXT block for the system prompt, or '' when the message isn't about food or we
 * know nothing to add. `cycle` is passed in so this stays a pure function.
 */
export function buildFoodContext(user: AvaUser, message: string, cycle?: CycleInfo): string {
  if (!looksFoodRelated(message)) return '';
  const country = (user as any).country as string | undefined;
  const regionPick = (user as any).food_region as string | undefined;
  const profile = ((user as any).food_profile ?? {}) as FoodProfile;
  const avoid = avoidFromProfile(profile);
  const who = { country, region: regionPick };
  const src = sourcesFor(who);
  const lines: string[] = [];

  // Where she eats.
  const c = resolveCountry(country);
  const region = regionFor(country, regionPick);
  if (src?.source === 'country') lines.push(`Where she is: ${c?.name ?? country} (you have a full list of everyday ${c?.name} foods below).`);
  else if (src?.source === 'region' && region) lines.push(`Where she is: ${country || 'country not listed'} — closest region ${regionLabel(region)}; the foods below are common there plus general foods.`);
  else lines.push(`Where she is: ${country || 'not stated'} — no local list, so use widely available everyday foods and ask what is easy for her to get.`);

  // Today's rotation (same foods her morning message shows).
  if (cycle) {
    const pick = foodsForCycleDay(cycle.day, { ...who, avg: cycle.avg, duration: cycle.duration, avoid });
    lines.push(`Cycle day ${cycle.day}${cycle.phase ? ` (${cycle.phase})` : ''}.`);
    if (pick?.names.length) lines.push(`Today's picks from her morning message: ${joinFoods(pick.names)}.`);
  }

  // Local foods relevant to what she asked, topic tags first, then today's nutrient tags.
  const tags = topicTags(message);
  if (cycle) for (const t of getDayData(cycle.day, cycle.avg, cycle.duration).nutrientTags) if (!tags.includes(t)) tags.push(t);
  const kept = getCountryFoods(country, regionPick).filter(f => !isExcluded(f.name, avoid));
  if (kept.length) {
    const scored = kept.map((f, i) => ({ f, i, s: f.tags.reduce((n, t) => n + (tags.indexOf(t) === -1 ? 0 : 3 - Math.min(2, tags.indexOf(t))), 0) }));
    scored.sort((a, b) => b.s - a.s || a.i - b.i);
    const fit = scored.filter(x => x.s > 0).slice(0, MAX_FOODS).map(x => x.f.name);
    const names = fit.length >= 6 ? fit : scored.slice(0, MAX_FOODS).map(x => x.f.name);
    lines.push(`Local foods that fit what she asked: ${names.join(', ')}.`);
  }

  const prof = profileLines(profile);
  lines.push(prof.length ? `Her saved preferences — ${prof.join('; ')}.` : 'No saved food preferences yet (you may ask one short question if it would change your advice, and mention she can set them in /foods → Update my food preferences).');

  return `FOOD CONTEXT (she is asking about food):\n${lines.map(l => '- ' + l).join('\n')}`;
}
