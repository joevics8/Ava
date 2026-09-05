import { supabaseAdmin } from '@/lib/supabase';
import type { AvaUser } from '@/types';

export interface Remedy {
  id: string;
  name: string;
  condition: string;
  condition_label: string;
  description: string;
  instructions: string;
  timing: string;
  tracking_note: string;
  evidence: string;
  caution?: string;
  premium: boolean;
}

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;
type SendWithKeyboardFn = (chatId: number, text: string, keyboard: any[][], markdown?: boolean) => Promise<void>;

// ─── Cache ────────────────────────────────────────────────────────────────────

let remedyCache: Remedy[] = [];
let cacheExpiry = 0;

export async function getAllRemedies(): Promise<Remedy[]> {
  if (Date.now() < cacheExpiry && remedyCache.length > 0) return remedyCache;
  const { data } = await supabaseAdmin
    .from('remedies')
    .select('*')
    .eq('active', true)
    .order('condition');
  if (data) {
    remedyCache = data as Remedy[];
    cacheExpiry = Date.now() + 10 * 60 * 1000;
  }
  return remedyCache;
}

// ─── Step 1: Show condition list ──────────────────────────────────────────────

export async function showConditionMenu(
  chatId: number,
  user: AvaUser,
  sendWithKeyboard: SendWithKeyboardFn
): Promise<void> {
  const all = await getAllRemedies();
  const isPremium = user.plan === 'premium';

  // Get unique conditions the user has access to
  const available = all.filter(r => isPremium || !r.premium);
  const conditionMap = new Map<string, string>();
  available.forEach(r => conditionMap.set(r.condition, r.condition_label));

  const conditions = Array.from(conditionMap.entries());

  // Build keyboard — 2 per row
  const keyboard: any[][] = [];
  for (let i = 0; i < conditions.length; i += 2) {
    const row = [
      { text: conditions[i][1], callback_data: 'rem_cond_' + conditions[i][0] },
    ];
    if (conditions[i + 1]) {
      row.push({ text: conditions[i + 1][1], callback_data: 'rem_cond_' + conditions[i + 1][0] });
    }
    keyboard.push(row);
  }

  await sendWithKeyboard(
    chatId,
    '🌿 *Natural Remedy Guide*\n\nWhat would you like help with? Choose a condition:',
    keyboard,
    true
  );
}

// ─── Step 2: Show remedy list for a condition ─────────────────────────────────

export async function showRemedyList(
  chatId: number,
  user: AvaUser,
  condition: string,
  sendWithKeyboard: SendWithKeyboardFn
): Promise<void> {
  const all = await getAllRemedies();
  const isPremium = user.plan === 'premium';
  const remedies = all.filter(r => r.condition === condition && (isPremium || !r.premium));

  if (!remedies.length) {
    await sendWithKeyboard(chatId, 'No remedies found for this condition yet 🌸', [], false);
    return;
  }

  const conditionLabel = remedies[0].condition_label;

  // Build numbered list text
  const list = remedies.map((r, i) => (i + 1) + '. *' + r.name + '*\n_' + r.description.slice(0, 80) + '..._').join('\n\n');

  // Build keyboard — one remedy per row
  const keyboard = remedies.map(r => ([
    { text: r.name, callback_data: 'rem_view_' + r.id },
  ]));

  // Add back button
  keyboard.push([{ text: '← Back to conditions', callback_data: 'rem_menu' }]);

  await sendWithKeyboard(
    chatId,
    '🌿 *Remedies for ' + conditionLabel + '*\n\nTap one to see the full steps:\n\n' + list,
    keyboard,
    true
  );
}

// ─── Step 3: Show full remedy detail ──────────────────────────────────────────

export async function showRemedyDetail(
  chatId: number,
  user: AvaUser,
  remedyId: string,
  sendWithKeyboard: SendWithKeyboardFn
): Promise<void> {
  const all = await getAllRemedies();
  const remedy = all.find(r => r.id === remedyId);
  if (!remedy) return;

  const text =
    '🌿 *' + remedy.name + '*\n\n' +
    remedy.description + '\n\n' +
    '📋 *How to use:*\n' + remedy.instructions + '\n\n' +
    '⏰ *When:* ' + remedy.timing + '\n\n' +
    '👀 *What to track:* ' + remedy.tracking_note + '\n\n' +
    '🔬 *Why it works:* ' + remedy.evidence +
    (remedy.caution ? '\n\n⚠️ *Caution:* ' + remedy.caution : '');

  // Check if already tracking
  const { data: existing } = await supabaseAdmin
    .from('user_remedies')
    .select('id')
    .eq('user_id', user.id)
    .eq('remedy_id', remedyId)
    .eq('active', true)
    .single();

  const keyboard = [
    existing
      ? [{ text: '✅ Already tracking this', callback_data: 'rem_already_' + remedyId }]
      : [{ text: '🌿 Try this remedy', callback_data: 'rem_start_' + remedyId }],
    [{ text: '← Back to ' + remedy.condition_label, callback_data: 'rem_cond_' + remedy.condition }],
  ];

  await sendWithKeyboard(chatId, text, keyboard, true);
}

