// ─── /foods — nutrition & meal assistant ───────────────────────────────────
//
// Two things live here:
// 1. The /foods menu — food-request options plus a separate "update my food
//    preferences" action — and the AI suggestion generator behind it.
// 2. The "Tell Ava about my diet" flow — six short questions, one at a time,
//    stored in users.food_profile (jsonb) and used to personalise every
//    future food suggestion (here and in general conversation — see
//    handleConversation in ai.ts).

import { updateUser, getCycleData, addMemoryLog, getMemoryContext } from './db';
import { getCurrentPhase } from './cycle';
import { getDayData } from './cycle-lookup';
import { getCountryFoods } from './food-data';
import { callGemini, FLASH } from './ai';
import type { AvaUser, MemoryLog, FoodProfile } from '@/types';

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;
type SendWithKeyboardFn = (chatId: number, text: string, keyboard: any[][], markdown?: boolean) => Promise<void>;

// ─── Menu ───────────────────────────────────────────────────────────────────

interface FoodOption {
  key: string;
  label: string;
}

const FOOD_OPTIONS: FoodOption[] = [
  { key: 'today', label: '🍽️ What should I eat today?' },
  { key: 'energy', label: '⚡ Food for more energy' },
  { key: 'symptoms', label: '🩺 Food for my current symptoms' },
  { key: 'weight_gain', label: '⚖️ Healthy weight gain' },
  { key: 'weight_loss', label: '⚖️ Healthy weight loss' },
  { key: 'sleep', label: '😴 Better sleep' },
  { key: 'fitness', label: '💪 Fitness & recovery' },
  { key: 'ideas', label: '🎲 Just give me meal ideas' },
];

// Not a food request — updates her saved diet profile, so it's kept out of
// the list above and shown as its own action underneath.
const UPDATE_PREFS_OPTION: FoodOption = { key: 'learn', label: '📝 Update my food preferences' };

export async function showFoodMenu(chatId: number, sendKb: SendWithKeyboardFn): Promise<void> {
  const keyboard = [
    ...FOOD_OPTIONS.map(o => [{ text: o.label, callback_data: 'food_' + o.key }]),
    [{ text: UPDATE_PREFS_OPTION.label, callback_data: 'food_' + UPDATE_PREFS_OPTION.key }],
  ];
  await sendKb(chatId, '🍽️ *What would you like help with?*', keyboard, true);
}

// ─── AI suggestion generation ──────────────────────────────────────────────

const OPTION_INSTRUCTIONS: Record<string, string> = {
  today: 'Suggest one practical meal or food combo she could have today, taking her current cycle phase into account (see phase info below) alongside anything else relevant.',
  energy: 'Suggest foods that can help with energy and fighting fatigue.',
  symptoms: 'Suggest foods that may help with the symptom(s) noted below. If none are noted, ask what she is feeling today in one short line, then still give general practical food advice.',
  weight_gain: 'Suggest healthy, sustainable ways to gain weight through food choices.',
  weight_loss: 'Suggest healthy, sustainable food choices that support gradual weight loss.',
  sleep: 'Suggest foods that may support better sleep.',
  fitness: 'Suggest foods good for exercise, fitness and muscle recovery.',
  ideas: 'Just suggest 2-3 simple, practical meal ideas she could make.',
};

function formatProfile(profile: FoodProfile): string {
  const entries = Object.entries(profile).filter(([, v]) => v);
  if (!entries.length) return 'none shared yet';
  return entries.map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join('; ');
}

