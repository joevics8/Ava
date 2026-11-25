// Basal body temperature (BBT) shift detection. Uses the widely taught
// "three over six" rule: three consecutive readings above the highest of the six
// readings before them, with the third at least 0.2 C (about 0.4 F) above that
// coverline (or a fourth reading above it). BBT only CONFIRMS ovulation after
// the fact; it never predicts it. Deliberately conservative: missing or
// disturbed readings are never guessed, and a chart that cannot be read says so.

export type TempUnit = 'C' | 'F';

export interface BbtReading {
  /** 1-based day of the chart (day 1 = first reading, ideally the first day of the period). */
  day: number;
  /** Reading in the unit the person entered; null when the day is missing. */
  temp: number | null;
  /** Marked as unreliable (illness, alcohol, poor sleep, late or different time ...). */
  disturbed: boolean;
}

export const MAX_DAYS = 45;
export const MIN_DAYS_FOR_ANALYSIS = 10;
export const RISE_C = 0.2;
const EPS = 1e-6;
/** Highest believable and lowest believable morning readings. */
const RANGE: Record<TempUnit, [number, number]> = { C: [34, 39.5], F: [93.2, 103.1] };

export const toC = (t: number, unit: TempUnit): number => (unit === 'C' ? t : ((t - 32) * 5) / 9);
export const fromC = (c: number, unit: TempUnit): number => (unit === 'C' ? c : (c * 9) / 5 + 32);
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

const MISSING = new Set(['-', '--', 'x', '?', '_', 'na', 'n/a', 'skip', 'missed', 'none']);

export interface ParseResult {
  readings: BbtReading[];
  errors: string[];
}

/**
 * Turns pasted text into readings. Separators: new lines, spaces, commas or
 * semicolons. A dash, "x" or "?" means a missed day. A trailing "*" marks a
 * disturbed day (for example 36.7*). Use a full stop for decimals.
 */
export function parseReadings(text: string, unit: TempUnit): ParseResult {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const errors: string[] = [];
  const readings: BbtReading[] = [];
  if (tokens.length === 0) return { readings, errors: ['Please enter your morning temperatures, one per day.'] };
  if (tokens.length > MAX_DAYS) {
    return { readings, errors: [`That is ${tokens.length} entries. This tool reads up to ${MAX_DAYS} days (one cycle). Please enter one cycle at a time.`] };
  }
  const [lo, hi] = RANGE[unit];
  tokens.forEach((raw, i) => {
    const day = i + 1;
    const tok = raw.toLowerCase();
    if (MISSING.has(tok)) return void readings.push({ day, temp: null, disturbed: false });
    const disturbed = tok.endsWith('*');
    const numText = disturbed ? tok.slice(0, -1) : tok;
    if (!/^\d{1,3}(\.\d{1,3})?$/.test(numText)) {
      if (errors.length < 3) errors.push(`Day ${day}: "${raw}" is not a temperature. Use numbers like ${unit === 'C' ? '36.45' : '97.6'}, a dash for a missed day, and use a full stop for decimals.`);
      return void readings.push({ day, temp: null, disturbed: false });
    }
    const n = Number(numText);
    if (n < lo || n > hi) {
      if (errors.length < 3) errors.push(`Day ${day}: ${n} is outside the usual range for a morning temperature in °${unit} (${lo} to ${hi}). Check the unit and the digits.`);
      return void readings.push({ day, temp: null, disturbed: false });
    }
    readings.push({ day, temp: n, disturbed });
  });
  return { readings, errors };
}

