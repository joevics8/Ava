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

export async function createUser(telegramId: number): Promise<AvaUser | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ telegram_id: telegramId, onboarding_step: 0 })
    .select()
    .single();

  if (error || !data) return null;
  return data as AvaUser;
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
