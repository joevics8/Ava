import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser, updateUser, getMemoryContext, addMemoryLog } from '@/lib/ava/db';
import {
  classifyMessage,
  extractLogSummary,
  handleRetrieval,
  handleConversation,
  summarizeChatInsight,
  shouldSuggestPremium,
  generatePremiumPitch,
} from '@/lib/ava/ai';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string, markdown = false) {
  const body: any = { chat_id: chatId, text };
  if (markdown) body.parse_mode = 'Markdown';
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function sendTyping(chatId: number) {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true });
    }

    const update = await req.json();

    // ── Callback queries (inline button taps) — must be before message check ─
    if (update?.callback_query) {
      const cb = update.callback_query;
      const cbChatId = cb.message?.chat?.id;
      const cbTelegramId = cb.from?.id;
      const cbData = cb.data;

      if (cbChatId && cbTelegramId && cbData?.startsWith('mood_')) {
        const moodMap: Record<string, string> = {
          mood_good: 'good',
          mood_okay: 'okay',
          mood_notgreat: 'not great',
        };
        const mood = moodMap[cbData] || cbData;
        const cbUser = await getUser(cbTelegramId);

        if (cbUser) {
          await addMemoryLog(cbUser.id, 'mood', `Morning mood: ${mood}`);

          const replies: Record<string, string> = {
            mood_good: `Love that, ${cbUser.name}! Have a wonderful day 🌸`,
            mood_okay: `Got it — hope your day picks up 🌷 Anything bothering you?`,
            mood_notgreat: `Sorry to hear that, ${cbUser.name} 🌸 What's going on? I'm here.`,
          };

          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: cb.id }),
          });

          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cbChatId,
              text: replies[cbData] || `Got it 🌸`,
              parse_mode: 'Markdown',
            }),
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ── Message null check ────────────────────────────────────────────────────
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const telegramId: number = message.from.id;
    const text: string = message.text || '';

    // ── Photo messages ────────────────────────────────────────────────────────
    if (message.photo?.length) {
      await sendTyping(chatId);
      let user = await getUser(telegramId);
      if (!user) { user = await createUser(telegramId); }

      const {
        getTelegramPhotoBase64,
        detectImageType,
        analyseOvulationStrip,
        analysePregnancyTest,
        analyseGenericImage,
      } = await import('@/lib/ava/vision');

      // Get largest photo size
      const photo = message.photo[message.photo.length - 1];
      const caption = message.caption || '';

      const photoData = await getTelegramPhotoBase64(photo.file_id);
      if (!photoData) {
        await sendMessage(chatId, `I couldn't read that photo — could you try sending it again? 🌸`);
        return NextResponse.json({ ok: true });
      }

      const imageType = await detectImageType(photoData.base64, photoData.mimeType, caption);

      if (imageType === 'ovulation_strip') {
        const { result, isPositive, summary } = await analyseOvulationStrip(photoData.base64, photoData.mimeType);
        await sendMessage(chatId, result);
        if (user) await addMemoryLog(user.id, 'test', summary);
        if (isPositive && user) {
          await addMemoryLog(user.id, 'cycle', 'LH surge detected — ovulation likely within 12-36 hours');
        }
      } else if (imageType === 'pregnancy_test') {
        const { result, isPositive, summary } = await analysePregnancyTest(photoData.base64, photoData.mimeType);
        await sendMessage(chatId, result);
        if (user) await addMemoryLog(user.id, 'test', summary);
        if (isPositive && user) {
          await addMemoryLog(user.id, 'insight', 'Positive pregnancy test logged');
          await sendMessage(chatId,
            `If this is a positive result, I want you to know I'm here for you whatever you're feeling 🌸\n\nWould you like me to switch to pregnancy mode? I'll track your weeks and due date.\n\nJust reply *switch to pregnancy mode* or *not yet* 🌷`
          );
        }
      } else {
        const response = await analyseGenericImage(photoData.base64, photoData.mimeType, caption);
        await sendMessage(chatId, response);
      }

      return NextResponse.json({ ok: true });
    }

    // Show typing immediately
    await sendTyping(chatId);

    // ── Get or create user ───────────────────────────────────────────────────
    let user = await getUser(telegramId);
    if (!user) {
      user = await createUser(telegramId);
      await sendMessage(chatId,
        `Hi, I'm *Ava* 🌸\n\nI'm your personal cycle & wellness companion. I can help you understand your cycle, track symptoms, and answer questions about your body.\n\nLet's get you set up — it only takes a minute.\n\nWhat's your name?`, true
      );
      return NextResponse.json({ ok: true });
    }

    // ── Premium expiry check ─────────────────────────────────────────────────
    if (user.plan === 'premium' && (user as any).premium_expires_at) {
      const expires = new Date((user as any).premium_expires_at);
      const now = new Date();
      const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        // Downgrade expired user
        await updateUser(telegramId, { plan: 'free' } as any);
        await sendMessage(chatId,
          `Hey ${user.name} — your Premium subscription has expired 🌸

You're now on the free plan. Send /premium to renew and keep your 5-month memory.`
        );
        user = { ...user, plan: 'free' };
      }
    }

    // ── Commands ─────────────────────────────────────────────────────────────
    if (text === '/start') {
      if (user.onboarding_complete) {
        await sendMessage(chatId,
          `Hey ${user.name} 🌸\n\n/today — daily summary\n/log — track something\n/premium — upgrade\n\nOr just talk to me.`
        );
      } else {
        await sendMessage(chatId, `Hi, I'm *Ava* 🌸 What's your name?`);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/today') {
      await sendTyping(chatId);
      if ((user as any).mode === 'pregnant') {
        const { buildPregnancySummary } = await import('@/lib/ava/pregnancy');
        const summary = await buildPregnancySummary(user);
        await sendMessage(chatId, summary);
      } else {
        const { buildTodaySummary } = await import('@/lib/ava/today');
        const summary = await buildTodaySummary(user);
        await sendMessage(chatId, summary);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/log') {
      await sendMessage(chatId,
        `What's going on today? 📝\n\nJust tell me naturally — "I have cramps", "feeling tired", "light flow", "had sex". I'll take it from there 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/premium') {
      if (user.plan === 'premium') {
        const expires = (user as any).premium_expires_at
          ? new Date((user as any).premium_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'active';
        await sendMessage(chatId, `✨ You're already on *Ava Premium* — active until ${expires} 🌸`);
      } else {
        const { createPaymentLink } = await import('@/lib/ava/paystack');
        const link = await createPaymentLink(telegramId, user.name || 'friend');
        if (link) {
          await sendMessage(chatId,
            `✨ *Ava Premium — ₦2,000/month*\n\n• 5 months of memory\n• Morning digest at 8am\n• Ovulation strip reading\n• Monthly cycle PDF\n\n[Tap here to upgrade](${link.url}) 🌸`
          );
        } else {
          await sendMessage(chatId, `Something went wrong generating your payment link — please try again in a moment 🌸`);
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/report') {
      if (user.plan !== 'premium') {
        await sendMessage(chatId, `Monthly cycle reports are a Premium feature ✨\n\nUpgrade with /premium to unlock this and more 🌸`);
        return NextResponse.json({ ok: true });
      }
      await sendTyping(chatId);
      try {
        const { generateCycleReport } = await import('@/lib/ava/pdf');
        const { getCycleData, getMemoryContext } = await import('@/lib/ava/db');
        const [cycleData, memoryLogs] = await Promise.all([
          getCycleData(user.id),
          getMemoryContext(user.id, 'premium'),
        ]);
        const pdfBuffer = await generateCycleReport(user, cycleData, memoryLogs);

        // Send as Telegram document via multipart
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('caption', `Your cycle report — ${new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })} 🌸`);
        formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), `ava-report-${Date.now()}.pdf`);

        const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`;
        await fetch(tgUrl, {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.error('PDF error:', err);
        await sendMessage(chatId, `Couldn't generate your report right now — please try again in a moment 🌸`);
      }
      return NextResponse.json({ ok: true });
    }

    // ── Insights commands ─────────────────────────────────────────────────────
    if (text === '/insights' || text === 'what have you learned about me' || text === 'what do you know about me') {
      await sendTyping(chatId);
      const { generatePersonalInsights } = await import('@/lib/ava/insights');
      const { getCycleData } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([
        getCycleData(user.id),
        getMemoryContext(user.id, user.plan),
      ]);
      const response = await generatePersonalInsights(user, logs, cycleData);
      await sendMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    if (text === '/changes' || text === 'what has changed recently' || text === 'what changed recently') {
      await sendTyping(chatId);
      const { generateRecentChanges } = await import('@/lib/ava/insights');
      const logs = await getMemoryContext(user.id, user.plan);
      const response = await generateRecentChanges(user, logs);
      await sendMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    if (text === '/patterns') {
      await sendTyping(chatId);
      const { detectPatterns } = await import('@/lib/ava/insights');
      const { getCycleData } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([
        getCycleData(user.id),
        getMemoryContext(user.id, user.plan),
      ]);
      const patterns = await detectPatterns(user, logs, cycleData);
      const patternEntries = Object.entries(patterns).filter(([, v]) => v !== null).map(([, v]) => '• ' + String(v));
      const found = patternEntries.join('\n');
      if (!found) {
        await sendMessage(chatId, `I haven't spotted strong patterns yet, ${user.name} 🌸 Keep sharing and I'll connect the dots over time.`);
      } else {
        const patternMsg = "Here's what I've noticed, " + user.name + " 🌸\n\n" + found + "\n\n_These are observations, not diagnoses — always worth discussing with your doctor if anything concerns you._";
        await sendMessage(chatId, patternMsg);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/docprep' || text === 'doctor visit prep' || text === 'prepare for my doctor') {
      await sendTyping(chatId);
      const { generateDoctorPrep } = await import('@/lib/ava/insights');
      const { getCycleData } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([
        getCycleData(user.id),
        getMemoryContext(user.id, user.plan),
      ]);
      const response = await generateDoctorPrep(user, logs, cycleData);
      await sendMessage(chatId, `📋 *Doctor Visit Summary for ${user.name}*

${response}`);
      return NextResponse.json({ ok: true });
    }

    if (text === '/weekly' || text === 'weekly briefing' || text === 'weekly update') {
      await sendTyping(chatId);
      const { generateWeeklyBriefing } = await import('@/lib/ava/insights');
      const { getCycleData } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([
        getCycleData(user.id),
        getMemoryContext(user.id, user.plan),
      ]);
      const response = await generateWeeklyBriefing(user, logs, cycleData);
      await sendMessage(chatId, `📊 *Your Weekly Briefing*

${response}`);
      return NextResponse.json({ ok: true });
    }

    // ── Remedies ──────────────────────────────────────────────────────────────
    if (text === '/remedies') {
      const { getConditionMenu, getActiveRemedies } = await import('@/lib/ava/remedy-engine');
      const active = await getActiveRemedies(user.id);
      const activeText = active.length
        ? '\n\n*Currently tracking:*\n' + active.map((r: any) => '🌿 ' + r.remedy_name).join('\n')
        : '';
      const menu = getConditionMenu();
      await sendMessage(chatId,
        '*Ava Natural Remedy Guide* 🌿\n\nWhat would you like help with?\n\n' + menu + activeText + "\n\nOr just describe your symptom and I'll suggest something.",
        true
      );
      return NextResponse.json({ ok: true });
    }

    if (text === 'my remedies' || text === 'remedies i am trying') {
      const { getActiveRemedies } = await import('@/lib/ava/remedy-engine');
      const active = await getActiveRemedies(user.id);
      if (!active.length) {
        await sendMessage(chatId, "You're not tracking any remedies yet 🌿\n\nSend /remedies to explore natural options for your symptoms.");
      } else {
        const list = active.map((r: any) => {
          const started = new Date(r.started_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
          return '🌿 *' + r.remedy_name + '* — started ' + started;
        }).join('\n');
        await sendMessage(chatId, '*Your active remedies:*\n\n' + list + "\n\nTell me how any of them are going and I'll update your record 🌿", true);
      }
      return NextResponse.json({ ok: true });
    }


    if (text === 'my remedies' || text === 'remedies i am trying') {
      const { getActiveRemedies } = await import('@/lib/ava/remedy-engine');
      const active = await getActiveRemedies(user.id);
      if (!active.length) {
        await sendMessage(chatId, `You're not tracking any remedies yet 🌿

Send /remedies to explore natural options for your symptoms.`);
      } else {
        const list = active.map((r: any) => {
          const started = new Date(r.started_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
        }).join('\\n');
        await sendMessage(chatId, '*Your active remedies:*\\n\\n' + list + "\\n\\nTell me how any of them are going and I'll update your record 🌿", true);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/cancel') {
      if (user.plan !== 'premium') {
        await sendMessage(chatId, `You're on the free plan — nothing to cancel 🌸`);
      } else {
        await sendMessage(chatId,
          `To cancel your Premium subscription, send *CANCEL PREMIUM*.

You'll keep Premium until your current period ends, then move to the free plan.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (text === 'switch to pregnancy mode' || text === 'pregnancy mode') {
      if (!user) return NextResponse.json({ ok: true });
      const existing = await import('@/lib/ava/db').then(m => m.getCycleData(user!.id));
      const lastPeriod = existing?.period_start_dates?.slice(-1)[0] || new Date().toISOString().split('T')[0];
      const { activatePregnancyMode } = await import('@/lib/ava/pregnancy');
      await activatePregnancyMode(telegramId, lastPeriod, sendMessage, chatId, user!.name || 'there');
      return NextResponse.json({ ok: true });
    }

    if (text === 'switch to cycle mode' || text === 'cycle mode') {
      await updateUser(telegramId, { mode: 'cycle', pregnancy_start_date: null } as any);
      await sendMessage(chatId, `Switched back to cycle tracking 🌸 Send /today for your daily summary.`);
      return NextResponse.json({ ok: true });
    }

    if (text === 'CANCEL PREMIUM') {
      await updateUser(telegramId, { plan: 'free', premium_expires_at: null } as any);
      await sendMessage(chatId,
        `Done — your Premium subscription has been cancelled 🌸

You're now on the free plan. If you change your mind, /premium is always there.`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/help') {
      await sendMessage(chatId,
        `/today — cycle summary\n/insights — what Ava has learned about you\n/changes — what's changed recently\n/patterns — recurring patterns\n/docprep — doctor visit summary\n/weekly — weekly briefing\n/log — track symptoms\n/settings — update your info\n/premium — upgrade\n/report — monthly PDF\n\nOr just talk to me naturally 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/settings') {
      await sendMessage(chatId,
        `What would you like to update? ⚙️\n\n1. My name\n2. Last period date\n3. Cycle length\n4. Period duration\n5. My goal\n6. Delete my data\n\nJust send the number.`
      );
      await updateUser(telegramId, { onboarding_step: 90 });
      return NextResponse.json({ ok: true });
    }

    if (text === 'delete my data' || text === '/deletedata') {
      await sendMessage(chatId,
        `Are you sure you want to delete all your data? This cannot be undone.\n\nSend *YES DELETE* to confirm.`
      );
      await updateUser(telegramId, { onboarding_step: 99 });
      return NextResponse.json({ ok: true });
    }

    // ── Onboarding ────────────────────────────────────────────────────────────
    if (!user.onboarding_complete) {
      const { handleOnboardingStep } = await import('@/lib/ava/onboarding-raw');
      await handleOnboardingStep(chatId, telegramId, user, text, sendMessage);
      return NextResponse.json({ ok: true });
    }

    // ── Period confirmation reply ─────────────────────────────────────────────
    const lowerText = text.toLowerCase().trim();
    if (['yes', 'yes it did', 'it started', 'yep', 'yeah'].includes(lowerText)) {
      const today = new Date().toISOString().split('T')[0];
      const { getCycleData, upsertCycleData } = await import('@/lib/ava/db');
      const { predictNextPeriod, predictOvulationWindow } = await import('@/lib/ava/cycle');
      const existing = await getCycleData(user.id);
      const avg = Number(existing?.avg_cycle_length) || 28;
      const todayDate = new Date();
      const { start: ns, end: ne } = predictNextPeriod(todayDate, avg);
      const { start: os, end: oe } = predictOvulationWindow(ns, avg);
      const existingDates = existing?.period_start_dates || [];
      await upsertCycleData(user.id, {
        period_start_dates: [...existingDates, today],
        next_period_start: ns.toISOString().split('T')[0],
        next_period_end: ne.toISOString().split('T')[0],
        next_ovulation_start: os.toISOString().split('T')[0],
        next_ovulation_end: oe.toISOString().split('T')[0],
      });
      const nextStr = ns.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      await sendMessage(chatId,
        `Got it, ${user.name} 🩸 I've noted today as your period start.

Your next period is estimated around *${nextStr}*. How are you feeling?`
      );
      return NextResponse.json({ ok: true });
    }

    if (['yes please', 'yes', 'sure', 'yeah', 'show me', 'yes share it', 'share it'].includes(lowerText)) {
      // User said yes to remedy suggestion — check last detected condition from memory
      const { getMemoryContext } = await import('@/lib/ava/db');
      const logs = await getMemoryContext(user.id, user.plan);
      const lastInsight = logs.find((l: any) => l.category === 'insight' && l.summary.includes('Suggested remedy'));
      if (lastInsight) {
        const condMatch = lastInsight.summary.match(/Suggested remedy for (.+)/);
        if (condMatch) {
          const { suggestRemedies } = await import('@/lib/ava/remedy-engine');
          await suggestRemedies(chatId, user, condMatch[1], sendMessage);
          return NextResponse.json({ ok: true });
        }
      }
    }

    if (['not yet', 'nope', 'no', 'not started', 'nothing yet'].includes(lowerText)) {
      await sendMessage(chatId,
        `No worries — cycles can vary a few days 🌸 I'll keep an eye on it. Let me know when it starts.`
      );
      return NextResponse.json({ ok: true });
    }

    // ── Settings flow ─────────────────────────────────────────────────────────
    if (user.onboarding_step >= 90) {
      const { handleSettingsStep } = await import('@/lib/ava/settings');
      await handleSettingsStep(chatId, telegramId, user, text, sendMessage);
      return NextResponse.json({ ok: true });
    }

    // ── Main AI router ────────────────────────────────────────────────────────
    await sendTyping(chatId);
    const memoryLogs = await getMemoryContext(user.id, user.plan);

    // Check if this is a natural moment to suggest premium (free users only)
    if (user.plan === 'free') {
      const [category, upgradeSuggested] = await Promise.all([
        classifyMessage(text),
        shouldSuggestPremium(text, user.plan),
      ]);

      if (upgradeSuggested) {
        const { createPaymentLink } = await import('@/lib/ava/paystack');
        const [pitch, link] = await Promise.all([
          generatePremiumPitch(user.name || 'there', text),
          createPaymentLink(user.telegram_id, user.name || 'friend'),
        ]);
        const linkText = link ? `\n\n[Upgrade to Premium](${link.url}) ✨` : '';
        await sendMessage(chatId, pitch + linkText);
        return NextResponse.json({ ok: true });
      }

      // Route normally
      await routeMessage(category, text, chatId, user, memoryLogs);
    } else {
      const category = await classifyMessage(text);
      await routeMessage(category, text, chatId, user, memoryLogs);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}

async function routeMessage(
  category: string,
  text: string,
  chatId: number,
  user: any,
  memoryLogs: any[]
) {
  // Check for remedy-related intent first
  const { detectRemedyIntent, startTracking, updateRemedyOutcome, suggestRemedies, findRemedyByName } = await import('@/lib/ava/remedy-engine');
  const { detectCondition } = await import('@/lib/ava/remedies');

  // User naming a specific remedy to start
  const { action, remedyId } = detectRemedyIntent(text);
  if (action === 'start' && remedyId) {
    await startTracking(chatId, user, remedyId, sendMessage);
    return;
  }
  if (action === 'update' && remedyId) {
    await updateRemedyOutcome(chatId, user, remedyId, text, sendMessage);
    return;
  }

  // User asking for a specific remedy by name (e.g. "what is spearmint tea")
  const namedRemedy = findRemedyByName(text);
  if (namedRemedy && (text.toLowerCase().includes('tell me') || text.toLowerCase().includes('what is') || text.toLowerCase().includes('how do i'))) {
    const { formatRemedy } = await import('@/lib/ava/remedies');
    await sendMessage(chatId, formatRemedy(namedRemedy), true);
    await sendMessage(chatId, `Say "I'll try ${namedRemedy.name}" and I'll track it for you 🌿`);
    return;
  }

  if (category === 'LOG') {
    const { category: logCat, summary } = await extractLogSummary(text);
    await addMemoryLog(user.id, logCat as any, summary);

    const followUpPrompt = `The user just said: "${text}"

Write exactly 3 sentences:
Sentence 1: Acknowledge with warmth and empathy.
Sentence 2: Give one relevant insight based on their context if available.
Sentence 3: Ask ONE caring follow-up question.

Do not write more than 3 sentences. Count them before sending.

Their recent context: ${memoryLogs.slice(0, 10).map((l: any) => l.summary).join(', ') || 'none yet'}`;

    await sendTyping(chatId);
    const response = await handleConversation(user, followUpPrompt, memoryLogs);
    await sendMessage(chatId, response || `Aww — how are you feeling overall? 🌸`, false);
    const insight = await summarizeChatInsight(text, response);
    await addMemoryLog(user.id, 'chat', insight);

    // Naturally suggest a remedy if there's one for this symptom
    const { detectCondition } = await import('@/lib/ava/remedies');
    const { getActiveRemedies, suggestRemedies } = await import('@/lib/ava/remedy-engine');
    const detectedCondition = detectCondition(text);
    if (detectedCondition) {
      const alreadyTracking = await getActiveRemedies(user.id);
      const alreadyHasThis = alreadyTracking.some((r: any) => r.condition === detectedCondition);
      if (!alreadyHasThis) {
        await sendMessage(chatId, `By the way — I have a natural remedy that might help with this 🌿 Want me to share it?`);
        await addMemoryLog(user.id, 'insight', `Suggested remedy for ${detectedCondition}`);
      }
    }

  } else if (category === 'RETRIEVAL') {
    const response = await handleRetrieval(user, text, memoryLogs);
    await sendMessage(chatId, response || `I need a bit more data to spot that pattern — keep sharing and I'll connect the dots 🌸`, false);

  } else {
    const response = await handleConversation(user, text, memoryLogs);
    await sendMessage(chatId, response || `I'm here — tell me more 🌸`, false);
    const insight = await summarizeChatInsight(text, response);
    await addMemoryLog(user.id, 'chat', insight);
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Ava webhook live 🌸' });
}
