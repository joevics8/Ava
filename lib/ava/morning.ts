import type { AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { getCurrentPhase, phaseEmoji } from './cycle';
import { getDayData } from './cycle-lookup';
import { localizeEatTip } from './food-data';

// Was 'gemini-1.5-flash' — a shut-down model returning 404s in production
// (confirmed via Vercel runtime logs), which broke the morning digest tip.
const FLASH = 'gemini-3.1-flash-lite';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

function extractTextAndFinish(data: any): { text: string; finishReason?: string } {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p: any) => p?.text && !p?.thought)
    .map((p: any) => p.text)
    .join('')
    .trim();
  return { text, finishReason: data?.candidates?.[0]?.finishReason };
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
    const { text, finishReason } = extractTextAndFinish(data);
    if (finishReason && finishReason !== 'STOP') {
      console.error('Gemini non-STOP finish (morning.ts):', { finishReason, textLength: text.length, usage: data?.usageMetadata });
    }
    if (finishReason === 'MAX_TOKENS') {
      // Retry once with a bigger budget so the tip doesn't stop mid-sentence.
      const retryRes = await fetch(geminiUrl(FLASH), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 500, thinkingConfig: { thinkingLevel: 'minimal' } },
        }),
      });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        return extractTextAndFinish(retryData).text || text;
      }
    }
    return text;
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

// Check memory for a personal pattern relevant to today. Gated behind a full
// month of actual history (not just a log count) — before that, there
// isn't enough data across enough of the cycle to honestly claim "you tend
// to X"; it would just be pattern-matching on a handful of recent entries
// and asserting a personal trend that isn't really established yet. Since
// free users are capped at 14 days of retained history, this gate means
// free users structurally never see this — which is the intended tradeoff,
// not a bug: a real pattern claim needs real history, and free doesn't
// have enough of it yet.
export function hasMonthOfHistory(logs: MemoryLog[]): boolean {
  if (logs.length === 0) return false;
  const oldest = logs[logs.length - 1]; // logs are ordered most-recent-first
  const daysSpan = (Date.now() - new Date(oldest.logged_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSpan >= 30;
}

export async function getPersonalInsight(
  phase: string,
  day: number,
  logs: MemoryLog[]
): Promise<string | null> {
  if (logs.length < 10 || !hasMonthOfHistory(logs)) return null;

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
  // Pregnant-mode users should get a pregnancy week update, not cycle/
  // fertility content — this was previously missing entirely, so pregnant
  // users got a digest talking about fertile windows and cycle days, which
  // makes no sense once you're already pregnant.
  if ((user as any).mode === 'pregnant') {
    const pregnancyStart = (user as any).pregnancy_start_date;
    if (!pregnancyStart) {
      return {
        text: `${getGreeting()}, ${user.name} 🌸\n\nI need your last period date to track your pregnancy. Send /settings to add it.`,
        showMoodButtons: false,
      };
    }
    const { getPregnancyWeek, getWeeklyInsight } = await import('./pregnancy');
    const { week, trimesterName, daysUntilDue, dueDate } = getPregnancyWeek(new Date(pregnancyStart));
    const insight = getWeeklyInsight(week);
    const dueDateStr = dueDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
    const text =
      `${getGreeting()}, ${user.name} 🌸\n` +
      `🤰 *Week ${week} — ${trimesterName}*\n\n` +
      `📅 Due date: *${dueDateStr}*\n` +
      `⏳ ${daysUntilDue > 0 ? `${daysUntilDue} days to go` : 'Any day now!'}\n\n` +
      `💡 ${insight}\n\n` +
      `How are you feeling this morning?`;
    return { text, showMoodButtons: true };
  }

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

  // ── Personal insight — only with a real month of history behind it. When
  // it exists, it replaces the generic "Today:" line entirely rather than
  // sitting alongside it — both would be making the same kind of claim
  // (what's typical for this person at this point), and once there's real
  // data backing the insight, the generic phase description is redundant
  // rather than complementary.
  const personalInsight = await getPersonalInsight(phase, day, logs);

  const todaySection = personalInsight
    ? null
    : '🌡️ *Today:* ' + dayData.symptomsGeneric;

  const eatLine = '🍽️ *Eat:* ' + localizeEatTip(
    dayData.eatTipGeneric, dayData.nutrientTags, dayData.eatReasonClause, (user as any).country
  );
  const doLine = '🏃 *Do:* ' + dayData.doTipGeneric;
  const actionLines = eatLine + '\n\n' + doLine;

  const insightSection = personalInsight
    ? '🧠 ' + personalInsight + '\n' + actionLines
    : actionLines;

  // ── Extra actionable help for the toughest days ────────────────────────────
  // Days 1-2 of a period are usually the most acute (heaviest flow, worst
  // cramps) — the digest was giving the same descriptive-only treatment as
  // any other day. Surfacing a concrete, free remedy here makes it actually
  // useful right when it's needed most, not just informative.
  let remedyLine = '';
  if (phase === 'menstrual' && day <= 2) {
    try {
      const { getAllRemedies } = await import('./remedy-engine');
      const all = await getAllRemedies();
      const freeCrampsRemedy = all.find((r: any) => r.condition === 'cramps' && !r.premium);
      if (freeCrampsRemedy) {
        remedyLine = `🌿 *Try today:* ${freeCrampsRemedy.name} — ${freeCrampsRemedy.description.split('.')[0]}. Send /remedies for more.`;
      }
    } catch {
      // Non-critical — digest still works without this line if it fails.
    }
  }

  // ── Next period line ──────────────────────────────────────────────────────
  let nextLine = '';
  if (cycleData.next_period_start) {
    const next = new Date(cycleData.next_period_start);
    const daysUntil = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil === 0) nextLine = '📅 Period expected around now';
    else if (daysUntil > 0 && daysUntil <= 5) nextLine = '📅 Period in ~' + daysUntil + ' days';
  }

  // ── Assemble ──────────────────────────────────────────────────────────────
  const sections = [
    getGreeting() + ', ' + user.name + ' 🌸\n' +
      phaseEmoji[phase] + ' *' + dayData.phaseLabel + '* · Day ' + day + ' of ' + avg,
    dayData.fertilityEmoji + ' *Fertility possibility: ' + dayData.fertilityLabel + '*',
  ];
  if (todaySection) sections.push(todaySection);
  if (nextLine || remedyLine) sections.push([nextLine, remedyLine].filter(Boolean).join('\n'));
  sections.push(insightSection);
  sections.push('How are you feeling this morning?');

  return { text: sections.join('\n\n'), showMoodButtons: true };
}

export const moodButtons = [
  [
    { text: '😊 Good', callback_data: 'mood_good' },
    { text: '😐 Okay', callback_data: 'mood_okay' },
    { text: '😣 Not great', callback_data: 'mood_notgreat' },
  ],
];
