import type { MessageCategory, AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { formatMemoryForAI } from './db';

// URLs built lazily at call time so env vars are always available
const FLASH = 'gemini-3.1-flash-lite';
const PRO = 'gemini-3-flash-preview';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

async function callGemini(model: string, prompt: string, systemPrompt?: string): Promise<string> {
  const contents = systemPrompt
    ? [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }]
    : [{ role: 'user', parts: [{ text: prompt }] }];

  try {
    const res = await fetch(geminiUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 800 } }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      return '';
    }

    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  } catch (err) {
    console.error('Gemini fetch error:', err);
    return '';
  }
}

// ─── Classify incoming message ────────────────────────────────────────────────

export async function classifyMessage(message: string): Promise<MessageCategory> {
  const prompt = `Classify this message from a period/wellness tracking app user into exactly one category:

LOG - user reporting a symptom, feeling, activity, or observation (e.g. "I have cramps", "had sex today", "feeling tired")
RETRIEVAL - user asking about their own history or patterns (e.g. "when was my last period", "do I usually get headaches before my period")
CONVERSATION - question, concern, medical query, or anything else (e.g. "is this normal", "why am I so bloated", "when should I test for pregnancy")
IMAGE - user sent a photo or mentions a test strip photo

Message: "${message}"

Reply with ONLY one word: LOG, RETRIEVAL, CONVERSATION, or IMAGE`;

  const result = await callGemini(FLASH, prompt);
  const clean = result.trim().toUpperCase();
  if (['LOG', 'RETRIEVAL', 'CONVERSATION', 'IMAGE'].includes(clean)) return clean as MessageCategory;
  return 'CONVERSATION';
}

// ─── Detect if premium upsell is appropriate ──────────────────────────────────

export async function shouldSuggestPremium(
  message: string,
  plan: 'free' | 'premium'
): Promise<boolean> {
  if (plan === 'premium') return false;

  const prompt = `A free user of a period tracking app sent this message. Should the app suggest upgrading to premium?

Suggest premium if:
- They ask about history or patterns from more than 2 weeks ago
- They express frustration that the app doesn't remember something
- They ask for a report, detailed history, or PDF
- They mention wanting more personalised insights over time
- They ask about features that need memory (patterns, trends, month comparisons)

Do NOT suggest premium for:
- Logging symptoms
- Asking about their cycle today
- General health questions
- First-time users

Message: "${message}"

Reply with only YES or NO.`;

  const result = await callGemini(FLASH, prompt);
  return result.trim().toUpperCase() === 'YES';
}

// ─── Generate contextual premium pitch ───────────────────────────────────────

export async function generatePremiumPitch(
  userName: string,
  message: string
): Promise<string> {
  const prompt = `A free user of Ava (AI period tracking app) asked: "${message}"

Write a 2-sentence response that:
1. Briefly acknowledges what they asked
2. Naturally explains that Premium unlocks this (5 months memory, patterns, daily digest, PDF reports — ₦2,000/month)
3. Ends with something like "Want me to send you the upgrade link?"

Warm, friendly tone. Not pushy. Max 3 sentences.`;

  const result = await callGemini(FLASH, prompt);
  return result || `That's something I can do better with Premium — it gives me 5 months of memory so I can spot your patterns properly. Want me to send you the upgrade link, ${userName}? 🌸`;
}

// ─── Extract log summary for memory ──────────────────────────────────────────

export async function extractLogSummary(message: string): Promise<{ category: string; summary: string }> {
  const prompt = `Extract a short memory log entry from this message for a period tracking app.

Message: "${message}"

Reply in this exact JSON format (no markdown, no backticks):
{"category":"symptom|mood|sexual|cycle|test|bbt|mucus|flow","summary":"10 words max describing what was logged"}`;

  const result = await callGemini(FLASH, prompt);
  try {
    const parsed = JSON.parse(result.trim());
    return { category: parsed.category || 'symptom', summary: parsed.summary || message.slice(0, 60) };
  } catch {
    return { category: 'symptom', summary: message.slice(0, 60) };
  }
}

// ─── Handle RETRIEVAL with memory context ─────────────────────────────────────

export async function handleRetrieval(
  user: AvaUser,
  message: string,
  memoryLogs: MemoryLog[]
): Promise<string> {
  const context = formatMemoryForAI(memoryLogs);
  const prompt = `The user is asking about their cycle or health history. Use their logged data to answer.

User name: ${user.name}
Goal: ${user.reproductive_goal}
Memory log (most recent first):
${context}

User question: "${message}"

Answer warmly and specifically using their data. If you spot a pattern, mention it. Keep it under 150 words.`;

  const result = await callGemini(FLASH, prompt);
  return result || `I don't have enough data to answer that yet, ${user.name}. Keep logging and I'll spot patterns for you 🌸`;
}

// ─── Handle CONVERSATION with Pro model ───────────────────────────────────────

export async function handleConversation(
  user: AvaUser,
  message: string,
  memoryLogs: MemoryLog[]
): Promise<string> {
  const context = formatMemoryForAI(memoryLogs);

  const systemPrompt = `You are Ava, a warm, knowledgeable AI wellness companion for a period and cycle tracking app.

About this user:
- Name: ${user.name}
- Age: ${user.age}
- Reproductive goal: ${user.reproductive_goal}
- Known conditions: ${user.conditions?.join(', ') || 'none stated'}
- Birth control: ${user.birth_control || 'none stated'}

Their recent health log:
${context}

Rules:
- Speak like a caring, informed friend — warm but not cheesy
- Use their name occasionally
- Reference their personal data when relevant
- NEVER diagnose or prescribe
- For serious symptoms, always say "worth checking with your doctor"
- Keep responses to 2-3 sentences MAX. Never more. If they ask for detail, still max 4 sentences.
- One emoji max`;

  const result = await callGemini(PRO, message, systemPrompt);
  return result || `I'm here, ${user.name}. Could you tell me a bit more so I can help? 🌸`;
}

// ─── Generate daily tip ───────────────────────────────────────────────────────

export async function generateDailyTip(
  user: AvaUser,
  phase: string,
  memoryLogs: MemoryLog[]
): Promise<string> {
  const recentSymptoms = memoryLogs.slice(0, 10).map(l => l.summary).join(', ');
  const prompt = `Generate a short, friendly daily wellness tip for a woman in her ${phase} phase.

Her name: ${user.name}
Recent logs: ${recentSymptoms || 'nothing yet'}
Goal: ${user.reproductive_goal}

Write 1-2 sentences max. Warm, specific, actionable. No fluff. No preamble.`;

  const result = await callGemini(FLASH, prompt);
  return result || 'Stay hydrated and be gentle with yourself today 🌸';
}

// ─── Summarize chat insight for memory ────────────────────────────────────────

export async function summarizeChatInsight(
  userMessage: string,
  aiResponse: string
): Promise<string> {
  const prompt = `Summarize the key health insight from this conversation in 10 words or less.

User: "${userMessage}"
Ava: "${aiResponse}"

Reply with only the summary. No punctuation at the end.`;

  const result = await callGemini(FLASH, prompt);
  return result.slice(0, 80) || userMessage.slice(0, 60);
}
