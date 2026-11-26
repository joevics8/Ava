// Expressed breast milk storage. Uses the most conservative figure from CDC,
// NHS (NICE), La Leche League and the Academy of Breastfeeding Medicine, and
// states the range. Times are "naive" local clock times (no time zones).

export type MilkState = 'fresh' | 'thawed' | 'warmed' | 'leftover';
export type MilkPlace = 'room' | 'cooler' | 'fridge' | 'freezer';

export interface StorageRule {
  /** Conservative limit in hours (null when a month-based or no-storage rule). */
  hours: number | null;
  /** Calendar months (freezer) when the limit is in months. */
  months: number | null;
  /** false = do not store the milk this way; discard instead. */
  allowed: boolean;
  /** What we count the time from. */
  from: string;
  /** Plain-language range across guidelines. */
  range: string;
  note?: string;
}

export const STATE_LABELS: Record<MilkState, string> = {
  fresh: 'Freshly expressed',
  thawed: 'Thawed from frozen',
  warmed: 'Previously warmed',
  leftover: 'Leftover from a feed',
};
export const PLACE_LABELS: Record<MilkPlace, string> = {
  room: 'Room temperature',
  cooler: 'Insulated cooler with frozen ice packs',
  fridge: 'Fridge (4C or colder)',
  freezer: 'Freezer',
};
export const TIME_LABELS: Record<MilkState, string> = {
  fresh: 'Time you expressed it',
  thawed: 'Time it finished thawing',
  warmed: 'Time you warmed it',
  leftover: 'Time the feed ended',
};

const no = (from: string, note: string): StorageRule => ({ hours: null, months: null, allowed: false, from, range: 'Not recommended', note });
const hrs = (hours: number, from: string, range: string, note?: string): StorageRule => ({ hours, months: null, allowed: true, from, range, note });

export const HOT_ROOM_HOURS = 2;

export function ruleFor(state: MilkState, place: MilkPlace, hotRoom = false): StorageRule {
  switch (state) {
    case 'fresh':
      if (place === 'room') {
        return hotRoom
          ? hrs(HOT_ROOM_HOURS, 'time expressed', 'Guidelines allow 4 to 8 hours in a cool room, but milk spoils faster above 25C', 'Warm rooms shorten the safe time. This 2-hour limit is a cautious precaution, so refrigerate or cool the milk as soon as you can.')
          : hrs(4, 'time expressed', '4 hours (CDC, ABM) up to 6 to 8 hours (La Leche League) at 25C or cooler');
      }
      if (place === 'cooler') return hrs(24, 'time expressed', 'Up to 24 hours (CDC)', 'Only while the ice packs stay frozen. If they have thawed, move the milk to a fridge or use it within 4 hours.');
      if (place === 'fridge') return hrs(96, 'time expressed', '4 days (CDC, ABM) to 5 days (NHS); La Leche League allows up to 8 days in very clean conditions', 'Store at the back of the fridge, not in the door.');
      return { hours: null, months: 6, allowed: true, from: 'date expressed', range: '6 months is best (CDC, NHS, ABM); up to 12 months is acceptable (CDC, ABM)', note: 'Keep at the back of the freezer, not the door. Label with the date.' };
    case 'thawed':
      if (place === 'room') return hrs(2, 'time fully thawed', 'About 1 to 2 hours (CDC: 2 hours once at room temperature)');
      if (place === 'cooler') return hrs(2, 'time fully thawed', 'Not covered by the main guidelines', 'We treat thawed milk in a cooler like room temperature to stay safe. Move it to a fridge as soon as possible.');
      if (place === 'fridge') return hrs(24, 'time fully thawed', '24 hours (CDC, NHS, ABM), counted from when it is fully thawed, not from when it was expressed');
      return no('time fully thawed', 'Never refreeze breast milk once it has thawed. Use it within 24 hours in the fridge, or discard it.');
    case 'warmed':
      if (place === 'room' || place === 'cooler') return hrs(2, 'time you warmed it', 'Up to 2 hours (CDC); some guidance says 1 hour', 'Warmed milk that has not been touched by the baby should still be used soon.');
      return no('time you warmed it', 'Milk that has been warmed should not go back in the fridge or freezer. Use it within 2 hours or discard it.');
    case 'leftover':
      if (place === 'room' || place === 'cooler') return hrs(1, 'end of the feed', 'Guidelines range from 1 to 2 hours (CDC: 2 hours)', 'Baby\'s saliva adds bacteria, so leftover milk has the shortest life. Do not save it for the next feed after this.');
      return no('end of the feed', 'Leftover milk should not be stored again. Discard it after the time limit.');
  }
}

export interface DiscardResult {
  rule: StorageRule;
  discardBy: Date | null;
  summary: string;
}

/** "YYYY-MM-DDTHH:mm" (datetime-local value) as a naive clock time held in UTC fields. */
export function parseDateTime(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(`${s}:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 16) !== s) return null;
  return d;
}

export function addHours(d: Date, h: number): Date { return new Date(d.getTime() + h * 3600 * 1000); }
export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + n);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

export function formatDuration(rule: StorageRule): string {
  if (!rule.allowed) return 'Do not store';
  if (rule.months) return `${rule.months} months`;
  const h = rule.hours as number;
  if (h >= 48 && h % 24 === 0) return `${h / 24} days`;
  return `${h} hour${h === 1 ? '' : 's'}`;
}

export function discardBy(state: MilkState, place: MilkPlace, start: Date, hotRoom = false): DiscardResult {
  const rule = ruleFor(state, place, hotRoom);
  if (!rule.allowed) return { rule, discardBy: null, summary: rule.note ?? 'Do not store this milk.' };
  const by = rule.months ? addMonths(start, rule.months) : addHours(start, rule.hours as number);
  return { rule, discardBy: by, summary: `Use or discard within ${formatDuration(rule)} of the ${rule.from}.` };
}

/** Format a naive date-time as "Tue 3 Nov, 14:30". */
export function fmtDateTime(d: Date): string {
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const time = d.toISOString().slice(11, 16);
  return `${date}, ${time}`;
}

export function hoursLeft(by: Date, now: Date): number {
  return (by.getTime() - now.getTime()) / 3600000;
}

export const HANDLING_RULES: string[] = [
  'Thaw in the fridge overnight, or in a container of warm (not hot) water, or under lukewarm running water. Never in a microwave or on the hob.',
  'Warming is optional. Baby can have milk cold or at room temperature. If you warm it, keep the container sealed in warm water for a few minutes and test a few drops on your wrist.',
  'Never refreeze milk once it has fully thawed. Milk that still has ice crystals (for example after a power cut) can go back in the freezer; milk that has fully melted cannot.',
  'Swirl gently to mix the separated fat. Do not shake hard.',
  'Use the oldest milk first. Label every container with the date and time expressed.',
  'Store in small amounts (60 to 120 ml) to reduce waste. Fresh milk from the same day can be combined once chilled to the same temperature.',
  'If milk smells sour or soapy, it may be spoiled. A change in colour on its own is normal; smell and taste are better clues.',
];
