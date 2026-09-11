import { supabaseAdmin } from '@/lib/supabase';
import type { AvaUser, CycleData, MemoryLog, LogCategory } from '@/types';

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUser(telegramId: number): Promise<AvaUser | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error || !data) return null;
  return data as AvaUser;
}

export async function createUser(telegramId: number, referredByCode?: string): Promise<AvaUser | null> {
  const referralCode = await generateUniqueReferralCode();

  let referredBy: string | null = null;
  if (referredByCode) {
    const { data: referrer } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referral_code', referredByCode.toUpperCase())
      .single();
    if (referrer) referredBy = referrer.id;
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      telegram_id: telegramId,
      onboarding_step: 0,
      referral_code: referralCode,
      referred_by: referredBy,
    })
    .select()
    .single();

  if (error || !data) return null;

  // Log the referral relationship for payout tracking. Self-referral (a
  // referrer somehow referring their own second account) isn't blocked at
  // this layer — telegram_id uniqueness prevents the exact same account,
  // but a determined person could still create a second Telegram account.
  // Flagging that as a known gap rather than solving it now: at current
  // scale, manual review before payout is the practical guard.
  if (referredBy) {
    await supabaseAdmin.from('referrals').insert({
      referrer_id: referredBy,
      referred_id: data.id,
      status: 'pending',
    });
  }

  return data as AvaUser;
}

// ─── Referrals ────────────────────────────────────────────────────────────────

async function generateUniqueReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L — avoids ambiguity
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const { data } = await supabaseAdmin.from('users').select('id').eq('referral_code', code).single();
    if (!data) return code;
  }
  // Extremely unlikely fallback — timestamp-based, still short
  return 'R' + Date.now().toString(36).toUpperCase().slice(-5);
}

export async function getReferralStats(userId: string): Promise<{
  code: string | null;
  pending: number;
  qualified: number;
  paid: number;
  totalEarned: number;
}> {
  const { data: user } = await supabaseAdmin.from('users').select('referral_code').eq('id', userId).single();
  const { data: referrals } = await supabaseAdmin.from('referrals').select('status, payout_amount').eq('referrer_id', userId);

  const rows = referrals || [];
  const pending = rows.filter(r => r.status === 'pending').length;
  const qualified = rows.filter(r => r.status === 'qualified').length;
  const paid = rows.filter(r => r.status === 'paid').length;
  const totalEarned = rows.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.payout_amount || 0), 0);

  return { code: user?.referral_code || null, pending, qualified, paid, totalEarned };
}

// Called when a user's premium payment is confirmed — qualifies the referral
// exactly once (transitions pending -> qualified). Renewal payments find the
// row already past 'pending' and this is a no-op, so referrers aren't
// double-credited for the same person renewing month after month.
export async function qualifyReferralIfAny(referredUserId: string): Promise<void> {
  await supabaseAdmin
    .from('referrals')
    .update({ status: 'qualified', qualified_at: new Date().toISOString() })
    .eq('referred_id', referredUserId)
    .eq('status', 'pending');
}

export async function updateUser(
  telegramId: number,
  updates: Partial<AvaUser>
): Promise<void> {
  await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('telegram_id', telegramId);
}

// ─── Cycle Data ───────────────────────────────────────────────────────────────

export async function getCycleData(userId: string): Promise<CycleData | null> {
  const { data, error } = await supabaseAdmin
    .from('cycle_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as CycleData;
}

export async function upsertCycleData(
  userId: string,
  data: Partial<CycleData>
): Promise<void> {
  await supabaseAdmin
    .from('cycle_data')
    .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() });
}

// ─── Memory Log ───────────────────────────────────────────────────────────────

export async function addMemoryLog(
  userId: string,
  category: LogCategory,
  summary: string
): Promise<void> {
  await supabaseAdmin.from('memory_log').insert({
    user_id: userId,
    category,
    summary,
    logged_at: new Date().toISOString(),
  });
}

export async function getMemoryContext(
  userId: string,
  plan: 'free' | 'premium'
): Promise<MemoryLog[]> {
  // Free: 14 days | Premium: 5 months
  const daysBack = plan === 'premium' ? 150 : 14;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data, error } = await supabaseAdmin
    .from('memory_log')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: false })
    .limit(120); // cap context size

  if (error || !data) return [];
  return data as MemoryLog[];
}

export function formatMemoryForAI(logs: MemoryLog[]): string {
  if (logs.length === 0) return 'No history yet.';
  return logs
    .map((l) => {
      const date = new Date(l.logged_at).toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `[${l.category}] ${l.summary} — ${date}`;
    })
    .join('\n');
}
