import type { AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { getCurrentPhase, phaseLabel, phaseEmoji } from './cycle';
import { getFertilityRate, getFertilityLabel, getDayInsight, getDayOfPhase } from './cycle-data';

const FLASH = 'gemini-1.5-flash';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

async function callGemini(prompt: string): Promise<string> {
  try {
    const res = await fetch(geminiUrl(FLASH), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 120 },
      }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  } catch { return ''; }
}

// ─── Check history for a personal insight ────────────────────────────────────

async function getPersonalInsight(
  phase: string,
  day: number,
  logs: MemoryLog[]
): Promise<string | null> {
  if (logs.length < 10) return null;

  const prompt = `A woman is on cycle day ${day} in the ${phase} phase.

Her recent health log:
${logs.slice(0, 20).map(l => '[' + l.category + '] ' + l.summary).join('\n')}

Is there ONE specific pattern in her history relevant to TODAY in her cycle?
Examples: "You usually get cramps around now" / "Your energy tends to dip at this point" / "Acne tends to flare for you in this phase"

Only state a pattern if you can clearly see it repeated in the data.
Reply with ONE short sentence starting with "You usually..." or "You tend to..." or NONE.`;

  const result = await callGemini(prompt);
  if (!result || result.toUpperCase().includes('NONE')) return null;
  return result.trim();
}

// ─── Greeting by time ────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getUTCHours() + 1; // WAT
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Build morning digest ─────────────────────────────────────────────────────

export async function buildMorningDigest(
  user: AvaUser,
  cycleData: any,
  logs: MemoryLog[]
): Promise<{ text: string; showMoodButtons: boolean }> {
  if (!cycleData?.period_start_dates?.length) {
    return {
      text: `${getGreeting()}, ${user.name} 🌸\n\nI need your period dates to personalise your daily briefing. Send /settings to add them.`,
      showMoodButtons: false,
    };
  }

  const avg = Number(cycleData.avg_cycle_length) || 28;
  const duration = cycleData.period_duration || 5;
  const lastStart = new Date(cycleData.period_start_dates[cycleData.period_start_dates.length - 1]);
  const { phase, day } = getCurrentPhase(lastStart, avg, duration);
  const dayOfPhase = getDayOfPhase(day, phase, avg, duration);

  // ── Standard lookups — no AI needed ──────────────────────────────────────
  const fertilityRate = getFertilityRate(day, avg);
  const { emoji: fertEmoji, label: fertLabel } = getFertilityLabel(
    fertilityRate,
    user.reproductive_goal || 'track'
  );
  const { symptoms, tip } = getDayInsight(phase, dayOfPhase);

  // ── Personal insight (AI only if enough history) ──────────────────────────
  const personalInsight = await getPersonalInsight(phase, day, logs);
  const insightLine = personalInsight
    ? '🧠 Ava noticed: ' + personalInsight
    : '💡 ' + tip;

  // ── Next period warning ───────────────────────────────────────────────────
  let nextLine = '';
  if (cycleData.next_period_start) {
    const next = new Date(cycleData.next_period_start);
    const daysUntil = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil === 0) nextLine = '\n📅 Period expected around now';
    else if (daysUntil > 0 && daysUntil <= 5) nextLine = '\n📅 Period in ~' + daysUntil + ' days';
  }

  // ── Assemble — fertility BEFORE today ─────────────────────────────────────
  const text =
    getGreeting() + ', ' + user.name + ' 🌸\n' +
    phaseEmoji[phase] + ' *' + phaseLabel[phase] + '* · Day ' + day + ' of ' + avg + '\n\n' +
    fertEmoji + ' *Fertility:* ' + fertLabel + '\n\n' +
    '🌡️ *Today:* ' + symptoms +
    nextLine + '\n\n' +
    insightLine + '\n\n' +
    'How are you feeling this morning?';

  return { text, showMoodButtons: true };
}

// ─── Mood keyboard ────────────────────────────────────────────────────────────

export const moodButtons = [
  [
    { text: '😊 Good', callback_data: 'mood_good' },
    { text: '😐 Okay', callback_data: 'mood_okay' },
    { text: '😣 Not great', callback_data: 'mood_notgreat' },
  ],
];
