import type { MessageCategory, AvaUser, ChatTurn } from '@/types';
import type { MemoryLog } from '@/types';
import { formatMemoryForAI } from './db';
import { getCountryFoods } from './food-data';

// URLs built lazily at call time so env vars are always available
export const FLASH = 'gemini-3.1-flash-lite';
export const PRO = 'gemini-3-flash-preview';

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

// Gemini needs turns that start with 'user' and alternate roles. Drop any
// leading model turns and merge consecutive same-role turns (e.g. a user
// message that got no reply) so the request is always valid.
function buildHistoryTurns(history?: ChatTurn[]): { role: string; parts: { text: string }[] }[] {
  if (!history || history.length === 0) return [];
  const turns: { role: string; parts: { text: string }[] }[] = [];
  for (const t of history) {
    if (!t.content?.trim()) continue;
    if (turns.length === 0 && t.role !== 'user') continue;
    const last = turns[turns.length - 1];
    if (last && last.role === t.role) {
      last.parts[0].text += '\n' + t.content;
    } else {
      turns.push({ role: t.role, parts: [{ text: t.content }] });
    }
  }
  // The new message is a user turn, so history must end on a model turn.
  // A trailing user turn means Ava never replied to it (e.g. an error), so
  // drop it rather than send two user turns in a row.
  while (turns.length > 0 && turns[turns.length - 1].role === 'user') turns.pop();
  return turns;
}