export async function generateFoodSuggestion(
  user: AvaUser,
  optionKey: string,
  memoryLogs: MemoryLog[]
): Promise<string> {
  const country = (user as any).country as string | undefined;
  const foodProfile = ((user as any).food_profile || {}) as FoodProfile;
  const localFoods = getCountryFoods(country).map(f => f.name).join(', ');

  let phaseContext = '';
  if (optionKey === 'today') {
    try {
      const cycleData = await getCycleData(user.id);
      if (cycleData?.period_start_dates?.length) {
        const avg = Number(cycleData.avg_cycle_length) || 28;
        const duration = cycleData.period_duration || 5;
        const sorted = [...cycleData.period_start_dates].sort();
        const lastStart = new Date(sorted[sorted.length - 1]);
        const { phase, day } = getCurrentPhase(lastStart, avg, duration);
        const dayData = getDayData(day, avg, duration);
        phaseContext = `She is currently in the ${dayData.phaseLabel} (day ${day} of ${avg}). Nutrient focus for this phase: ${dayData.nutrientTags.join(', ')}.`;
      }
    } catch {
      // Non-critical — suggestion still works without phase context.
    }
  }

  let symptomContext = '';
  if (optionKey === 'symptoms') {
    const recentSymptoms = memoryLogs.filter(l => ['symptom', 'mood'].includes(l.category)).slice(0, 3).map(l => l.summary);
    symptomContext = recentSymptoms.length
      ? `Her recently logged symptoms: ${recentSymptoms.join(', ')}.`
      : 'No recent symptoms logged.';
  }

  const instruction = OPTION_INSTRUCTIONS[optionKey] || OPTION_INSTRUCTIONS.ideas;

  const prompt = `You are Ava, a warm AI wellness companion for a period and cycle tracking app. ${instruction}

About her:
- Name: ${user.name}
- Country: ${country || 'not stated — use generally common, accessible foods'}
- Diet profile: ${formatProfile(foodProfile)}
${localFoods ? `- Common local foods you can draw from: ${localFoods}` : ''}
${phaseContext ? `- ${phaseContext}` : ''}
${symptomContext ? `- ${symptomContext}` : ''}

Rules:
- Keep it SHORT — 2-4 sentences max, like a text from a friend, not an article.
- Be specific and practical — name actual foods, not vague categories like "healthy fats".
- Respect her diet profile (avoided foods, allergies) if shared — never suggest something she said she avoids or is allergic to.
- Prefer foods from her country/culture when known, over generic Western examples.
- NEVER give calorie counts, macros, or specific numeric weight/diet targets — keep it about food quality and simple habits, not restriction or extreme advice.
- Address her as ${user.name}, warmly.
- One emoji max.`;

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 300, thinkingLevel: 'minimal' });
  return result || `I'd suggest a balanced plate with some protein, vegetables and a carb you enjoy, ${user.name} 🍽️`;
}

// ─── Callback handling (menu taps) ──────────────────────────────────────────

export async function handleFoodCallback(
  chatId: number,
  user: AvaUser,
  callbackData: string,
  send: SendFn,
  sendKb: SendWithKeyboardFn
): Promise<boolean> {
  if (!callbackData.startsWith('food_')) return false;
  const key = callbackData.replace('food_', '');

  if (key === 'menu') {
    await showFoodMenu(chatId, sendKb);
    return true;
  }

  if (key === 'learn') {
    await updateUser(user.telegram_id, { food_profile_step: 1 } as any);
    await send(chatId, FOOD_PROFILE_QUESTIONS[0].question, true);
    return true;
  }

  const option = FOOD_OPTIONS.find(o => o.key === key);
  if (!option) return true;

  const memoryLogs = await getMemoryContext(user.id, user.plan);
  const suggestion = await generateFoodSuggestion(user, key, memoryLogs);

  // Nudge toward the profile-building flow exactly once, deterministically —
  // not left to the model, which tended to repeat it on nearly every reply.
  const foodProfile = ((user as any).food_profile || {}) as FoodProfile;
  const hasAskedBefore = memoryLogs.some(l => l.category === 'insight' && l.summary?.startsWith('Asked Ava for food help'));
  const shouldNudge = !hasAskedBefore && !Object.values(foodProfile).some(Boolean);
  const nudge = shouldNudge
    ? `\n\nWant these tailored to you? Tap "📝 Update my food preferences" in the /foods menu anytime.`
    : '';

  await send(chatId, suggestion + nudge);

  const cleanLabel = option.label.replace(/^[^\p{L}\p{N}]+/u, '');
  await addMemoryLog(user.id, 'insight', `Asked Ava for food help: ${cleanLabel}`);
  return true;
}

