import type { MessageCategory, AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { formatMemoryForAI } from './db';

// URLs built lazily at call time so env vars are always available
const FLASH = 'gemini-1.5-flash';
const PRO = 'gemini-1.5-pro';

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

Message: "${message}"

Reply with ONLY one word: LOG, RETRIEVAL, or CONVERSATION`;

  const result = await callGemini(FLASH, prompt);
  const clean = result.trim().toUpperCase();
  if (['LOG', 'RETRIEVAL', 'CONVERSATION'].includes(clean)) return clean as MessageCategory;
  return 'CONVERSATION';
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
- Keep responses under 200 words unless they ask for detail
- Use emojis sparingly (1-2 max)`;

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
