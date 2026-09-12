import type { MessageCategory, AvaUser } from '@/types';
import type { MemoryLog } from '@/types';
import { formatMemoryForAI } from './db';

// URLs built lazily at call time so env vars are always available
const FLASH = 'gemini-3.1-flash-lite';
const PRO = 'gemini-3-flash-preview';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

// Gemini 3 models "think" before answering by default, and thinking tokens are
// deducted from the same maxOutputTokens budget. With a small budget and no
// thinkingLevel set, a model can spend its whole budget thinking and return
// an empty or truncated answer (finishReason: MAX_TOKENS) — this is why
// replies were coming back cut off or blank. We explicitly cap thinking for
// these lightweight conversational/classification tasks and give plenty of
// room left over for the actual text.
type ThinkingLevel = 'minimal' | 'low' | 'high';

function extractText(data: any): { text: string; finishReason?: string } {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p: any) => p?.text && !p?.thought)
    .map((p: any) => p.text)
    .join('')
    .trim();
  return { text, finishReason: data?.candidates?.[0]?.finishReason };
}

async function callGemini(
  model: string,
  prompt: string,
  systemPrompt?: string,
  opts: { maxOutputTokens?: number; thinkingLevel?: ThinkingLevel } = {}
): Promise<string> {
  const contents = systemPrompt
    ? [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }]
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const buildConfig = (maxOutputTokens: number, thinkingLevel?: ThinkingLevel) => {
    const generationConfig: any = { maxOutputTokens };
    if (thinkingLevel) generationConfig.thinkingConfig = { thinkingLevel };
    return generationConfig;
  };

  const attempt = async (generationConfig: any): Promise<{ ok: boolean; text: string; retryableStatus: boolean; hitTokenCap: boolean }> => {
    try {
      const res = await fetch(geminiUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Gemini API error:', JSON.stringify(data));
        const status = data?.error?.status;
        return { ok: false, text: '', retryableStatus: status === 'UNAVAILABLE' || res.status === 503, hitTokenCap: false };
      }

      const { text, finishReason } = extractText(data);
      if (finishReason && finishReason !== 'STOP') {
        // Visibility into exactly how the token budget was spent — thinking
        // vs visible answer — so truncation is diagnosable instead of a
        // silent "the reply just stops".
        console.error('Gemini non-STOP finish:', {
          model,
          finishReason,
          textLength: text.length,
          usage: data?.usageMetadata,
        });
      }
      return { ok: true, text, retryableStatus: false, hitTokenCap: finishReason === 'MAX_TOKENS' };
    } catch (err) {
      console.error('Gemini fetch error:', err);
      return { ok: false, text: '', retryableStatus: true, hitTokenCap: false };
    }
  };

  const baseTokens = opts.maxOutputTokens ?? 1000;
  let result = await attempt(buildConfig(baseTokens, opts.thinkingLevel));

  if (!result.ok && result.retryableStatus) {
    await new Promise((r) => setTimeout(r, 400));
    result = await attempt(buildConfig(baseTokens, opts.thinkingLevel));
  }

  // Hit the token cap (thinking ate the budget, or the answer ran long) —
  // retry once with thinking forced to minimal and a much bigger budget so
  // the user gets a complete reply instead of one that stops mid-sentence.
  if (result.ok && result.hitTokenCap) {
    result = await attempt(buildConfig(Math.max(baseTokens * 2, 1500), 'minimal'));
  }

  return result.text;
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

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 20, thinkingLevel: 'minimal' });
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

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 20, thinkingLevel: 'minimal' });
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

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 300, thinkingLevel: 'minimal' });
  return result || `That's something I can do better with Premium — it gives me 5 months of memory so I can spot your patterns properly. Want me to send you the upgrade link, ${userName}? 🌸`;
}

// ─── Extract log summary for memory ──────────────────────────────────────────

