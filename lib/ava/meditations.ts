// ─── Meditation library ─────────────────────────────────────────────────────
//
// Split into two parts per session, matching how this will actually work
// once audio is wired up:
// - `setup`: short position/posture instructions — stays as text even
//   after audio exists, since she needs to read it before pressing play,
//   not while her eyes are meant to be closed.
// - `script`: the actual guided meditation (breathing cues, pacing). This
//   is what becomes a voice note later; for now it's sent as a second text
//   message so the two-part structure is already in place.
//
// Menu items are bare — no taglines/explanations under each purpose, per
// product direction. A short "new to this?" note is shown once, separate
// from the menu itself, before someone's first session.
//
// Starting at 2 scripts per purpose (14 total) rather than the full 3-5
// discussed earlier — meditation scripts are a much bigger writing lift per
// entry than affirmations, so this validates the feature before committing
// to a much larger library. Easy to expand per-purpose later without
// touching any of the code that reads this file.

export interface MeditationPurpose {
  key: string;
  emoji: string;
  label: string;
}

export interface MeditationScript {
  title: string;
  duration: string;
  setup: string;
  script: string;
}

export const MEDITATION_PURPOSES: MeditationPurpose[] = [
  { key: 'morning', emoji: '🌅', label: 'Morning' },
  { key: 'stress', emoji: '😌', label: 'Stress' },
  { key: 'overthinking', emoji: '💭', label: 'Overthinking' },
  { key: 'sleep', emoji: '🌙', label: 'Sleep' },
  { key: 'emotional_reset', emoji: '💗', label: 'Emotional reset' },
  { key: 'body_relaxation', emoji: '🧘', label: 'Body relaxation' },
  { key: 'period_calm', emoji: '🌸', label: 'Period-day calm' },
];

export const MEDITATION_INTRO =
  "🧘 *New to meditation?*\nYou don't need to clear your mind or do it perfectly. Just get comfortable, follow Ava's instructions, and gently bring your attention back whenever your mind wanders.";