export async function callGemini(
  model: string,
  prompt: string,
  systemPrompt?: string,
  opts: { maxOutputTokens?: number; thinkingLevel?: ThinkingLevel; history?: ChatTurn[]; fallbackModel?: string } = {}
): Promise<string> {
  const history = buildHistoryTurns(opts.history);
  // With history, send the system prompt as systemInstruction so it stays
  // separate from the conversation turns. Without history, behaviour is
  // unchanged (system prompt prepended to the single user turn).
  const useSystemInstruction = !!systemPrompt && history.length > 0;
  const contents = useSystemInstruction
    ? [...history, { role: 'user', parts: [{ text: prompt }] }]
    : systemPrompt
      ? [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }]
      : [{ role: 'user', parts: [{ text: prompt }] }];
  const systemInstruction = useSystemInstruction ? { parts: [{ text: systemPrompt }] } : undefined;

  const buildConfig = (maxOutputTokens: number, thinkingLevel?: ThinkingLevel) => {
    const generationConfig: any = { maxOutputTokens };
    if (thinkingLevel) generationConfig.thinkingConfig = { thinkingLevel };
    return generationConfig;
  };

  const attempt = async (generationConfig: any, useModel: string = model): Promise<{ ok: boolean; text: string; retryableStatus: boolean; hitTokenCap: boolean }> => {
    try {
      const res = await fetch(geminiUrl(useModel), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemInstruction ? { systemInstruction, contents, generationConfig } : { contents, generationConfig }),
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
          model: useModel,
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

  // The primary model failed or came back empty (preview models get
  // rate-limited, renamed or retired). Fall back to a stable model so the user
  // gets a real answer instead of a canned "I'm here" line that hides the outage.
  if (!result.text && opts.fallbackModel && opts.fallbackModel !== model) {
    console.error('Gemini primary model returned nothing, falling back:', { model, fallback: opts.fallbackModel });
    result = await attempt(buildConfig(Math.max(baseTokens, 900), 'minimal'), opts.fallbackModel);
  }

  return result.text;
}

// ─── Classify incoming message ────────────────────────────────────────────────

export async function classifyMessage(message: string, history: ChatTurn[] = []): Promise<MessageCategory> {
  // Without the previous turn, a short answer to Ava's own question ("Just more
  // frequent", "Pretty normal", "yes") looks like a brand-new symptom report and
  // gets logged as one. Show the classifier what it is replying to.
  const lastAva = [...history].reverse().find(t => t.role === 'model');
  const lastAvaText = lastAva ? lastAva.content.replace(/\s+/g, ' ').slice(-300) : '';
  const context = lastAvaText
    ? `\nFor context, the assistant's previous message to the user was: "${lastAvaText}"\nIf the user's message is simply answering or reacting to that message, it is CONVERSATION, not LOG.\n`
    : '';

  const prompt = `Classify this message from a period/wellness tracking app user into exactly one category:

LOG - user NEWLY reporting a symptom, feeling, activity, or observation, as a statement (e.g. "I have cramps", "had sex today", "feeling tired")
RETRIEVAL - user asking about their own history or patterns (e.g. "when was my last period", "do I usually get headaches before my period")
CONVERSATION - any question, worry, "is this normal", medical query, a reply to the assistant's question, or anything else (e.g. "is this normal", "why am I so bloated", "when should I test for pregnancy", "yes", "just more frequent")
IMAGE - user sent a photo or mentions a test strip photo
${context}
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
  const prompt = `Extract a short memory tag from this message for a period tracking app.

Message: "${message}"

Also detect if this message reports that the user's period has just started (e.g. "my period started today", "it came early", "period showed up yesterday", "I'm on my period now") — as opposed to just mentioning a symptom, a past period, or asking a question. If so, figure out how many days ago it started (0 = today, 1 = yesterday, etc — default 0 if unclear).

The summary must be a short TAG, not a sentence — 2-4 words, noun-phrase style, no articles ("a"/"the"), no verbs like "reported" or "logged", no punctuation at the end. This gets stored and re-read on every future message, so it must be as short as possible without losing the specific thing that happened.
Good: "Unprotected sex", "Malaria symptoms", "Heavy cramps", "Sugar craving", "Missed pill"
Bad: "The user had unprotected sex today", "Reported symptoms of malaria", "User is craving sugar"

Reply in this exact JSON format (no markdown, no backticks):
{"category":"symptom|mood|sexual|cycle|test|bbt|mucus|flow","summary":"2-4 word tag","periodStart":true|false,"daysAgo":0}`;

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 100, thinkingLevel: 'minimal' });
  try {
    const parsed = JSON.parse(result.trim());
    return {
      category: parsed.category || 'symptom',
      summary: (parsed.summary || message.slice(0, 40)).slice(0, 40),
      periodStart: Boolean(parsed.periodStart),
      daysAgo: Number.isFinite(parsed.daysAgo) ? Math.max(0, Math.min(7, parsed.daysAgo)) : 0,
    };
  } catch {
    return { category: 'symptom', summary: message.slice(0, 40), periodStart: false, daysAgo: 0 };
  }
}

// ─── Shared answer principles ─────────────────────────────────────────────────
// One source of truth for HOW Ava explains the body, used by every reply path
// so the chat, the log follow-ups and the history answers all sound and reason
// the same way.

const ANSWER_STYLE = `HOW TO ANSWER (this is the core of your job — she should finish each reply understanding her body a little better):
1. Lead with the direct answer in your first sentence. No warm-up, no restating her question.
2. Explain the WHY in plain words, tied to where she is in her cycle right now when that is relevant (what oestrogen or progesterone is doing, what is typical at this point). Gloss any medical word in a few words.
3. Say what is typical and what is not. If something is a warning sign, name the specific sign and say when to see a doctor or clinic (see EMERGENCIES).
4. Give one concrete next step — something to do, track, buy or watch for, with timing when timing matters ("test on 12 Oct", "if it is still there after 3 days, get it checked").
5. Ask at most one follow-up question, and only when the answer would change your advice. Never close with a generic "how are you feeling about that?".`;

const REASONING_RULES = `ENGAGE WITH HER OWN THEORY: if she offers a cause ("maybe the flu or my new medication delayed my period"), answer that directly with what is generally known. Do not dodge it with "I'm not sure why". Say what is well established, what is not, and what you cannot know about her specifically.
NEVER state a cause for HER change as fact. When she asks why, or it clearly helps, you may name common reasons as possibilities (illness with fever, stress, travel, sleep disruption, big weight or exercise changes, starting or stopping contraception, breastfeeding, PCOS, thyroid). Do not volunteer causes nobody asked about. Never call her feelings "just hormones" or "just PMS" unless she says so first.
USE THE APP'S NUMBERS: cycle day, dates and late / not-late status come from CYCLE POSITION. Quote them; never recalculate or contradict them. Do not call a period "late" or "delayed" unless the status says it is past the expected window. If she says it is late and the status says not yet, kindly show her the expected window.
PREGNANCY QUESTIONS: never assume whether she is hoping for or dreading a pregnancy. Stay neutral and practical, and use the timing facts below.`;

const HEALTH_REFERENCE = `REFERENCE FACTS (accurate; use only the ones that apply, never recite them all):
- Pregnancy tests are most reliable from the first day of a missed period (roughly 2 weeks after ovulation or unprotected sex). Testing earlier can read negative falsely. If negative and the period still has not come, retest in 3 to 7 days. First-morning urine is most concentrated.
- Early pregnancy signs (tender breasts, peeing more, tiredness) overlap heavily with normal pre-period symptoms, so symptoms alone cannot tell the two apart. A test can.
- A period a few days either side of the expected date is normal variation. Cycles of about 21 to 35 days are typical, and one person's cycle can shift by several days from month to month.
- Illness with fever, stress, travel, poor sleep, and large weight or exercise changes can delay ovulation, which pushes the next period later. Common antibiotics such as amoxicillin are not known to change cycle timing; the illness itself is the more likely factor. Rifampicin is the antibiotic known to weaken hormonal contraception.
- If there was unprotected sex and she does not want a pregnancy, emergency contraception works best the sooner it is taken: a levonorgestrel pill is labelled for up to 72 hours, and some options (ulipristal, copper IUD) work up to 5 days. A pharmacist or clinic can advise.
- Period cramps come mainly from prostaglandins: heat, rest, gentle movement and an over-the-counter pain reliever such as ibuprofen (if she can take it) are the usual first steps.`;

const EMERGENCIES = `EMERGENCIES — tell her plainly to go to a clinic or hospital now: sharp one-sided lower belly pain, shoulder-tip pain, fainting or dizziness with a missed period or positive test (possible ectopic pregnancy); soaking a pad every hour for 2 or more hours; fever with pelvic pain or foul-smelling discharge; severe pain that stops her functioning. For anything else serious or persistent say "worth getting checked".`;

// ─── Handle RETRIEVAL with memory context ─────────────────────────────────────

export async function handleRetrieval(
  user: AvaUser,
  message: string,
  memoryLogs: MemoryLog[],
  cycleData?: { next_period_start?: string | null; next_period_end?: string | null; next_ovulation_start?: string | null; next_ovulation_end?: string | null; avg_cycle_length?: number | null; confidence_pct?: number | null } | null,
  history: ChatTurn[] = [],
  bodyContext: string = ''
): Promise<string> {
  const context = formatMemoryForAI(memoryLogs);

  // Ground truth from the app's own prediction logic — the model reads it, it
  // does not re-derive dates from "last period + cycle length" arithmetic.
  const cycleFacts = bodyContext
    ? bodyContext
    : cycleData
      ? `Current cycle prediction (use these exact values — do not recalculate them yourself):
- Next period expected: ${cycleData.next_period_start || 'unknown'} to ${cycleData.next_period_end || 'unknown'}
- Next fertile/ovulation window: ${cycleData.next_ovulation_start || 'unknown'} to ${cycleData.next_ovulation_end || 'unknown'}
- Average cycle length: ${cycleData.avg_cycle_length || 'unknown'} days
- Prediction confidence: ${cycleData.confidence_pct != null ? cycleData.confidence_pct + '%' : 'unknown'}`
      : 'No cycle prediction data available yet.';

  const prompt = `You are Ava, a warm, knowledgeable women's-health companion. She is asking about her own cycle or health history. Answer from her logged data.

Name: ${user.name}
Goal: ${user.reproductive_goal}

${cycleFacts}

Her memory log (most recent first; entries marked [chat] are Ava's own short topic notes, not things she reported):
${context}

Her question: "${message}"

${ANSWER_STYLE}

${REASONING_RULES}

Only state something about her history if it is actually in the log above — quote the real date or timeframe from it, and if it is not there, say you don't have it logged rather than guessing. Talk like a friend texting back; skip "based on your data" phrasing.

LENGTH: match the question. A quick factual question gets 1 to 2 sentences; a "why" or multi-part question can run to about 6 short sentences. Plain text, short paragraphs, no bullet lists or markdown symbols. At most one emoji.`;

  const result = await callGemini(FLASH, prompt, undefined, {
    maxOutputTokens: 700,
    thinkingLevel: 'minimal',
    history,
    fallbackModel: PRO,
  });
  return result;
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
// Returns '' when no model could answer — callers must treat that as a real
// failure (tell the user, don't store a fake reply), not paper over it.

export async function handleConversation(
  user: AvaUser,
  message: string,
  memoryLogs: MemoryLog[],
  history: ChatTurn[] = [],
  bodyContext: string = '',
  mode: 'chat' | 'log' = 'chat'
): Promise<string> {
  const context = bodyContext || `RECENT CONTEXT (last few days only):\n${getRecentConversationContext(memoryLogs)}`;

  const country = (user as any).country as string | undefined;
  const foodProfile = (user as any).food_profile as Record<string, string> | undefined;
  const localFoods = getCountryFoods(country);
  const foodProfileLines = foodProfile && Object.keys(foodProfile).length
    ? Object.entries(foodProfile).map(([k, v]) => `${k}: ${v}`).join(', ')
    : 'not shared yet';

  const modeBlock = mode === 'log'
    ? `SHE IS LOGGING SOMETHING (not asking a question): acknowledge it in one natural sentence, add one line on why it tends to happen at this point in her cycle if you can say so honestly, and a tiny practical tip only if it genuinely helps. 2 to 3 sentences total. Ask a follow-up only if it would change your advice.`
    : `LENGTH: most replies 3 to 6 short sentences. A quick factual question gets 1 to 2. Health questions ("is this normal", "why am I...") deserve the full why plus the next step, but never a wall of text — short paragraphs separated by a blank line.`;

  const systemPrompt = `You are Ava — the warm, knowledgeable women's-health companion people turn to to understand their own body. Think of a friend who is also a good nurse and health educator: you explain the why, you are honest about what you don't know, and she always leaves knowing what to do next. You are not a doctor and never diagnose.

ABOUT HER:
- Name: ${user.name}
- Age: ${user.age}
- Country: ${country || 'not stated'}
- Goal: ${user.reproductive_goal}
- Known conditions: ${user.conditions?.join(', ') || 'none stated'}
- Birth control: ${user.birth_control || 'none stated'}
- Diet profile: ${foodProfileLines}

${context}

${ANSWER_STYLE}

${REASONING_RULES}

${HEALTH_REFERENCE}

${EMERGENCIES}

${modeBlock}

STYLE RULES:
- Address her as ${user.name} naturally (never "hi there"), but not in every message.
- Past history: only bring up something from her logs when it directly bears on what she just said. Never ask "how's that fever?" out of nowhere. Only claim "you logged this before" if it appears in RECENT LOGS above, and quote the real date.
- Food: only when she asks about food, energy or nutrition, or when a symptom clearly calls for it — never tack food tips onto an unrelated answer. When you do, favour her local foods${localFoods.length ? ` (for example: ${localFoods.slice(0, 12).map(f => f.name).join(', ')})` : ''} and respect her diet profile. No calorie counts, macros or weight targets. Mention /foods at most once in a while.
- Relationships: if she raises a partner or an argument, listen and reflect; do not rule on him or her relationship. If anything sounds like fear, control or safety concerns, take it seriously and gently ask if she wants to talk to someone.
- Never diagnose, never give medication doses. For anything serious say "worth getting checked".
- Vary your openings and rhythm; do not reuse stock phrases.
- Plain text only (no markdown symbols, no bullet lists). At most one emoji, and not every message.
- CONVERSATION CONTINUITY: the earlier messages are your recent exchange with her. Use them to understand short replies ("yes", "why?", "the second one") and keep the thread going, without repeating what was already said.`;

  const result = await callGemini(PRO, message, systemPrompt, {
    maxOutputTokens: 900,
    thinkingLevel: 'minimal',
    history,
    fallbackModel: FLASH,
  });
  return result;
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
  const prompt = `Extract the key health-relevant point from this conversation as a short TAG, not a sentence — 2-5 words, noun-phrase style, no articles, no verbs like "discussed" or "mentioned", no punctuation at the end. This gets stored and re-read on every future message, so it must be as short as possible without losing the specific thing that happened.

User: "${userMessage}"
Ava: "${aiResponse}"

Good: "Cramp pattern, monthly", "Prefers yoga over running", "Sugar craving trigger"
Bad: "The user mentioned they get cramps monthly", "Discussed a preference for yoga"

If there's nothing genuinely worth remembering (small talk, a one-off question with no lasting relevance), reply with exactly: NONE

Reply with only the tag (or NONE). No preamble.`;

  const result = await callGemini(FLASH, prompt, undefined, { maxOutputTokens: 60, thinkingLevel: 'minimal' });
  const trimmed = result.trim();
  if (!trimmed || trimmed.toUpperCase() === 'NONE') return '';
  return trimmed.slice(0, 50);
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