export async function extractLogSummary(message: string): Promise<{ category: string; summary: string; periodStart: boolean; daysAgo: number }> {
  const prompt = `Extract a short memory log entry from this message for a period tracking app.

Message: "${message}"

Also detect if this message reports that the user's period has just started (e.g. "my period started today", "it came early", "period showed up yesterday", "I'm on my period now") — as opposed to just mentioning a symptom, a past period, or asking a question. If so, figure out how many days ago it started (0 = today, 1 = yesterday, etc — default 0 if unclear).

Reply in this exact JSON format (no markdown, no backticks):
{"category":"symptom|mood|sexual|cycle|test|bbt|mucus|flow","summary":"10 words max describing what was logged","periodStart":true|false,"daysAgo":0}`;

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 150, thinkingLevel: 'minimal' });
  try {
    const parsed = JSON.parse(result.trim());
    return {
      category: parsed.category || 'symptom',
      summary: parsed.summary || message.slice(0, 60),
      periodStart: Boolean(parsed.periodStart),
      daysAgo: Number.isFinite(parsed.daysAgo) ? Math.max(0, Math.min(7, parsed.daysAgo)) : 0,
    };
  } catch {
    return { category: 'symptom', summary: message.slice(0, 60), periodStart: false, daysAgo: 0 };
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

Answer warmly and specifically using their data.

HONESTY (non-negotiable, absolute — not a suggestion to hedge): do not suggest a specific illness, medication, or stressor caused a change in their cycle timing — not even as a hedge ("it's possible this played a role", "these stressors may have contributed") — unless the USER is the one who already made that connection themselves. Illness/symptoms being in their recent log does NOT mean you get to connect it to a cycle change; that connection is a medical claim you have no basis for. If you don't know why something shifted, the correct answer is exactly that: "I'm not sure why that shifted." Nothing more. If the user is pointing out that something looks wrong, take that seriously rather than explaining it away with any theory, hedged or not.

LENGTH: match the question — a quick factual question gets a quick, direct answer (sometimes one sentence), a genuinely multi-part question can run longer. Don't default to the same length every time.`;

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 600, thinkingLevel: 'minimal' });
  return result || `I don't have enough data to answer that yet, ${user.name}. Keep logging and I'll spot patterns for you 🌸`;
}

// Only the last few days matter for casual conversation — the full history
// (up to 150 days for premium) belongs to /insights, /changes, /patterns,
// which are DESIGNED to synthesize across everything. Feeding that same
// full dump into every casual reply is what caused "if you log malaria,
// every response mentions malaria" — a memorable entry sitting in a
// 120-line list for months looks equally salient every single time,
// regardless of whether it's actually relevant to what was just said.
function getRecentConversationContext(logs: MemoryLog[]): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);
  const recent = logs.filter(l => new Date(l.logged_at) >= cutoff).slice(0, 6);

  if (recent.length > 0) return formatMemoryForAI(recent);

  if (logs.length === 0) return 'No history yet.';

  const last = logs[0];
  const daysAgo = Math.round((Date.now() - new Date(last.logged_at).getTime()) / 86400000);
  return `Nothing logged in the last few days. Most recent entry: [${last.category}] ${last.summary} (${daysAgo}d ago) — don't bring this up unless it's actually relevant to the current message.`;
}

// ─── Handle CONVERSATION with Pro model ───────────────────────────────────────

