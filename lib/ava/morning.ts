import type { AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { getCurrentPhase, phaseEmoji } from './cycle';
import { getDayData, getConfidenceLevel, personaliseSymptomLine } from './cycle-lookup';

// Was 'gemini-1.5-flash' — a shut-down model returning 404s in production
// (confirmed via Vercel runtime logs), which broke the morning digest tip.
const FLASH = 'gemini-3.1-flash-lite';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

function extractText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p: any) => p?.text && !p?.thought)
    .map((p: any) => p.text)
    .join('')
    .trim();
}

async function callGemini(prompt: string): Promise<string> {
  try {
    const res = await fetch(geminiUrl(FLASH), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // 80 tokens left zero room once thinking tokens are deducted from
        // the same budget — bump it and cap thinking for this short task.
        generationConfig: { maxOutputTokens: 250, thinkingConfig: { thinkingLevel: 'minimal' } },
      }),
    });
    if (!res.ok) {
      console.error('Gemini API error (morning.ts):', JSON.stringify(await res.json().catch(() => ({}))));
      return '';
    }
    const data = await res.json();
    return extractText(data);
  } catch (err) {
    console.error('Gemini fetch error (morning.ts):', err);
    return '';
  }
}

function getGreeting(): string {
  const hour = new Date().getUTCHours() + 1;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Check memory for a personal pattern relevant to today
async function getPersonalInsight(
  phase: string,
  day: number,
  logs: MemoryLog[]
): Promise<string | null> {
  if (logs.length < 10) return null;

  const prompt = `A woman is on cycle day ${day} in the ${phase} phase.

Her recent logs:
${logs.slice(0, 15).map(l => '[' + l.category + '] ' + l.summary).join('\n')}

Is there a clear recurring pattern in her logs relevant to THIS phase?
Reply with ONE sentence starting with "You usually..." or "You tend to..." 
Only if you clearly see a pattern. Otherwise reply: NONE`;

  const result = await callGemini(prompt);
  if (!result || result.toUpperCase().includes('NONE')) return null;
  return result.trim();
}

export async function buildMorningDigest(
  user: AvaUser,
  cycleData: any,
  logs: MemoryLog[]
): Promise<{ text: string; showMoodButtons: boolean }> {
  if (!cycleData?.period_start_dates?.length) {
    return {
      text: `${getGreeting()}, ${user.name} 🌸\n\nI need your period dates to personalise your briefing. Send /settings to add them.`,
      showMoodButtons: false,
    };
  }

  const avg = Number(cycleData.avg_cycle_length) || 28;
  const duration = cycleData.period_duration || 5;
  const lastStart = new Date(cycleData.period_start_dates[cycleData.period_start_dates.length - 1]);
  const { phase, day } = getCurrentPhase(lastStart, avg, duration);

  // ── Research-based lookup — no AI, no estimation ──────────────────────────
  const dayData = getDayData(day, avg, duration);

  // ── Personalise symptom line from memory ──────────────────────────────────
  const symptomLine = personaliseSymptomLine(
    dayData.phase,
    dayData.symptomsGeneric,
    logs,
    day
  );

  // ── Confidence level ──────────────────────────────────────────────────────
  const numCycles = cycleData.period_start_dates.length;
  const recentLogs = logs.slice(0, 30).map(l => l.summary).join(' ').toLowerCase();
  const hasLH = recentLogs.includes('lh') || recentLogs.includes('ovulation test') || recentLogs.includes('strip');
  const hasBBT = recentLogs.includes('bbt') || recentLogs.includes('temperature');
  const hasMucus = recentLogs.includes('mucus') || recentLogs.includes('discharge');
  const { label: confidence } = getConfidenceLevel(numCycles, hasLH, hasBBT, hasMucus);

  // ── Personal insight — AI only if enough history ──────────────────────────
  const personalInsight = await getPersonalInsight(phase, day, logs);
  const insightLine = personalInsight
    ? '🧠 ' + personalInsight
    : '💡 ' + dayData.tipGeneric;

  // ── Next period line ──────────────────────────────────────────────────────
  let nextLine = '';
  if (cycleData.next_period_start) {
    const next = new Date(cycleData.next_period_start);
    const daysUntil = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil === 0) nextLine = '\n📅 Period expected around now';
    else if (daysUntil > 0 && daysUntil <= 5) nextLine = '\n📅 Period in ~' + daysUntil + ' days';
  }

  // ── Assemble ──────────────────────────────────────────────────────────────
  const text =
    getGreeting() + ', ' + user.name + ' 🌸\n' +
    phaseEmoji[phase] + ' *' + dayData.phaseLabel + '* · Day ' + day + ' of ' + avg +
    ' · Confidence: ' + confidence + '\n\n' +
    dayData.fertilityEmoji + ' *Fertility: ' + dayData.fertilityLabel + '*\n\n' +
    '🌡️ *Today:* ' + symptomLine +
    nextLine + '\n\n' +
    insightLine + '\n\n' +
    'How are you feeling this morning?';

  return { text, showMoodButtons: true };
}

export const moodButtons = [
  [
    { text: '😊 Good', callback_data: 'mood_good' },
    { text: '😐 Okay', callback_data: 'mood_okay' },
    { text: '😣 Not great', callback_data: 'mood_notgreat' },
  ],
];
