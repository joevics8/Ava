// ONE place where a period date typed in chat reaches cycle_data (the only
// source the morning digest, /today, the dashboard and the chat context read).
// It runs on every free-text message BEFORE the message is classified, so it no
// longer depends on the classifier calling the message a "LOG" (a date typed in
// answer to Ava's question used to be classed as CONVERSATION and never saved).

const MENTIONS_PERIOD = /period|menstru|menses|bleed|spotting|\bflow\b|\bday\s*(one|1)\b|\bstarted\b|\bcame\b|\bshowed\b|\bcame on\b/i;
const ASKED_FOR_DATE = /when did|send me the date|last start|latest one start|your last period|period out|did your period/i;

/** Cheap gate so the date check (one small AI call) only runs when it could matter. */
export function mightStatePeriodDate(text: string, lastAvaText = ''): boolean {
  if (!text || text.length > 300) return false;
  if (MENTIONS_PERIOD.test(text)) return true;
  // A bare date ("9 Nov") answering Ava's own question.
  return ASKED_FOR_DATE.test(lastAvaText) && /\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|today|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(text);
}

export interface PeriodChatDeps {
  extract: (message: string, lastAvaText: string) => Promise<number | null>;
  record: (userId: string, daysAgo: number) => Promise<void>;
}

/** Returns true when a period start was recorded. */
export async function recordPeriodDateFromChat(
  userId: string, text: string, lastAvaText: string, deps: PeriodChatDeps,
): Promise<boolean> {
  if (!mightStatePeriodDate(text, lastAvaText)) return false;
  const daysAgo = await deps.extract(text, lastAvaText);
  if (daysAgo === null) return false;
  await deps.record(userId, daysAgo);
  return true;
}
