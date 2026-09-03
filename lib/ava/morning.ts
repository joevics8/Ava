import type { AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { getCurrentPhase, phaseLabel, phaseEmoji } from './cycle';

const PRO = 'gemini-3-flash-preview';
const FLASH = 'gemini-1.5-flash';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

async function callGemini(model: string, prompt: string): Promise<string> {
  try {
    const res = await fetch(geminiUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200 },
      }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  } catch { return ''; }
}

// ─── Phase-specific predictions ───────────────────────────────────────────────

const phaseSymptoms: Record<string, string> = {
  menstrual: 'You may experience cramps, fatigue, or lower back discomfort today.',
  follicular: 'Energy tends to rise in this phase — a good day to be active.',
  ovulation: 'You may notice mild pelvic twinges or increased energy and mood.',
  luteal: 'You may notice higher body temperature, cramps, bloating, or a light headache.',
};

// ─── Fertility display ────────────────────────────────────────────────────────

function getFertilityLine(
  dayOfCycle: number,
  avgCycleLength: number,
  goal: string
): string {
  const ovulationDay = avgCycleLength - 14;
  const dist = Math.abs(dayOfCycle - ovulationDay);

  let level: string;
  let prob: number;

  if (dist === 0) { level = 'peak'; prob = 98; }
  else if (dist <= 1) { level = 'very high'; prob = 85; }
  else if (dist <= 2) { level = 'high'; prob = 65; }
  else if (dist <= 4) { level = 'medium'; prob = 30; }
  else { level = 'low'; prob = 5; }

  const wantsToConceive = goal === 'conceive';
  const wantsToAvoid = goal === 'prevent';

  if (level === 'peak' || level === 'very high') {
    return wantsToConceive
      ? `🟢 *Peak fertility* — best time to try (${prob}%)`
      : wantsToAvoid
      ? `🔴 *Peak fertility window* — be extra careful today (${prob}%)`
      : `✨ *Peak fertility* — ovulation likely today (${prob}%)`;
  }
  if (level === 'high') {
    return wantsToConceive
      ? `🟡 *High fertility* — good window to try (${prob}%)`
      : wantsToAvoid
      ? `🟠 *Higher fertility* — take precautions today (${prob}%)`
      : `🟡 *Higher fertility* — fertile window open (${prob}%)`;
  }
  if (level === 'medium') {
    return wantsToConceive
      ? `⚪ *Medium fertility* — possible but not peak (${prob}%)`
      : wantsToAvoid
      ? `⚪ *Lower risk* — but not zero (${prob}%)`
      : `⚪ *Medium fertility* (${prob}%)`;
  }
  return wantsToConceive
    ? `⚪ *Low fertility* — not the best window right now (${prob}%)`
    : wantsToAvoid
    ? `🟢 *Low fertility* — relatively safe today (${prob}%)`
    : `⚪ *Low fertility* today (${prob}%)`;
}

// ─── Check history for a relevant personal insight ────────────────────────────

async function getPersonalInsight(
  user: AvaUser,
  phase: string,
  dayOfCycle: number,
  logs: MemoryLog[]
): Promise<string | null> {
  if (logs.length < 14) return null;

  const prompt = `A woman is on day ${dayOfCycle} of her cycle in the ${phase} phase.

Her recent health log:
${logs.slice(0, 30).map(l => `[${l.category}] ${l.summary}`).join('\n')}

Is there a specific pattern in her history that's relevant to where she is in her cycle RIGHT NOW?
Examples: "You usually get cramps around this time", "Your energy tends to dip around day ${dayOfCycle}", "Acne tends to appear for you in the ${phase} phase"

If yes, write ONE short sentence starting with "You usually..." or "You tend to..." based strictly on what you see in the data.
If there's no clear pattern relevant to today, reply with: NONE

Reply with only the sentence or NONE. No preamble.`;

  const result = await callGemini(FLASH, prompt);
  if (!result || result.trim() === 'NONE' || result.includes('NONE')) return null;
  return result.trim();
}

// ─── Generate tip for today's phase ──────────────────────────────────────────

async function getDailyTip(phase: string, userName: string): Promise<string> {
  const prompt = `Write a single short wellness tip for a woman in her ${phase} phase. 
1 sentence only. Practical, warm, specific to this phase. No preamble. No name.`;
  const result = await callGemini(FLASH, prompt);
  return result || 'Stay hydrated and be gentle with yourself today.';
}

// ─── Build the morning message ────────────────────────────────────────────────

export async function buildMorningDigest(
  user: AvaUser,
  cycleData: any,
  logs: MemoryLog[]
): Promise<{ text: string; showMoodButtons: boolean }> {
  if (!cycleData?.period_start_dates?.length) {
    return {
      text: `Good morning, ${user.name} 🌸\n\nI need your period dates to personalise your daily briefing. Send /settings to add them.`,
      showMoodButtons: false,
    };
  }

  const avg = Number(cycleData.avg_cycle_length) || 28;
  const duration = cycleData.period_duration || 5;
  const lastStart = new Date(cycleData.period_start_dates[cycleData.period_start_dates.length - 1]);
  const { phase, day } = getCurrentPhase(lastStart, avg, duration);

  const fertilityLine = getFertilityLine(day, avg, user.reproductive_goal || 'track');
  const symptomLine = phaseSymptoms[phase];

  // Decide: personal insight or generic tip?
  const [personalInsight, genericTip] = await Promise.all([
    getPersonalInsight(user, phase, day, logs),
    getDailyTip(phase, user.name || 'there'),
  ]);

  const insightOrTip = personalInsight
    ? `🧠 *Ava noticed:* ${personalInsight}`
    : `💡 ${genericTip}`;

  // Next period
  let nextLine = '';
  if (cycleData.next_period_start) {
    const next = new Date(cycleData.next_period_start);
    const daysUntil = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7 && daysUntil > 0) {
      nextLine = `\n📅 Period in ~${daysUntil} days`;
    } else if (daysUntil <= 0) {
      nextLine = `\n📅 Period expected around now`;
    }
  }

  const text =
    `Good morning, ${user.name} 🌸\n` +
    `${phaseEmoji[phase]} *${phaseLabel[phase]}* · Day ${day} of ${avg}\n\n` +
    `🌡️ *Today:* ${symptomLine}\n` +
    `${fertilityLine}${nextLine}\n\n` +
    `${insightOrTip}\n\n` +
    `How are you feeling this morning?`;

  return { text, showMoodButtons: true };
}

// ─── Mood keyboard payload ────────────────────────────────────────────────────

export const moodButtons = [
  [
    { text: '😊 Good', callback_data: 'mood_good' },
    { text: '😐 Okay', callback_data: 'mood_okay' },
    { text: '😣 Not great', callback_data: 'mood_notgreat' },
  ],
];
