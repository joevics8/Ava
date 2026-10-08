import { getCycleData, getMemoryContext } from './db';
import { getCycleStatus, phaseEmoji, predictNextPeriod, predictOvulationWindow } from './cycle';
import { upsertCycleData } from './db';
import { getDayData } from './cycle-lookup';
import { getPersonalInsight, hasMonthOfHistory } from './morning';
import { localizeEatTip } from './food-data';
import type { AvaUser } from '@/types';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function getGreeting(): string {
  const hour = new Date().getUTCHours() + 1;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export async function buildTodaySummary(user: AvaUser): Promise<string> {
  let cycleData = await getCycleData(user.id);
  const memoryLogs = await getMemoryContext(user.id, user.plan);

  if (!cycleData?.period_start_dates?.length) {
    return `I need your period dates to show your summary.\n\nJust tell me when your last period started and I'll set everything up 🌸`;
  }

  const avg = Number(cycleData.avg_cycle_length) || 28;
  const duration = cycleData.period_duration || 5;
  const sortedDates = [...cycleData.period_start_dates].sort();
  const lastStart = new Date(sortedDates[sortedDates.length - 1]);
  const today = new Date();

  const status = getCycleStatus(lastStart, avg, duration, today);

  // Only (re)build the stored prediction when it is missing, or when the last
  // logged period is so old she has evidently stopped logging (stale). A
  // merely LATE period must NOT roll forward to next month's window — that hid
  // the lateness and, via the old wrapped day count, told a late user she was
  // "on day 3, menstrual phase".
  const nextPeriodStored = cycleData.next_period_start ? new Date(cycleData.next_period_start) : null;
  if (!nextPeriodStored || (status.stale && nextPeriodStored < today)) {
    let anchor = new Date(lastStart);
    if (status.stale) {
      while (anchor.getTime() + avg * 24 * 60 * 60 * 1000 <= today.getTime()) {
        anchor = new Date(anchor.getTime() + avg * 24 * 60 * 60 * 1000);
      }
    }
    const { start: ns, end: ne } = predictNextPeriod(anchor, avg);
    const { start: os, end: oe } = predictOvulationWindow(ns, avg);
    await upsertCycleData(user.id, {
      next_period_start: ns.toISOString().split('T')[0],
      next_period_end: ne.toISOString().split('T')[0],
      next_ovulation_start: os.toISOString().split('T')[0],
      next_ovulation_end: oe.toISOString().split('T')[0],
    });
    cycleData = await getCycleData(user.id);
  }

  const { phase, day } = status;

  // ── Research-based lookup ─────────────────────────────────────────────────
  const dayData = getDayData(day, avg, duration);

  // ── Personal insight — same real-data gate as the morning digest. Only
  // claim "you tend to X" when there's an actual month of history behind
  // it (and free users are capped at 14 days of retained memory, so this
  // can never fire for them) — otherwise just show the plain phase
  // description, no personalization. When the insight exists, it replaces
  // the generic line rather than sitting alongside it, same as the digest.
  const hasEnoughHistory = memoryLogs.length >= 10 && hasMonthOfHistory(memoryLogs);
  const personalInsight = hasEnoughHistory ? await getPersonalInsight(phase, day, memoryLogs) : null;
  const symptomSection = personalInsight
    ? `🧠 ${personalInsight}`
    : `🌡️ *Today:* ${dayData.symptomsGeneric}`;

  // ── Period and ovulation dates ────────────────────────────────────────────
  const nextStart = cycleData?.next_period_start ? new Date(cycleData.next_period_start) : null;
  const nextEnd = cycleData?.next_period_end ? new Date(cycleData.next_period_end) : null;
  const ovStart = cycleData?.next_ovulation_start ? new Date(cycleData.next_ovulation_start) : null;
  const ovEnd = cycleData?.next_ovulation_end ? new Date(cycleData.next_ovulation_end) : null;

  const daysUntilPeriod = nextStart
    ? Math.ceil((nextStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let periodLine = '';
  const expectedDate = new Date(lastStart.getTime() + avg * 24 * 60 * 60 * 1000);
  if (status.stale) {
    periodLine = `📅 I may be out of date — the last period I have is ${formatDate(lastStart)}. When did your latest one start? Send me the date and I'll catch up.`;
  } else if (status.isLate) {
    periodLine =
      `⏳ Your period is ${status.daysPastExpected} day${status.daysPastExpected === 1 ? '' : 's'} past your expected date (${formatDate(expectedDate)}). ` +
      `Illness, stress, travel and poor sleep can all push it later. Tell me the moment it starts and I'll update your cycle. ` +
      `If a pregnancy is possible, a home test is reliable from the first day of a missed period.`;
  } else if (nextStart && nextEnd) {
    periodLine = daysUntilPeriod !== null && daysUntilPeriod <= 5
      ? `📅 Period in ~${Math.max(0, daysUntilPeriod)} days (${formatDate(nextStart)} – ${formatDate(nextEnd)})`
      : `📅 Next period: ${formatDate(nextStart)} – ${formatDate(nextEnd)}`;
  }

  let ovLine = '';
  if (ovStart && ovEnd) {
    const ovIsNow = today >= ovStart && today <= ovEnd;
    ovLine = ovIsNow
      ? `✨ You are in your *ovulation window* right now`
      : `✨ Ovulation window: ${formatDate(ovStart)} – ${formatDate(ovEnd)}`;
  }

  return (
    `${getGreeting()}, ${user.name}! 🌸\n\n` +
    `${phaseEmoji[phase]} *${dayData.phaseLabel}* — Day ${day} of ~${avg}\n\n` +
    `${dayData.fertilityEmoji} *Fertility possibility: ${dayData.fertilityLabel}*\n\n` +
    `${periodLine}\n` +
    `${ovLine}\n\n` +
    `${symptomSection}\n\n` +
    `🍽️ *Eat:* ${localizeEatTip(dayData.eatTipGeneric, dayData.nutrientTags, dayData.eatReasonClause, (user as any).country)}\n\n` +
    `🏃 *Do:* ${dayData.doTipGeneric}`
  );
}