// ─── Step 4: Start tracking ───────────────────────────────────────────────────

export async function startTracking(
  chatId: number,
  user: AvaUser,
  remedyId: string,
  send: SendFn
): Promise<void> {
  const all = await getAllRemedies();
  const remedy = all.find(r => r.id === remedyId);
  if (!remedy) return;

  const followUpAt = new Date();
  followUpAt.setDate(followUpAt.getDate() + 7);

  await supabaseAdmin.from('user_remedies').insert({
    user_id: user.id,
    remedy_id: remedy.id,
    remedy_name: remedy.name,
    condition: remedy.condition,
    follow_up_at: followUpAt.toISOString(),
    active: true,
  });

  await send(chatId,
    'Saved 🌿 I\'ll check in with you in 7 days to see how *' + remedy.name + '* is going.\n\nJust tell me anytime if you notice anything.',
    true
  );
}

// ─── Handle all remedy callback queries ───────────────────────────────────────

export async function handleRemedyCallback(
  chatId: number,
  user: AvaUser,
  callbackData: string,
  sendWithKeyboard: SendWithKeyboardFn,
  send: SendFn
): Promise<boolean> {
  if (callbackData === 'rem_menu') {
    await showConditionMenu(chatId, user, sendWithKeyboard);
    return true;
  }

  if (callbackData.startsWith('rem_cond_')) {
    const condition = callbackData.replace('rem_cond_', '');
    await showRemedyList(chatId, user, condition, sendWithKeyboard);
    return true;
  }

  if (callbackData.startsWith('rem_view_')) {
    const remedyId = callbackData.replace('rem_view_', '');
    await showRemedyDetail(chatId, user, remedyId, sendWithKeyboard);
    return true;
  }

  if (callbackData.startsWith('rem_start_')) {
    const remedyId = callbackData.replace('rem_start_', '');
    await startTracking(chatId, user, remedyId, send);
    return true;
  }

  if (callbackData.startsWith('rem_already_')) {
    await send(chatId, 'You\'re already tracking this one 🌿 Keep going — I\'ll check in with you soon.');
    return true;
  }

  return false;
}

// ─── Auto-suggest from symptom (shows list, not first remedy) ─────────────────

export async function suggestRemediesForCondition(
  chatId: number,
  user: AvaUser,
  condition: string,
  sendWithKeyboard: SendWithKeyboardFn,
  send: SendFn
): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('user_remedies')
    .select('id')
    .eq('user_id', user.id)
    .eq('condition', condition)
    .eq('active', true);

  if (existing?.length) {
    await send(chatId, 'You\'re already tracking a remedy for this 🌿 Say *my remedies* to see how it\'s going.', true);
    return;
  }

  await send(chatId, 'By the way — I have some natural remedies that might help with this 🌿');
  await showRemedyList(chatId, user, condition, sendWithKeyboard);
}

// ─── Detect remedy intent from text ──────────────────────────────────────────

export async function detectRemedyIntent(message: string): Promise<{ action: 'update' | null; remedyId: string | null }> {
  const lower = message.toLowerCase();
  const all = await getAllRemedies();

  const helpedPhrases = ['is helping', 'it worked', 'it helped', 'feeling better', 'works for me', 'helped'];
  for (const phrase of helpedPhrases) {
    if (lower.includes(phrase)) {
      const remedy = all.find(r => lower.includes(r.name.toLowerCase()));
      if (remedy) return { action: 'update', remedyId: remedy.id };
    }
  }
  return { action: null, remedyId: null };
}

// ─── Update outcome ───────────────────────────────────────────────────────────

export async function updateRemedyOutcome(
  chatId: number,
  user: AvaUser,
  remedyId: string,
  message: string,
  send: SendFn
): Promise<void> {
  const lower = message.toLowerCase();
  let outcome: string;

  if (lower.includes('not') || lower.includes("didn't") || lower.includes('no difference')) {
    outcome = 'didnt_help';
  } else if (lower.includes('partial') || lower.includes('little') || lower.includes('slightly')) {
    outcome = 'partially';
  } else {
    outcome = 'helped';
  }

  await supabaseAdmin
    .from('user_remedies')
    .update({ outcome, notes: message.slice(0, 200), active: outcome !== 'helped' })
    .eq('user_id', user.id)
    .eq('remedy_id', remedyId);

  const replies: Record<string, string> = {
    helped: 'That\'s wonderful — I\'ve noted that it worked for you 🌿',
    partially: 'Good to know it\'s helping a little. Keep going — some remedies need a full cycle or two 🌿',
    didnt_help: 'Thanks for letting me know. Every body is different. Send /remedies to try a different option 🌸',
  };

  await send(chatId, replies[outcome] || 'Got it — noted 🌿');
}

// ─── Active remedies ──────────────────────────────────────────────────────────

export async function getActiveRemedies(userId: string): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('user_remedies')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('started_at', { ascending: false });
  return data || [];
}