export async function handleConversation(
  user: AvaUser,
  message: string,
  memoryLogs: MemoryLog[]
): Promise<string> {
  const context = getRecentConversationContext(memoryLogs);

  const systemPrompt = `You are Ava, a warm, knowledgeable AI wellness companion for a period and cycle tracking app. This has to feel like talking to a real friend who knows this person — never generic, and never repetitive like a script.

About this user:
- Name: ${user.name}
- Age: ${user.age}
- Reproductive goal: ${user.reproductive_goal}
- Known conditions: ${user.conditions?.join(', ') || 'none stated'}
- Birth control: ${user.birth_control || 'none stated'}

Recent context (last few days only — their full history lives in /insights, not here):
${context}

Rules:
- Speak like a caring, informed friend — warm but not cheesy, and not repetitive
- PERSONALIZATION (non-negotiable): address them as ${user.name} — never a generic greeting like "hi there" or "hey there". Use their name naturally, especially when greeting them or opening a reply.
- ANTI-REPETITION (important): only bring up something from their recent context if it's directly relevant to what they just said right now. A real friend doesn't ask "how's that malaria?" in every single conversation just because you mentioned it once — only when it naturally comes up. If today's message has nothing to do with their recent log, don't force a connection to it.
- HONESTY (non-negotiable, absolute — not a suggestion to hedge): do not suggest a specific illness, medication, or stressor caused a change in their cycle timing — not even as a hedge ("it's possible this played a role", "these stressors may have contributed") — unless the USER already made that connection themselves. Illness/symptoms being in their recent log does NOT mean you get to connect it to a cycle change; that connection is a medical claim you have no basis for. If their tracked dates or predictions look off, or they're telling you something doesn't match, take that seriously — the correct answer when you don't know why is exactly "I'm not sure why that shifted," nothing more.
- Reference their personal data only when it genuinely improves your answer, not as decoration to prove you remember
- NEVER diagnose or prescribe
- For serious symptoms, always say "worth checking with your doctor"
- LENGTH: match the message, don't default to the same length every time. A quick factual question deserves a quick, direct answer — sometimes one sentence is enough. A more open-ended or emotional message can run 3-4 sentences. Never pad a short answer just to hit a sentence count, and never write a paragraph.
- VARIETY: don't reuse the same opening words, sentence rhythm, or stock phrases reply after reply — vary how you start and structure each response like a real person would
- One emoji max, and not on every message`;

  const result = await callGemini(PRO, message, systemPrompt, { maxOutputTokens: 900, thinkingLevel: 'minimal' });
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

Write exactly 1-2 sentences. No intro, no preamble, just the tip itself.`;

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 200, thinkingLevel: 'minimal' });
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

Reply with only the summary in 10 words or less. No punctuation at the end. No preamble.`;

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 100, thinkingLevel: 'minimal' });
  return result.slice(0, 80) || userMessage.slice(0, 60);
}

const STOPWORDS = new Set([
  'about', 'their', 'there', 'these', 'those', 'while', 'which', 'should', 'could', 'would',
  // Domain-generic words that legitimately appear in nearly every message this
  // app handles — excluding them means what's left to compare is the actually
  // distinctive content (a named illness, a specific symptom), not just
  // "this is a period-tracking app" noise.
  'cycle', 'cycles', 'menstrual', 'period', 'periods', 'health', 'tracking',
]);

// Guards against a self-reinforcing loop: if Ava mentions something once,
// summarizeChatInsight logs it, which then shows up as "recent context" in
// the next prompt, making Ava more likely to mention it again, which gets
// logged again — repeating a topic manufactures its own evidence that the
// topic is important. Skip logging a new insight that shares a distinctive
// word with one already logged in the last few entries. This is a coarse
// heuristic (literal word overlap, not real semantic similarity) — it
// catches "malaria" recurring verbatim, not full paraphrase-level repeats.
// The prompt-level fixes (limited recent-context window, explicit
// anti-repetition instruction) are the primary defense; this is a backstop.
export function isDuplicateInsight(newSummary: string, recentChatSummaries: string[]): boolean {
  const words = (s: string) => new Set(
    s.toLowerCase().split(/\W+/).filter(w => w.length >= 5 && !STOPWORDS.has(w))
  );
  const newWords = words(newSummary);
  if (newWords.size === 0) return false;

  for (const prior of recentChatSummaries) {
    const priorWords = words(prior);
    for (const w of Array.from(newWords)) {
      if (priorWords.has(w)) return true;
    }
  }
  return false;
}
