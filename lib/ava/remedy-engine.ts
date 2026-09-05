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

// ─── Simple in-memory cache (refreshes every 10 minutes) ─────────────────────

let remedyCache: Remedy[] = [];
let cacheExpiry = 0;

async function getAllRemedies(): Promise<Remedy[]> {
  if (Date.now() < cacheExpiry && remedyCache.length > 0) return remedyCache;

  const { data, error } = await supabaseAdmin
    .from('remedies')
    .select('*')
    .eq('active', true)
    .order('condition');

  if (error || !data) return remedyCache; // return stale cache on error

  remedyCache = data as Remedy[];
  cacheExpiry = Date.now() + 10 * 60 * 1000; // 10 min TTL
  return remedyCache;
}

// ─── Get remedies for a condition ─────────────────────────────────────────────

export async function getRemediesForCondition(
  condition: string,
  isPremium: boolean
): Promise<Remedy[]> {
  const all = await getAllRemedies();
  return all.filter(r => r.condition === condition && (isPremium || !r.premium));
}

// ─── Detect condition from message ────────────────────────────────────────────

export function detectCondition(message: string): string | null {
  const lower = message.toLowerCase();
  const map: Record<string, string> = {
    cramp: 'cramps', 'period pain': 'cramps', dysmenorrhea: 'cramps', 'stomach pain': 'cramps',
    bloat: 'bloating', 'water retention': 'bloating', swollen: 'bloating',
    acne: 'acne', breakout: 'acne', pimple: 'acne', spot: 'acne', blemish: 'acne',
    mood: 'pms_mood', irritable: 'pms_mood', pms: 'pms_mood', 'mood swing': 'pms_mood', anxious: 'pms_mood',
    'heavy flow': 'heavy_flow', 'heavy period': 'heavy_flow', 'bleeding a lot': 'heavy_flow',
    'breast tender': 'breast_tenderness', 'sore breast': 'breast_tenderness', 'boob': 'breast_tenderness',
    tired: 'fatigue', fatigue: 'fatigue', exhausted: 'fatigue', 'no energy': 'fatigue', drained: 'fatigue',
    irregular: 'irregular_cycles', pcos: 'irregular_cycles', 'missed period': 'irregular_cycles',
    sleep: 'sleep', insomnia: 'sleep', "can't sleep": 'sleep', 'not sleeping': 'sleep',
    discharge: 'vaginal_health', vaginal: 'vaginal_health',
  };

  for (const [keyword, cond] of Object.entries(map)) {
    if (lower.includes(keyword)) return cond;
  }
  return null;
}

// ─── Format remedy for Telegram ───────────────────────────────────────────────

export function formatRemedy(remedy: Remedy): string {
  return (
    '🌿 *' + remedy.name + '* for ' + remedy.condition_label + '\n\n' +
    remedy.description + '\n\n' +
    '*How to use:*\n' + remedy.instructions + '\n\n' +
    '*When:* ' + remedy.timing + '\n\n' +
    '*What to watch:* ' + remedy.tracking_note +
    (remedy.caution ? '\n\n⚠️ *Note:* ' + remedy.caution : '')
  );
}

// ─── Suggest remedies for a condition ─────────────────────────────────────────

export async function suggestRemedies(
  chatId: number,
  user: AvaUser,
  condition: string,
  send: SendFn
): Promise<void> {
  const isPremium = user.plan === 'premium';
  const remedies = await getRemediesForCondition(condition, isPremium);

  if (!remedies.length) {
    await send(chatId, 'I don\'t have specific remedies for that yet, but I\'m always learning. Try asking me about cramps, bloating, acne, or PMS 🌸');
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from('user_remedies')
    .select('*')
    .eq('user_id', user.id)
    .eq('condition', condition)
    .eq('active', true);

  if (existing?.length) {
    const names = existing.map((r: any) => r.remedy_name).join(', ');
    await send(chatId, 'You\'re already trying *' + names + '* for this 🌿\n\nWant to log how it\'s going? Just tell me — "the ginger tea is helping" or "the heat therapy isn\'t working".', true);
    return;
  }

  const primary = remedies[0];
  const others = remedies.slice(1, 4).map(r => '• ' + r.name).join('\n');

  await send(chatId, formatRemedy(primary), true);
  await send(chatId,
    'Want to try this? Just say *"I\'ll try ' + primary.name + '"* and I\'ll check in with you in 7 days.' +
    (others ? '\n\nOther options for ' + primary.condition_label + ':\n' + others : ''),
    true
  );
}

// ─── Start tracking a remedy ──────────────────────────────────────────────────

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
    'Saved 🌿 I\'ll check in with you in 7 days to see if you\'ve started *' + remedy.name + '* and how it\'s going.\n\nJust tell me anytime — no need to wait.',
    true
  );
}

// ─── Detect remedy intent ─────────────────────────────────────────────────────

export async function detectRemedyIntent(message: string): Promise<{ action: 'start' | 'update' | null; remedyId: string | null }> {
  const lower = message.toLowerCase();
  const all = await getAllRemedies();

  const startPhrases = ["i'll try", "i will try", "i'm going to try", "starting", "going to use", "will use", "trying", "let me try"];
  for (const phrase of startPhrases) {
    if (lower.includes(phrase)) {
      const remedy = all.find(r => lower.includes(r.name.toLowerCase()));
      if (remedy) return { action: 'start', remedyId: remedy.id };
    }
  }

  const helpedPhrases = ['is helping', 'it worked', 'it helped', 'feeling better', 'works for me', 'helped a lot'];
  for (const phrase of helpedPhrases) {
    if (lower.includes(phrase)) {
      const remedy = all.find(r => lower.includes(r.name.toLowerCase()));
      if (remedy) return { action: 'update', remedyId: remedy.id };
    }
  }

  return { action: null, remedyId: null };
}

// ─── Update remedy outcome ────────────────────────────────────────────────────

export async function updateRemedyOutcome(
  chatId: number,
  user: AvaUser,
  remedyId: string,
  message: string,
  send: SendFn
): Promise<void> {
  const lower = message.toLowerCase();
  let outcome: string;

  if (lower.includes('not') || lower.includes("didn't") || lower.includes("doesn't") || lower.includes('no difference')) {
    outcome = 'didnt_help';
  } else if (lower.includes('partial') || lower.includes('little') || lower.includes('bit') || lower.includes('slightly')) {
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
    helped: 'That\'s wonderful — I\'ve noted that it worked for you 🌿 I\'ll remember this for next time.',
    partially: 'Good to know it\'s helping a little. Keep going — some remedies need a full cycle or two 🌿',
    didnt_help: 'Thanks for letting me know — every body is different. Want me to suggest another option? 🌸',
  };

  await send(chatId, replies[outcome] || 'Got it — noted 🌿');
}

// ─── Get active remedies ──────────────────────────────────────────────────────

export async function getActiveRemedies(userId: string): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('user_remedies')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('started_at', { ascending: false });
  return data || [];
}

// ─── Find remedy by name ──────────────────────────────────────────────────────

export async function findRemedyByName(message: string): Promise<Remedy | null> {
  const lower = message.toLowerCase();
  const all = await getAllRemedies();
  return all.find(r => lower.includes(r.name.toLowerCase())) || null;
}

// ─── Condition menu ───────────────────────────────────────────────────────────

export async function getConditionMenu(isPremium: boolean): Promise<string> {
  const all = await getAllRemedies();
  const conditions = Array.from(new Set(all.map(r => r.condition_label)));
  return conditions.map((c, i) => (i + 1) + '. ' + c).join('\n');
}
