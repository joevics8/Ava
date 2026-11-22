import { supabaseAdmin } from '@/lib/supabase';
import { localDateIn, localHour, MORNING_HOUR, MORNING_WINDOW_HOURS, wallClock } from './timezone';

// Shared rules for every scheduled message: hourly crons, her own clock, once per local day,
// and a lighter schedule when she has stopped replying.

/** Inside her local morning window (default 07:00-09:59). */
export function inMorningWindow(tz: string, now: Date = new Date(), hour = MORNING_HOUR(), windowHours = MORNING_WINDOW_HOURS): boolean {
  const h = localHour(now, tz);
  return h >= hour && h < hour + windowHours;
}

/** Local weekday 0=Sunday for the weekly briefing; WEEKLY_LOCAL_DAY overrides (default Sunday). */
export const WEEKLY_DAY = (): number => {
  const v = Number(process.env.WEEKLY_LOCAL_DAY);
  return process.env.WEEKLY_LOCAL_DAY !== undefined && process.env.WEEKLY_LOCAL_DAY !== '' && v >= 0 && v <= 6 ? Math.floor(v) : 0;
};
export const isWeeklyDay = (tz: string, now: Date = new Date()): boolean => wallClock(now, tz).getUTCDay() === WEEKLY_DAY();

export interface Cadence { send: boolean; /** Add the "I'll check in less often" line to this message. */ note: boolean }

/**
 * Daily while she is around. After 3 silent days: a note on the last daily message, then one message a week
 * (every 7th silent day), and nothing after 6 weeks of silence until she writes again.
 */
export function cadence(daysSilent: number): Cadence {
  if (daysSilent <= 3) return { send: true, note: daysSilent === 3 };
  if (daysSilent > 42) return { send: false, note: false };
  return { send: daysSilent % 7 === 0, note: false };
}

export const daysSilentFrom = (lastSeen: string | Date | null | undefined, now: Date = new Date()): number => {
  if (!lastSeen) return 0;
  const t = new Date(lastSeen).getTime();
  return Number.isFinite(t) ? Math.max(0, Math.floor((now.getTime() - t) / 86400000)) : 0;
};

export const SILENT_NOTE = "\n\nI've noticed it's been quiet, so I'll check in less often. Message me any time and I'll be back to daily 🌸";

/** Atomically claim "send <job> to <user> for this local date". False if already claimed (or on error). */
export async function claimSend(userId: string, job: string, localDate: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from('cron_sends').insert({ user_id: userId, job, local_date: localDate });
  if (!error) return true;
  if (error.code !== '23505') console.error('claimSend failed (run the cron_sends migration?):', error.message);
  return false;
}

/** The send did not go through: free the claim so the next hourly run inside her window can retry. */
export async function releaseSend(userId: string, job: string, localDate: string): Promise<void> {
  const { error } = await supabaseAdmin.from('cron_sends').delete().eq('user_id', userId).eq('job', job).eq('local_date', localDate);
  if (error) console.error('releaseSend failed:', error.message);
}

export const todayFor = (tz: string, now: Date = new Date()): string => localDateIn(now, tz);