export interface BbtShift {
  /** Day of the first reading in the sustained higher run. */
  firstHighDay: number;
  /** Day on which the rule was fully met (third or fourth high reading). */
  confirmedOnDay: number;
  usedFourthReading: boolean;
  /** Most likely ovulation day: the day before the first high reading. */
  likelyOvulationDay: number;
  /** Plausible range: from two days before the first high reading to that day. */
  earliestOvulationDay: number;
  latestOvulationDay: number;
  /** Highest of the six readings before the rise, in the person's unit. */
  coverline: number;
  /** Average of the first three high readings minus the coverline, in the person's unit. */
  rise: number;
  /** Days from the first high reading to the end of the chart (or to the first drop). */
  highDays: number;
  /** True when the high run has already ended with a drop to or below the coverline. */
  highRunEnded: boolean;
}

export type BbtStatus = 'shift' | 'no-shift' | 'insufficient';

export interface BbtResult {
  status: BbtStatus;
  unit: TempUnit;
  totalDays: number;
  usableDays: number;
  missingDays: number;
  disturbedDays: number;
  shift: BbtShift | null;
  /** Plain-language notes: reliability, what to check, what the result means. */
  notes: string[];
  /** True when the high run is long enough that a pregnancy test is worth doing. */
  suggestPregnancyTest: boolean;
}

const usable = (r: BbtReading | undefined): r is BbtReading & { temp: number } => !!r && r.temp !== null && !r.disturbed;

