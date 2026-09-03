import type { AvaUser } from '@/types';
import type { MemoryLog } from '@/types';

const FLASH = 'gemini-1.5-flash';
const PRO = 'gemini-3-flash-preview';

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
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  } catch {
    return '';
  }
}

function formatLogs(logs: MemoryLog[]): string {
  return logs
    .map(l => {
      const date = new Date(l.logged_at).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
      return `[${l.category}] ${l.summary} — ${date}`;
    })
    .join('\n');
}

// ─── What have you learned about me? ─────────────────────────────────────────

export async function generatePersonalInsights(
  user: AvaUser,
  logs: MemoryLog[],
  cycleData: any
): Promise<string> {
  if (logs.length < 5) {
    return `I'm still getting to know you, ${user.name} 🌸 The more you share with me, the more I'll be able to tell you about your patterns. Check back after a few more days.`;
  }

  const prompt = `You are Ava, a warm AI wellness companion. Based on this woman's health log, tell her what you've learned about her body and patterns.

User: ${user.name}, age ${user.age}
Cycle: ${cycleData?.avg_cycle_length || 28} days, period lasts ${cycleData?.period_duration || 5} days
Goal: ${user.reproductive_goal}
Conditions: ${user.conditions?.join(', ') || 'none stated'}

Her health log (most recent first):
${formatLogs(logs)}

Write a warm, personal response as if you're a friend sharing observations. Structure it as:
- 2-3 specific patterns you've noticed (be specific, use her actual data)
- 1 positive observation
- 1 thing worth keeping an eye on (never diagnostic)

Tone: warm, specific, personal. Never clinical. Max 200 words. Use her name once.`;

  const result = await callGemini(PRO, prompt);
  return result || `I've been learning a lot about you, ${user.name}! Keep sharing and I'll give you a full picture soon 🌸`;
}

// ─── What has changed recently? ───────────────────────────────────────────────

export async function generateRecentChanges(
  user: AvaUser,
  logs: MemoryLog[]
): Promise<string> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recent = logs.filter(l => new Date(l.logged_at) >= thirtyDaysAgo);
  const previous = logs.filter(l => {
    const d = new Date(l.logged_at);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  if (recent.length < 3) {
    return `I need a bit more recent data to spot changes, ${user.name} 🌸 Keep sharing and I'll have something for you soon.`;
  }

  const prompt = `You are Ava, a warm AI wellness companion. Compare this woman's recent health data to the previous period and tell her what's changed.

User: ${user.name}

Last 30 days:
${formatLogs(recent)}

Previous 30 days:
${previous.length > 0 ? formatLogs(previous) : 'No data for this period'}

Identify 2-3 genuine changes or trends between the two periods. Be specific. If there's not enough to compare, say so warmly.

Tone: warm, conversational, like a friend who's been paying attention. Max 150 words. Never clinical or diagnostic.`;

  const result = await callGemini(PRO, prompt);
  return result || `Looking at your recent patterns, ${user.name} — things seem fairly consistent 🌸 Keep logging and I'll spot changes as they develop.`;
}

// ─── Pattern detection (change detector, pain monitor, etc.) ──────────────────

export async function detectPatterns(
  user: AvaUser,
  logs: MemoryLog[],
  cycleData: any
): Promise<{
  acne: string | null;
  energy: string | null;
  pain: string | null;
  mood: string | null;
  discharge: string | null;
  changeDetected: string | null;
}> {
  if (logs.length < 10) {
    return { acne: null, energy: null, pain: null, mood: null, discharge: null, changeDetected: null };
  }

  const prompt = `Analyse this woman's health log and identify specific recurring patterns. Only report a pattern if you can see clear evidence across multiple entries.

User: ${user.name}
Cycle length: ${cycleData?.avg_cycle_length || 28} days

Health log:
${formatLogs(logs.slice(0, 60))}

Respond in this exact JSON format (no markdown):
{
  "acne": "one sentence about acne pattern, or null if no pattern",
  "energy": "one sentence about energy/fatigue pattern, or null",
  "pain": "one sentence about pain/cramp pattern, or null",
  "mood": "one sentence about mood pattern, or null",
  "discharge": "one sentence about discharge pattern, or null",
  "changeDetected": "one sentence if cycles/symptoms have noticeably changed recently, or null"
}

Rules: Only report what you actually see in the data. Never invent patterns. Never diagnose.`;

  try {
    const result = await callGemini(FLASH, prompt);
    const clean = result.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { acne: null, energy: null, pain: null, mood: null, discharge: null, changeDetected: null };
  }
}

// ─── Doctor visit prep ────────────────────────────────────────────────────────

export async function generateDoctorPrep(
  user: AvaUser,
  logs: MemoryLog[],
  cycleData: any
): Promise<string> {
  const prompt = `You are Ava, a wellness companion. Generate a concise doctor visit summary for this woman to bring to her appointment.

User: ${user.name}, age ${user.age}
Conditions: ${user.conditions?.join(', ') || 'none stated'}
Birth control: ${user.birth_control || 'none'}
Cycle: ${cycleData?.avg_cycle_length || 28} days average, ${cycleData?.period_duration || 5} days long
Last period: ${cycleData?.period_start_dates?.slice(-1)[0] || 'unknown'}

Recent health log:
${formatLogs(logs.slice(0, 40))}

Write a clear, concise summary a doctor would find useful:
1. Cycle overview (2-3 lines)
2. Recurring symptoms (bullet points, only what appears in the data)
3. Notable changes or concerns (if any)
4. Questions she might want to ask (2-3 based on her patterns)

Keep it factual, clear, and under 250 words. This is for a real doctor visit.`;

  const result = await callGemini(PRO, prompt);
  return result || `I couldn't generate your summary right now — please try again 🌸`;
}

// ─── Weekly briefing ──────────────────────────────────────────────────────────

export async function generateWeeklyBriefing(
  user: AvaUser,
  logs: MemoryLog[],
  cycleData: any
): Promise<string> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thisWeek = logs.filter(l => new Date(l.logged_at) >= sevenDaysAgo);

  if (thisWeek.length === 0) {
    return `Not much happened this week in your log, ${user.name} 🌸 The more you share, the richer your weekly briefing gets.`;
  }

  const nextPeriod = cycleData?.next_period_start
    ? new Date(cycleData.next_period_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
    : 'unknown';

  const prompt = `You are Ava. Write a warm, personal weekly health briefing for ${user.name}.

This week's log:
${formatLogs(thisWeek)}

Next period estimated: ${nextPeriod}
Cycle day: roughly day ${Math.floor((Date.now() - new Date(cycleData?.period_start_dates?.slice(-1)[0] || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) + 1}

Write a 3-paragraph weekly briefing:
1. What stood out this week (based on actual log entries)
2. Where she is in her cycle and what to expect next week
3. One gentle, actionable suggestion based on her patterns

Tone: like a caring friend catching up. Max 180 words.`;

  const result = await callGemini(PRO, prompt);
  return result || `Here's your weekly check-in, ${user.name} 🌸 Keep logging and I'll give you richer summaries each week.`;
}
