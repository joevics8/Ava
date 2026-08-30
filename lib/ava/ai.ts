import type { MessageCategory, AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { formatMemoryForAI } from './db';

const GEMINI_FLASH_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
const GEMINI_PRO_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function callGemini(url: string, prompt: string, systemPrompt?: string): Promise<string> {
  const contents = systemPrompt
    ? [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] },
      ]
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 800 } }),
  });

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── Step 1: Classify incoming message ───────────────────────────────────────

export async function classifyMessage(message: string): Promise<MessageCategory> {
  const prompt = `Classify this message from a period/wellness tracking app user into exactly one category:

LOG - user reporting a symptom, feeling, activity, or observation (e.g. "I have cramps", "had sex today", "feeling tired")
RETRIEVAL - user asking about their own history or patterns (e.g. "when was my last period", "do I usually get headaches before my period")
CONVERSATION - question, concern, medical query, or anything else (e.g. "is this normal", "why am I so bloated", "when should I test for pregnancy")

Message: "${message}"

Reply with ONLY one word: LOG, RETRIEVAL, or CONVERSATION`;

  const result = await callGemini(GEMINI_FLASH_URL, prompt);
  const clean = result.trim().toUpperCase();
  if (['LOG', 'RETRIEVAL', 'CONVERSATION'].includes(clean)) {
    return clean as MessageCategory;
  }
  return 'CONVERSATION'; // default
}

// ─── Step 2: Extract summary for memory log ───────────────────────────────────

export async function extractLogSummary(message: string): Promise<{ category: string; summary: string }> {
  const prompt = `Extract a short memory log entry from this message for a period tracking app.

Message: "${message}"

Reply in this exact JSON format (no markdown):
{
  "category": "symptom|mood|sexual|cycle|test|bbt|mucus",
  "summary": "10 words max describing what was logged"
}`;

  const result = await callGemini(GEMINI_FLASH_URL, prompt);
  try {
    const parsed = JSON.parse(result.trim());
    return { category: parsed.category || 'symptom', summary: parsed.summary || message.slice(0, 60) };
  } catch {
    return { category: 'symptom', summary: message.slice(0, 60) };
  }
}

// ─── Step 3: Handle RETRIEVAL with memory context ─────────────────────────────

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

  return callGemini(GEMINI_FLASH_URL, prompt);
}

// ─── Step 4: Handle CONVERSATION with Pro model ───────────────────────────────

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
- For serious symptoms, always say "it's worth checking with your doctor"
- Keep responses under 200 words unless they ask for detail
- Use emojis sparingly (1-2 max)`;

  return callGemini(GEMINI_PRO_URL, message, systemPrompt);
}

// ─── Step 5: Generate daily tip ──────────────────────────────────────────────

export async function generateDailyTip(
  user: AvaUser,
  phase: string,
  memoryLogs: MemoryLog[]
): Promise<string> {
  const recentSymptoms = memoryLogs.slice(0, 10).map((l) => l.summary).join(', ');
  const prompt = `Generate a short, friendly daily wellness tip for a woman in her ${phase} phase.

Her name: ${user.name}
Recent logs: ${recentSymptoms || 'nothing yet'}
Goal: ${user.reproductive_goal}

Write 2 sentences max. Warm, specific, actionable. No fluff.`;

  return callGemini(GEMINI_FLASH_URL, prompt);
}

// ─── Step 6: Summarize chat insight for memory ────────────────────────────────

export async function summarizeChatInsight(
  userMessage: string,
  aiResponse: string
): Promise<string> {
  const prompt = `Summarize the key health insight from this conversation in 10 words or less.

User: "${userMessage}"
Ava: "${aiResponse}"

Reply with only the summary, no punctuation at the end.`;

  const result = await callGemini(GEMINI_FLASH_URL, prompt);
  return result.trim().slice(0, 80);
}
