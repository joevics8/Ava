import { supabaseAdmin } from '@/lib/supabase';
import { REMEDIES, getRemediesForCondition, formatRemedy, type Remedy } from './remedies';
import type { AvaUser } from '@/types';

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;

// ─── Suggest remedies for a condition ─────────────────────────────────────────

export async function suggestRemedies(
  chatId: number,
  user: AvaUser,
  condition: string,
  send: SendFn
): Promise<void> {
  const remedies = getRemediesForCondition(condition);
  if (!remedies.length) {
    await send(chatId, `I don't have specific remedies for that yet, but I'm always learning. Try asking me more specifically — like "what can I do for cramps" or "remedies for bloating" 🌸`);
    return;
  }

  // Check if user is already tracking a remedy for this condition
  const { data: existing } = await supabaseAdmin
    .from('user_remedies')
    .select('*')
    .eq('user_id', user.id)
    .eq('condition', condition)
    .eq('active', true);

  if (existing?.length) {
    const names = existing.map((r: any) => r.remedy_name).join(', ');
    await send(chatId,
      `You're already trying *${names}* for this 🌿\n\nWant to log how it's going? Just tell me — "the ginger tea is helping" or "the heat therapy isn't working".`,
      true
    );
    return;
  }

  // Show first remedy with option to see more
  const primary = remedies[0];
  const others = remedies.slice(1).map(r => `• ${r.name}`).join('\n');

  await send(chatId, formatRemedy(primary), true);
  await send(chatId,
    `Want to try this? Just say *"I'll try ${primary.name}"* and I'll remind you to check back after a few cycles.\n\n${others.length ? `Other options:\n${others}\n\nSay the name to see details.` : ''}`,
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
  const remedy = REMEDIES.find(r => r.id === remedyId);
  if (!remedy) return;

  // Set follow-up for 30 days
  const followUpAt = new Date();
  followUpAt.setDate(followUpAt.getDate() + 30);

  await supabaseAdmin.from('user_remedies').insert({
    user_id: user.id,
    remedy_id: remedy.id,
    remedy_name: remedy.name,
    condition: remedy.condition,
    follow_up_at: followUpAt.toISOString(),
    active: true,
  });

  await send(chatId,
    `Saved to your remedies 🌿 I'll check in with you in 30 days to see if *${remedy.name}* is helping.\n\nIn the meantime, just tell me how you're feeling and I'll keep track.`,
    true
  );
}

// ─── Detect if user is confirming/rejecting a remedy by name ─────────────────

export function detectRemedyIntent(message: string): { action: 'start' | 'update' | null; remedyId: string | null } {
  const lower = message.toLowerCase();

  // Starting a remedy
  const startPhrases = ["i'll try", "i will try", "i'm going to try", "starting", "going to use", "will use", "trying"];
  for (const phrase of startPhrases) {
    if (lower.includes(phrase)) {
      const remedy = REMEDIES.find(r => lower.includes(r.name.toLowerCase()));
      if (remedy) return { action: 'start', remedyId: remedy.id };
    }
  }

  // Updating outcome
  const helpedPhrases = ['is helping', 'it worked', 'it helped', 'feeling better', 'works', 'helped'];
  for (const phrase of helpedPhrases) {
    if (lower.includes(phrase)) {
      const remedy = REMEDIES.find(r => lower.includes(r.name.toLowerCase()));
      if (remedy) return { action: 'update', remedyId: remedy.id };
    }
  }

  return { action: null, remedyId: null };
}

// ─── Update remedy outcome from conversation ──────────────────────────────────

export async function updateRemedyOutcome(
  chatId: number,
  user: AvaUser,
  remedyId: string,
  message: string,
  send: SendFn
): Promise<void> {
  const lower = message.toLowerCase();
  let outcome: string;

  if (lower.includes('not') || lower.includes("didn't") || lower.includes("doesn't") || lower.includes('no')) {
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
    helped: `That's wonderful — I've noted that it worked for you 🌿 I'll keep this in mind whenever this comes up again.`,
    partially: `Good to know it's helping a little. Keep going — some remedies take a full cycle or two to show their full effect 🌿`,
    didnt_help: `Thanks for letting me know — that's useful. Every body is different. Want me to suggest another option? 🌸`,
  };

  await send(chatId, replies[outcome] || `Got it — noted 🌿`);
}

// ─── Get user's active remedies ───────────────────────────────────────────────

export async function getActiveRemedies(userId: string): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('user_remedies')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('started_at', { ascending: false });
  return data || [];
}

// ─── Remedy details by name (for browsing) ───────────────────────────────────

export function findRemedyByName(message: string): Remedy | null {
  const lower = message.toLowerCase();
  return REMEDIES.find(r => lower.includes(r.name.toLowerCase())) || null;
}

// ─── Get all conditions for /remedies menu ────────────────────────────────────

export function getConditionMenu(): string {
  const conditions = Array.from(new Set(REMEDIES.map(r => r.conditionLabel)));
  return conditions.map((c, i) => `${i + 1}. ${c}`).join('\n');
}