// ─── Auto-surfacing in natural conversation ────────────────────────────────
//
// Mirrors maybeSuggestRemedy's pattern in webhook/route.ts: when a symptom
// keyword is detected in a free-flowing message, that same detector can
// signal a food-appropriate condition too. Deliberately a small, distinct
// set from remedies.ts's full condition list — food is the better fit for
// energy/craving-type things, remedies win for pain/skin/sleep-type things,
// so a message only ever triggers one unsolicited follow-up, not both.
// emotional_eating is intentionally excluded — auto-suggesting food on top
// of that risks reinforcing the exact pattern, not helping it.
export const FOOD_TRIGGER_CONDITIONS: Record<string, string> = {
  fatigue: 'energy',
  low_iron_fatigue: 'energy',
  food_cravings: 'ideas',
  brain_fog: 'energy',
};

export async function maybeSuggestFood(
  chatId: number,
  user: AvaUser,
  text: string,
  memoryLogs: MemoryLog[],
  send: SendFn
): Promise<boolean> {
  const { detectCondition } = await import('./remedies');
  const condition = detectCondition(text);
  if (!condition || !(condition in FOOD_TRIGGER_CONDITIONS)) return false;

  // Don't pile on if we've already nudged food recently — check the same
  // memory window callers already have on hand rather than a fresh query.
  const alreadySuggestedRecently = memoryLogs.some(
    l => l.category === 'insight' && l.summary?.startsWith('Auto-suggested food:')
  );
  if (alreadySuggestedRecently) return false;

  const optionKey = FOOD_TRIGGER_CONDITIONS[condition];
  const suggestion = await generateFoodSuggestion(user, optionKey, memoryLogs);
  await send(chatId, `🍽️ By the way — ${suggestion}`);
  await addMemoryLog(user.id, 'insight', `Auto-suggested food: ${optionKey}`);
  return true;
}

// ─── "Tell Ava about my diet" flow ──────────────────────────────────────────

const FOOD_PROFILE_QUESTIONS: { field: keyof FoodProfile; question: string }[] = [
  { field: 'breakfast', question: 'What do you normally eat for breakfast?' },
  { field: 'avoid', question: 'What foods do you avoid? _(or send "none")_' },
  { field: 'allergies', question: 'Any allergies? _(or send "none")_' },
  { field: 'budget', question: 'What\'s your usual food budget — 💰 Budget, 💰💰 Moderate, or 💰💰💰 Flexible?' },
  { field: 'meals_per_day', question: 'How many meals do you usually eat in a day?' },
  { field: 'cooking', question: 'Do you usually cook, buy food, or both?' },
];

export async function handleFoodProfileStep(
  chatId: number,
  telegramId: number,
  user: AvaUser,
  message: string,
  send: SendFn
): Promise<void> {
  const step = (user as any).food_profile_step as number;
  const idx = step - 1;

  if (idx < 0 || idx >= FOOD_PROFILE_QUESTIONS.length) {
    // Shouldn't normally happen — reset defensively rather than getting stuck.
    await updateUser(telegramId, { food_profile_step: 0 } as any);
    return;
  }

  const { field } = FOOD_PROFILE_QUESTIONS[idx];
  const answer = message.trim().slice(0, 200);
  const existingProfile = ((user as any).food_profile || {}) as FoodProfile;
  const updatedProfile: FoodProfile = { ...existingProfile, [field]: answer };

  const nextStep = step + 1;
  if (nextStep > FOOD_PROFILE_QUESTIONS.length) {
    await updateUser(telegramId, { food_profile: updatedProfile, food_profile_step: 0 } as any);
    await send(chatId, `Thanks — I'll use this to give you better food suggestions from now on 🍽️ Send /foods anytime you want ideas.`);
    return;
  }

  await updateUser(telegramId, { food_profile: updatedProfile, food_profile_step: nextStep } as any);
  await send(chatId, FOOD_PROFILE_QUESTIONS[nextStep - 1].question, true);
}
