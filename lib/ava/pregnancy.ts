import type { AvaUser } from '@/types';

type SendFn = (chatId: number, text: string) => Promise<void>;

// ─── Calculate pregnancy week ─────────────────────────────────────────────────

export function getPregnancyWeek(pregnancyStartDate: Date): {
  week: number;
  trimester: number;
  trimesterName: string;
  daysUntilDue: number;
  dueDate: Date;
} {
  const today = new Date();
  const daysPregnant = Math.floor((today.getTime() - pregnancyStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(daysPregnant / 7) + 1;

  // Due date is 280 days (40 weeks) from LMP
  const dueDate = new Date(pregnancyStartDate);
  dueDate.setDate(dueDate.getDate() + 280);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let trimester = 1;
  let trimesterName = 'First trimester';
  if (week > 27) { trimester = 3; trimesterName = 'Third trimester'; }
  else if (week > 13) { trimester = 2; trimesterName = 'Second trimester'; }

  return { week, trimester, trimesterName, daysUntilDue, dueDate };
}

// ─── Weekly pregnancy insight ─────────────────────────────────────────────────

export function getWeeklyInsight(week: number): string {
  const insights: Record<number, string> = {
    4: 'Your baby is the size of a poppy seed 🌱 The neural tube is forming.',
    5: 'Heart cells are beginning to form this week 💕',
    6: 'Your baby\'s heart is beating! About 100-160 beats per minute.',
    7: 'Baby is the size of a blueberry 🫐 Brain development is rapid.',
    8: 'Fingers and toes are starting to form this week.',
    9: 'Baby is now officially called a fetus! About the size of a grape.',
    10: 'All vital organs are formed. Baby is the size of a strawberry 🍓',
    12: 'End of first trimester! Risk of miscarriage drops significantly 🌸',
    16: 'Baby can hear your voice now 🎵 Size of an avocado 🥑',
    20: 'Halfway there! You may start feeling movements soon.',
    24: 'Baby is viable if born prematurely. Size of a corn 🌽',
    28: 'Third trimester begins. Baby is gaining fat stores.',
    32: 'Baby is practising breathing movements.',
    36: 'Baby is considered early term. Head may engage soon.',
    38: 'Baby is full term! 🌟 Could arrive any day now.',
    40: 'Your due date! Baby is fully ready. 🌸',
  };

  // Find closest week insight
  const weeks = Object.keys(insights).map(Number).sort((a, b) => a - b);
  const closest = weeks.reduce((prev, curr) =>
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );

  return insights[closest] || `Week ${week} — your baby is growing beautifully 🌸`;
}

// ─── Build pregnancy today summary ───────────────────────────────────────────

export async function buildPregnancySummary(user: AvaUser): Promise<string> {
  const pregnancyStart = (user as any).pregnancy_start_date;
  if (!pregnancyStart) {
    return `I need your last period date to track your pregnancy. Send /settings to add it 🌸`;
  }

  const startDate = new Date(pregnancyStart);
  const { week, trimesterName, daysUntilDue, dueDate } = getPregnancyWeek(startDate);
  const insight = getWeeklyInsight(week);

  const dueDateStr = dueDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    `Good ${getGreeting()}, ${user.name}! 🌸\n\n` +
    `🤰 *Week ${week} — ${trimesterName}*\n\n` +
    `📅 Due date: *${dueDateStr}*\n` +
    `⏳ ${daysUntilDue > 0 ? `${daysUntilDue} days to go` : 'Any day now!'}\n\n` +
    `💡 ${insight}\n\n` +
    `How are you feeling today?`
  );
}

function getGreeting(): string {
  const hour = new Date().getUTCHours() + 1;
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// ─── Switch to pregnancy mode ─────────────────────────────────────────────────

export async function activatePregnancyMode(
  telegramId: number,
  lastPeriodDate: string,
  send: SendFn,
  chatId: number,
  userName: string
): Promise<void> {
  const { updateUser } = await import('./db');
  await updateUser(telegramId, {
    mode: 'pregnant',
    pregnancy_start_date: lastPeriodDate,
  } as any);

  const startDate = new Date(lastPeriodDate);
  const { week, trimesterName, dueDate } = getPregnancyWeek(startDate);
  const dueDateStr = dueDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  await send(chatId,
    `Congratulations, ${userName}! 🌸🤰\n\n` +
    `I've switched to pregnancy mode. Based on your last period:\n\n` +
    `*Week ${week} — ${trimesterName}*\n` +
    `📅 Estimated due date: *${dueDateStr}*\n\n` +
    `I'll track your pregnancy week by week from now. Send /today anytime for your weekly update.\n\n` +
    `To switch back to cycle tracking, send /settings.`
  );
}