export const MEDITATIONS: Record<string, MeditationScript[]> = {
  morning: [
    {
      title: 'Morning Light',
      duration: 'about 2 minutes',
      setup: 'Find a comfortable position, sitting or lying down. Let your eyes close, or soften your gaze downward.',
      script: `Take a slow breath in through your nose... and let it out slowly through your mouth. One more like that — in... and out.

Notice that you've made it to a new day. You don't need to have it figured out yet. Just notice you're here.

Bring your attention to your breath, without changing it. Just watch it move in... and out.

If your mind wanders to your to-do list, that's okay. Gently guide your attention back to your breath, as many times as you need to.

Picture the day ahead as open, not overwhelming. You don't have to meet all of it right now — just this next breath.

Take one more slow breath in... and out.

When you're ready, gently open your eyes. Carry this steadiness with you into the day.`,
    },
    {
      title: 'One Step At A Time',
      duration: 'about 2 minutes',
      setup: 'Sit or lie down comfortably. Let your shoulders drop away from your ears.',
      script: `Breathe in slowly for a count of four... hold gently... and release for a count of four.

Today doesn't need to be tackled all at once. Just this moment is enough to start with.

Notice any tension in your body — your jaw, your hands, your stomach. With your next exhale, let a little of it go.

Bring to mind one small thing you're looking forward to today, even something tiny. Let yourself sit with that for a moment.

You don't need to feel completely ready. You only need to take the next step.

Take one more breath in... and out.

When you're ready, open your eyes and meet the day, one step at a time.`,
    },
  ],
  stress: [
    {
      title: 'Releasing the Tension',
      duration: 'about 2-3 minutes',
      setup: 'Find a comfortable seated position. Let your hands rest gently in your lap.',
      script: `Breathe in through your nose for a count of four... and out through your mouth for a count of six, letting the exhale be longer than the inhale.

Notice where you're holding stress in your body right now — your shoulders, your chest, your jaw.

With your next exhale, imagine that tension softening, just slightly.

You don't have to solve everything right now. This moment only asks you to breathe.

Repeat silently to yourself: I am safe right now. This feeling will pass.

Take three more slow breaths, in through the nose, out through the mouth, longer each time.

When you're ready, gently open your eyes. Carry this steadier feeling with you.`,
    },
    {
      title: 'Slowing Down',
      duration: 'about 2 minutes',
      setup: 'Sit or lie down somewhere quiet. Let your eyes close if that feels comfortable.',
      script: `Breathe in slowly... and notice the pause at the top of the breath before you let it go.

Stress often convinces us everything is urgent. Right now, nothing needs to be solved — just breathe.

Let your shoulders drop. Unclench your jaw. Loosen your hands.

With each exhale, imagine setting one worry down, even briefly.

You are allowed to slow down, even if just for these few minutes.

Take three more breaths, slower than the last.

When you're ready, open your eyes, carrying a little more calm with you.`,
    },
  ],
  overthinking: [
    {
      title: 'Setting the Thoughts Down',
      duration: 'about 2-3 minutes',
      setup: 'Get comfortable, and let your eyes close gently.',
      script: `Notice the thoughts moving through your mind right now, without trying to stop them.

Breathe in slowly... and as you breathe out, imagine each thought floating past like a cloud, not something you need to chase.

You don't need to solve every thought today. You can simply notice it and let it pass.

If your mind pulls you into a spiral, gently return your attention to your breath — in... and out.

Repeat quietly to yourself: not everything needs an answer right now.

Take three more slow breaths, letting your mind settle a little more each time.

When you're ready, open your eyes, a little quieter inside.`,
    },
    {
      title: 'Coming Back to Now',
      duration: 'about 2 minutes',
      setup: 'Sit comfortably and let your body settle into place.',
      script: `Let your breathing settle into its natural rhythm.

Notice if your mind is replaying something from earlier, or rehearsing something that hasn't happened yet.

Gently bring your attention back to right now — the feeling of your breath, the weight of your body.

Breathe in... and out. Each time your mind wanders, simply guide it back, without judging yourself for wandering.

There is nothing to figure out in this moment except this breath.

Take a few more slow breaths, staying with just this moment.

When you're ready, open your eyes, a little more anchored in the present.`,
    },
  ],
  sleep: [
    {
      title: 'Winding Down',
      duration: 'about 2-3 minutes',
      setup: 'Lie down comfortably, and let your body sink into the bed.',
      script: `Take a slow breath in... and a longer breath out, letting your body get heavier with each exhale.

Starting from your feet, let them go soft and heavy. Let that heaviness move up through your legs.

Let your stomach and chest soften with your next breath out.

Let your shoulders drop, your jaw unclench, your forehead smooth.

Today is done. There is nothing left to solve tonight.

Take a few more slow breaths, each one a little slower than the last.

Let yourself drift, with nothing left to hold onto but rest.`,
    },
    {
      title: 'Letting the Day Go',
      duration: 'about 2 minutes',
      setup: 'Get comfortable in your bed, and let your eyes close.',
      script: `Breathe in slowly... and out, even more slowly.

Picture today's thoughts as leaves floating down a stream, drifting away one by one.

You don't need to review the day before you sleep. It's already done.

With each breath out, let your body sink a little deeper into rest.

Repeat quietly: I've done enough for today.

Continue breathing slowly, letting each breath carry you closer to sleep.`,
    },
  ],
  emotional_reset: [
    {
      title: 'Making Space',
      duration: 'about 2-3 minutes',
      setup: 'Sit or lie down comfortably, and let your eyes close.',
      script: `Notice whatever you're feeling right now, without needing to change it immediately.

Breathe in slowly... and out, giving the feeling room to simply exist.

You don't have to fix this feeling right now — just notice it.

With your next breath, imagine a little space opening up around the emotion, so it doesn't feel so tight.

Remind yourself: this feeling is real, and it will also move through me.

Take a few more slow breaths, allowing whatever you feel to soften, even slightly.

When you're ready, open your eyes, a little more spacious inside.`,
    },
    {
      title: 'Steadying Again',
      duration: 'about 2 minutes',
      setup: 'Find a comfortable position and let your body settle.',
      script: `Let your breath settle into its own pace.

If today has felt like a lot, acknowledge that without judging yourself for it.

Breathe in... and out, slowly, letting your body know it's safe right now.

Place a hand on your chest if that feels comforting, and feel it rise and fall.

You don't need to have your emotions fully sorted out to feel steadier.

Take a few more breaths, letting yourself settle bit by bit.

When you're ready, open your eyes, a little calmer than before.`,
    },
  ],
  body_relaxation: [
    {
      title: 'Releasing Tension',
      duration: 'about 3 minutes',
      setup: 'Lie down or sit comfortably, and close your eyes.',
      script: `Starting with your feet, gently tense them for a moment... then release, letting them go completely soft.

Move up to your legs — tense briefly... and release.

Continue up through your stomach, your hands, your shoulders, tensing gently and then letting go each time.

Let your jaw unclench, your forehead smooth, your whole body grow heavier with each breath out.

Take a few slow breaths, feeling your body settle more with each one.

When you're ready, gently open your eyes, feeling looser than before.`,
    },
    {
      title: 'Body Scan',
      duration: 'about 2-3 minutes',
      setup: 'Get comfortable, and let your eyes close.',
      script: `Bring your attention to the top of your head, and imagine any tension there melting away.

Slowly move your attention down — your forehead, your jaw, your neck — releasing tightness as you go.

Continue down through your shoulders, your arms, your chest, letting each part soften.

Move through your stomach, your hips, your legs, all the way down to your feet.

With each area, simply notice it, and let it relax a little more.

Take one more full breath, feeling your whole body a little more at ease.

When you're ready, open your eyes, carrying this looseness with you.`,
    },
  ],
  period_calm: [
    {
      title: 'Gentle Rest',
      duration: 'about 2-3 minutes',
      setup: 'Lie down somewhere comfortable, ideally with something warm nearby if that helps.',
      script: `Take a slow breath in... and let it out fully, allowing your body to soften.

Notice any discomfort without fighting it — just acknowledge that your body is working hard right now.

With each breath out, let your lower belly and back soften, even slightly.

You don't need to push through today. Resting right now is exactly the right thing to do.

Take a few more slow breaths, letting yourself sink into rest.

When you're ready, stay as long as you need — there's no rush to get up.`,
    },
    {
      title: 'Softening Through Discomfort',
      duration: 'about 2-3 minutes',
      setup: 'Get into whatever position feels most comfortable for your body right now — curled up, lying flat, whatever eases things.',
      script: `Breathe in slowly... and out, a little longer than the inhale.

Imagine warmth gathering wherever you feel discomfort, gently easing the tension there.

You don't need to be productive today. Your only job right now is to be gentle with yourself.

With each breath, let your body feel a little more supported.

Take a few more slow breaths, resting for as long as you need.

When you're ready — no rush — let yourself continue resting.`,
    },
  ],
};

