// Postpartum bleeding (lochia) timeline. Typical ranges follow Cleveland Clinic,
// NHS / NCT and ACOG-style patient guidance. Day 0 is the day of birth.
// These are typical windows, not rules: every body varies. Never a diagnosis.
import { addDays } from '../calculators';

export type DeliveryType = 'vaginal' | 'caesarean';
export type LochiaStage = 'rubra' | 'serosa' | 'alba' | 'tail' | 'beyond';
export type Colour = 'red' | 'brown' | 'yellow' | 'unsure';

export interface StageInfo {
  key: Exclude<LochiaStage, 'beyond'>;
  name: string;
  /** First and last day after birth (day 0 = birth day), inclusive. */
  startDay: number;
  endDay: number;
  colour: string;
  flow: string;
  clots: string;
}

export const STAGES: StageInfo[] = [
  { key: 'rubra', name: 'Lochia rubra', startDay: 0, endDay: 3, colour: 'Dark or bright red', flow: 'Heaviest: like a heavy period, needing a thick maternity pad every few hours.', clots: 'Small clots (smaller than a 50p coin or quarter) can be normal.' },
  { key: 'serosa', name: 'Lochia serosa', startDay: 4, endDay: 11, colour: 'Pink to brown', flow: 'Lighter, thinner and more watery. Moderate and easing.', clots: 'Few or none.' },
  { key: 'alba', name: 'Lochia alba', startDay: 12, endDay: 42, colour: 'Yellowish white or cream', flow: 'Light discharge or spotting. A thin liner is often enough.', clots: 'None.' },
  { key: 'tail', name: 'Light traces', startDay: 43, endDay: 56, colour: 'Cream, pale or a little brown', flow: 'Very light spotting only. Some people still have traces up to about 8 weeks.', clots: 'None.' },
];

export const TYPICAL_END_DAY = 42; // about 6 weeks
export const LONGEST_TYPICAL_DAY = 56; // about 8 weeks
export const MAX_DAYS_SINCE_BIRTH = 120;

const DAY = 24 * 60 * 60 * 1000;
export const daysBetween = (from: Date, to: Date): number => Math.round((to.getTime() - from.getTime()) / DAY);

export interface StageWindow extends StageInfo { start: Date; end: Date }

export interface LochiaTimeline {
  day: number;
  weeks: number;
  stage: LochiaStage;
  current: StageWindow | null;
  windows: StageWindow[];
  typicalEnd: Date;
  longestTypicalEnd: Date;
  flowNote: string;
  headline: string;
}

export function validDeliveryDate(delivery: Date, today: Date): 'ok' | 'future' | 'too-old' {
  const d = daysBetween(delivery, today);
  if (d < 0) return 'future';
  if (d > MAX_DAYS_SINCE_BIRTH) return 'too-old';
  return 'ok';
}

export function stageForDay(day: number): LochiaStage {
  if (day < 0) return 'rubra';
  for (const s of STAGES) if (day >= s.startDay && day <= s.endDay) return s.key;
  return 'beyond';
}

export function buildTimeline(delivery: Date, type: DeliveryType, today: Date): LochiaTimeline | null {
  if (validDeliveryDate(delivery, today) !== 'ok') return null;
  const day = daysBetween(delivery, today);
  const stage = stageForDay(day);
  const windows: StageWindow[] = STAGES.map(s => ({ ...s, start: addDays(delivery, s.startDay), end: addDays(delivery, s.endDay) }));
  const current = windows.find(w => w.key === stage) ?? null;
  const flowNote = type === 'caesarean'
    ? 'After a caesarean you still bleed from the womb, usually the same pattern and length as after a vaginal birth. Some people notice it is a little lighter. Do not use tampons or a cup, and use maternity pads.'
    : 'After a vaginal birth the bleeding is usually heaviest in the first days. Breastfeeding and getting up and about can bring a short gush of redder blood.';
  const headline = current
    ? `Day ${day} after birth: usually ${current.name.toLowerCase()} (${current.colour.toLowerCase()}).`
    : `Day ${day} after birth: bleeding is usually over or only very light spotting by now.`;
  return { day, weeks: Math.floor(day / 7), stage, current, windows, typicalEnd: addDays(delivery, TYPICAL_END_DAY), longestTypicalEnd: addDays(delivery, LONGEST_TYPICAL_DAY), flowNote, headline };
}

/** Optional check of what she is seeing now against the usual pattern. */
export function colourCheck(day: number, colour: Colour): string | null {
  if (colour === 'unsure') return null;
  if (colour === 'red' && day >= 7) return 'Red bleeding after the first week is worth mentioning to your midwife or doctor the same day or next. It can mean the womb is healing slowly or there is an infection.';
  if (colour === 'red' && day >= 4) return 'Bright red blood after day 4 is a little later than usual. Rest, and call your midwife if it is not easing or is getting heavier.';
  if (colour === 'yellow' && day < 4) return 'Yellowish discharge this early is unusual. Mention it to your midwife.';
  return null;
}

export type Level = 'none' | 'call' | 'urgent';
export interface WarningFlags {
  soakingPad: boolean;      // soaking a pad every hour
  bigClots: boolean;        // clots bigger than a golf ball
  foulSmell: boolean;
  fever: boolean;           // fever, chills, flu-like
  heavierOrRed: boolean;    // getting heavier, or back to bright red after easing
  dizzy: boolean;           // dizzy, faint, racing heart
}
export const NO_FLAGS: WarningFlags = { soakingPad: false, bigClots: false, foulSmell: false, fever: false, heavierOrRed: false, dizzy: false };

/** Conservative triage. The first three are treated as urgent. */
export function warningLevel(f: WarningFlags): Level {
  if (f.soakingPad || f.dizzy || f.fever) return 'urgent';
  if (f.bigClots || f.foulSmell || f.heavierOrRed) return 'call';
  return 'none';
}