export function analyseBbt(readings: BbtReading[], unit: TempUnit): BbtResult {
  const totalDays = readings.length;
  const missingDays = readings.filter(r => r.temp === null).length;
  const disturbedDays = readings.filter(r => r.temp !== null && r.disturbed).length;
  const usableDays = readings.filter(usable).length;
  const base = { unit, totalDays, usableDays, missingDays, disturbedDays };
  const notes: string[] = [];

  if (totalDays < MIN_DAYS_FOR_ANALYSIS || usableDays < 8) {
    return {
      ...base, status: 'insufficient', shift: null, suggestPregnancyTest: false,
      notes: [`Not enough readings to look for a shift. Enter at least ${MIN_DAYS_FOR_ANALYSIS} days with at least 8 usable readings. A shift can only be seen after it has happened, so keep recording until you have several higher days.`],
    };
  }

  const c = readings.map(r => (usable(r) ? toC(r.temp, unit) : null));
  let found: { i: number; confirmAt: number; fourth: boolean; cover: number } | null = null;
  // A possible rise that could not be checked because too many days before it are missing.
  // Scanning stops there: later days would be compared against an already-raised baseline.
  let unverifiedDay: number | null = null;

  for (let i = 6; i + 2 < totalDays && !found; i++) {
    const win = c.slice(i - 6, i).filter((v): v is number => v !== null);
    const a = c[i], b = c[i + 1], d = c[i + 2];
    if (win.length < 5) {
      // Too many gaps before this day to set a trustworthy coverline.
      if (win.length >= 3 && a !== null && b !== null && d !== null) {
        const looseCover = Math.max(...win);
        if (a > looseCover + EPS && b > looseCover + EPS && d > looseCover + EPS) { unverifiedDay = i + 1; break; }
      }
      continue;
    }
    const cover = Math.max(...win);
    if (a === null || b === null || d === null) continue;
    if (!(a > cover + EPS && b > cover + EPS && d > cover + EPS)) continue;
    if (d >= cover + RISE_C - EPS) { found = { i, confirmAt: i + 2, fourth: false, cover }; break; }
    const e = i + 3 < totalDays ? c[i + 3] : null;
    if (e !== null && e > cover + EPS) found = { i, confirmAt: i + 3, fourth: true, cover };
  }

  if (!found) {
    if (unverifiedDay !== null) notes.push(`There may be a rise starting around day ${unverifiedDay}, but too many readings before it are missing or disturbed to check it properly, so it is not counted.`);
    notes.push('No clear temperature shift was found in this chart. That does not mean you did not ovulate: the rise may not have happened yet, readings may be missing or disturbed, or your rise may be small.');
    if (totalDays < 20) notes.push('Your chart is still short. Keep recording each morning; the shift often shows in the second half of a cycle.');
    else notes.push('If several cycles in a row show no shift, and your periods are irregular or you have been trying to conceive for a while, speak to a doctor. A flat chart alone does not diagnose anything.');
    addQualityNotes(notes, base);
    return { ...base, status: 'no-shift', shift: null, suggestPregnancyTest: false, notes };
  }

  const { i, confirmAt, fourth, cover } = found;
  const firstHighDay = i + 1;
  const firstThree = [c[i], c[i + 1], c[i + 2]] as number[];
  const riseC = firstThree.reduce((s, v) => s + v, 0) / 3 - cover;

  // How long the higher run lasts. Missed or disturbed days neither end nor extend it.
  let highDays = 0;
  let ended = false;
  for (let k = i; k < totalDays; k++) {
    const v = c[k];
    if (v === null) { highDays++; continue; }
    if (v > cover + EPS) highDays++;
    else { ended = true; break; }
  }

  const earliest = Math.max(1, firstHighDay - 2);
  const latest = firstHighDay;
  const likely = Math.max(1, firstHighDay - 1);

  const shift: BbtShift = {
    firstHighDay, confirmedOnDay: confirmAt + 1, usedFourthReading: fourth,
    likelyOvulationDay: likely, earliestOvulationDay: earliest, latestOvulationDay: latest,
    coverline: round(fromC(cover, unit), unit === 'C' ? 2 : 1),
    rise: round(unit === 'C' ? riseC : (riseC * 9) / 5, unit === 'C' ? 2 : 2),
    highDays, highRunEnded: ended,
  };

  notes.push(`BBT confirms ovulation after it has happened, so it cannot tell you when to have sex to conceive in this cycle. Use it over several cycles to learn your usual pattern.`);
  if (fourth) notes.push('The third high reading was not quite 0.2 °C (0.4 °F) above the coverline, so a fourth reading above the coverline was needed. This is a slightly weaker shift.');
  if (firstHighDay <= 9) notes.push('The rise started unusually early in the chart. Check that day 1 is the first day of your period, and treat this estimate with extra caution.');
  if (firstHighDay >= 30) notes.push('The rise came late in the cycle, which suggests a longer cycle or later ovulation than usual. This is common with irregular cycles.');
  const spread = (() => {
    const w = c.slice(Math.max(0, i - 6), i).filter((v): v is number => v !== null);
    return Math.max(...w) - Math.min(...w);
  })();
  if (spread > 0.4) notes.push('Your readings before the rise are quite scattered, so the coverline is less reliable. A steadier routine (same time, same thermometer) makes charts easier to read.');
  const nearShift = readings.slice(Math.max(0, i - 3), Math.min(totalDays, i + 5)).some(r => r.temp !== null && r.disturbed);
  if (nearShift) notes.push('One or more readings close to the rise were marked as disturbed and left out. If illness, alcohol or poor sleep affected the days around the rise, the estimate could be off by a day or two.');
  addQualityNotes(notes, base);

  const suggestPregnancyTest = !ended && highDays >= 18;
  if (suggestPregnancyTest) notes.push('Your temperatures have stayed high for 18 days or more. That can be an early sign of pregnancy, so a pregnancy test is worth doing.');

  return { ...base, status: 'shift', shift, notes, suggestPregnancyTest };
}

function addQualityNotes(notes: string[], b: { missingDays: number; disturbedDays: number; usableDays: number; totalDays: number }) {
  if (b.missingDays >= 5) notes.push(`${b.missingDays} days are missing. With this many gaps the chart is hard to read and a real shift could be missed.`);
  else if (b.missingDays > 0) notes.push(`${b.missingDays} missing ${b.missingDays === 1 ? 'day was' : 'days were'} left blank, not guessed.`);
  if (b.disturbedDays > 0) notes.push(`${b.disturbedDays} reading${b.disturbedDays === 1 ? ' was' : 's were'} marked as disturbed and ignored in the calculation. Fever, alcohol, a short night, travel or a different waking time can all push a reading up or down.`);
}