// ─── Menu and selection ─────────────────────────────────────────────────────

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;
type SendWithKeyboardFn = (chatId: number, text: string, keyboard: any[][], markdown?: boolean) => Promise<void>;

export async function showMeditationMenu(chatId: number, user: any, send: SendFn, sendKb: SendWithKeyboardFn): Promise<void> {
  const { getMemoryContext, addMemoryLog } = await import('./db');
  const memoryLogs = await getMemoryContext(user.id, user.plan);
  const usedBefore = memoryLogs.some((l: any) => l.category === 'insight' && l.summary?.startsWith('Used /meditate'));
  if (!usedBefore) {
    await send(chatId, MEDITATION_INTRO, true);
    await addMemoryLog(user.id, 'insight', 'Used /meditate');
  }

  const keyboard = MEDITATION_PURPOSES.map(p => [{ text: `${p.emoji} ${p.label}`, callback_data: 'med_' + p.key }]);
  await sendKb(chatId, '🧘 *What kind of session do you need?*', keyboard, true);
}

export async function handleMeditationCallback(
  chatId: number,
  callbackData: string,
  send: SendFn
): Promise<boolean> {
  if (!callbackData.startsWith('med_')) return false;
  const key = callbackData.replace('med_', '');
  const list = MEDITATIONS[key];
  if (!list || !list.length) return true;

  const pick = list[Math.floor(Math.random() * list.length)];

  // Two separate messages, matching how this works once audio exists:
  // setup stays text (she reads it before starting), the script is the
  // part that becomes a voice note later.
  await send(chatId, `${pick.title} \u00b7 ${pick.duration}\n\n${pick.setup}`, false);
  await send(chatId, pick.script, false);
  return true;
}

// ─── Auto-surfacing in natural conversation ────────────────────────────────
//
// Same pattern as maybeSuggestFood in food.ts: reacts only to a keyword
// actually present in her message, scoped per-condition so one purpose's
// nudge doesn't silence the others, and never fires alongside a remedy or
// food nudge on the same message (see routeMessage in webhook/route.ts).
export const MEDITATION_TRIGGER_CONDITIONS: Record<string, string> = {
  sleep: 'sleep',
  anxiety: 'stress',
};

export async function maybeSuggestMeditation(
  chatId: number,
  user: any,
  text: string,
  memoryLogs: any[],
  send: SendFn
): Promise<boolean> {
  const { detectCondition } = await import('./remedies');
  const condition = detectCondition(text);
  if (!condition || !(condition in MEDITATION_TRIGGER_CONDITIONS)) return false;

  const purposeKey = MEDITATION_TRIGGER_CONDITIONS[condition];
  const alreadySuggestedRecently = memoryLogs.some(
    (l: any) => l.category === 'insight' && l.summary?.startsWith(`Auto-suggested meditation: ${purposeKey}`)
  );
  if (alreadySuggestedRecently) return false;

  const purpose = MEDITATION_PURPOSES.find(p => p.key === purposeKey);
  const list = MEDITATIONS[purposeKey];
  if (!purpose || !list?.length) return false;

  const { addMemoryLog } = await import('./db');
  await send(chatId, `🌸 By the way — want a short meditation for this? Send /meditate and pick "${purpose.emoji} ${purpose.label}".`);
  await addMemoryLog(user.id, 'insight', `Auto-suggested meditation: ${purposeKey}`);
  return true;
}
