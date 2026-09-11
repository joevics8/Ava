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
//
// Fraud check: Paystack gives us a coarse card fingerprint (bin-last4-bank)
// on every successful charge even though the "customer" email is synthetic
// per telegram_id. Before qualifying, check whether this same card has paid
// for the referrer's own account, or for another account this same referrer
// has referred — both are strong signals of one person controlling both
// ends of the referral. Those get marked 'invalid' instead of 'qualified'.
// A match against some unrelated third party's card is a weaker signal
// (could be a shared family card) — still qualifies, but with a note left
// for manual review rather than a hard block.
export async function qualifyReferralIfAny(referredUserId: string, fingerprint?: string | null): Promise<void> {
  const { data: referral } = await supabaseAdmin
    .from('referrals')
    .select('id, referrer_id')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .single();

  if (!referral) return;

  if (fingerprint) {
    const { data: matches } = await supabaseAdmin
      .from('user_payments')
      .select('user_id')
      .eq('fingerprint', fingerprint)
      .neq('user_id', referredUserId);

    if (matches && matches.length > 0) {
      const matchedUserIds = new Set(matches.map(m => m.user_id));

      if (matchedUserIds.has(referral.referrer_id)) {
        await supabaseAdmin.from('referrals').update({
          status: 'invalid',
          fraud_note: 'Same card as referrer\'s own payment — likely self-referral',
        }).eq('id', referral.id);
        return;
      }

      const { data: siblingReferrals } = await supabaseAdmin
        .from('referrals')
        .select('referred_id')
        .eq('referrer_id', referral.referrer_id)
        .neq('referred_id', referredUserId);
      const siblingIds = new Set((siblingReferrals || []).map(r => r.referred_id));

      const matchesSibling = Array.from(matchedUserIds).some(id => siblingIds.has(id));
      if (matchesSibling) {
        await supabaseAdmin.from('referrals').update({
          status: 'invalid',
          fraud_note: 'Card matches another account referred by the same person',
        }).eq('id', referral.id);
        return;
      }

      // Unrelated match — qualify, but flag for a human to glance at
      await supabaseAdmin.from('referrals').update({
        status: 'qualified',
        qualified_at: new Date().toISOString(),
        fraud_note: 'Card fingerprint also seen on another unrelated account — worth a quick manual check',
      }).eq('id', referral.id);
      return;
    }
  }

  await supabaseAdmin
    .from('referrals')
    .update({ status: 'qualified', qualified_at: new Date().toISOString() })
    .eq('id', referral.id);
}

export async function recordPayment(
  userId: string,
  reference: string,
  amount: number,
  authorization?: { bin?: string; last4?: string; bank?: string; card_type?: string; authorization_code?: string }
): Promise<string | null> {
  const fingerprint = authorization?.bin && authorization?.last4
    ? `${authorization.bin}-${authorization.last4}-${authorization.bank || ''}`
    : null;

  await supabaseAdmin.from('user_payments').insert({
    user_id: userId,
    reference,
    amount,
    card_bin: authorization?.bin || null,
    card_last4: authorization?.last4 || null,
    bank: authorization?.bank || null,
    card_type: authorization?.card_type || null,
    authorization_code: authorization?.authorization_code || null,
    fingerprint,
  });

  return fingerprint;
}

export async function getAdminReferralSummary(): Promise<{
  qualified: Array<{ referrerName: string; referrerTelegramId: number; referredName: string; amount: number }>;
  flagged: Array<{ referrerName: string; referredName: string; note: string }>;
  totals: { qualifiedCount: number; qualifiedAmount: number; paidCount: number; paidAmount: number };
}> {
  const { data: rows } = await supabaseAdmin
    .from('referrals')
    .select('status, payout_amount, fraud_note, referrer:referrer_id(name, telegram_id), referred:referred_id(name)')
    .in('status', ['qualified', 'paid'])
    .order('created_at', { ascending: true });

  const all = (rows || []) as any[];
  const qualified = all
    .filter(r => r.status === 'qualified')
    .map(r => ({
      referrerName: r.referrer?.name || 'Unknown',
      referrerTelegramId: r.referrer?.telegram_id,
      referredName: r.referred?.name || 'Unknown',
      amount: r.payout_amount,
    }));
  const flagged = all
    .filter(r => r.fraud_note)
    .map(r => ({ referrerName: r.referrer?.name || 'Unknown', referredName: r.referred?.name || 'Unknown', note: r.fraud_note }));

  const paidRows = all.filter(r => r.status === 'paid');

  return {
    qualified,
    flagged,
    totals: {
      qualifiedCount: qualified.length,
      qualifiedAmount: qualified.reduce((s, r) => s + r.amount, 0),
      paidCount: paidRows.length,
      paidAmount: paidRows.reduce((s, r) => s + (r.payout_amount || 0), 0),
    },
  };
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

// Records an actual period start and recalculates predictions from it. This
// used to only happen when the user replied "yes" to the cron's specific
// confirmation prompt — if someone just said "my period started today" (or
// "started 2 days ago") in normal conversation, it was saved to memory_log
// (so the AI could reference it in chat) but cycle_data — the table that
// actually drives /today and the morning digest's predicted date — was
// never touched. That's why the digest kept showing the old predicted date
// after an early/late period was mentioned in free text.
export async function recordPeriodStart(userId: string, daysAgo: number = 0): Promise<void> {
  const { predictNextPeriod, predictOvulationWindow } = await import('./cycle');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  const startDateStr = startDate.toISOString().split('T')[0];

  const existing = await getCycleData(userId);
  const avg = Number(existing?.avg_cycle_length) || 28;
  const existingDates: string[] = existing?.period_start_dates || [];

  if (existingDates.includes(startDateStr)) return; // already recorded

  const { start: ns, end: ne } = predictNextPeriod(startDate, avg);
  const { start: os, end: oe } = predictOvulationWindow(ns, avg);

  await upsertCycleData(userId, {
    period_start_dates: [...existingDates, startDateStr],
    next_period_start: ns.toISOString().split('T')[0],
    next_period_end: ne.toISOString().split('T')[0],
    next_ovulation_start: os.toISOString().split('T')[0],
    next_ovulation_end: oe.toISOString().split('T')[0],
  } as any);
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
