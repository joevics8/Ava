import { describe, expect, it } from 'vitest';
import { analyseSafePeriod, parseCycleLengths, validateSafePeriodInput } from '../safe-period';
import { iso, parseDate } from '../../calculators';

const d = (s: string) => parseDate(s)!;
const TODAY = d('2026-11-24');
const run = (lens: number[], last = '2026-11-10') => analyseSafePeriod({ cycleLengths: lens, lastPeriodStart: d(last) }, TODAY);

describe('safe period analysis', () => {
  it('regular 28-day cycles: Standard Days window of days 8 to 19', () => {
    const r = run([28, 28, 28, 28, 28, 28]);
    expect([r.firstFertileDay, r.lastFertileDay]).toEqual([8, 19]);
    expect(r.suitability).toBe('possible');
    expect(r.irregular).toBe(false);
  });
  it('never narrower than days 8 to 19 when all cycles are 26 to 32 days', () => {
    const r = run([29, 29, 30, 29, 30, 29]);
    expect(r.firstFertileDay).toBe(8);
    expect(r.lastFertileDay).toBe(19);
  });
  it('widens using shortest minus 18 and longest minus 11 for wider spread', () => {
    const r = run([26, 32, 28, 30, 27, 31]);
    expect(r.firstFertileDay).toBe(8);  // 26-18
    expect(r.lastFertileDay).toBe(21);  // 32-11
  });
  it('flags irregular cycles as not suitable', () => {
    const r = run([24, 35, 28, 40, 30, 27]);
    expect(r.irregular).toBe(true);
    expect(r.suitability).toBe('not-suitable');
    expect(r.warnings.join(' ')).toMatch(/irregular|cannot be predicted/);
  });
  it('two cycles outside 26 to 32 days is not suitable; one is caution', () => {
    expect(run([25, 33, 28, 28, 28, 28]).suitability).toBe('not-suitable');
    expect(run([28, 28, 33, 28, 28, 28]).suitability).toBe('caution');
  });
  it('limited history gives caution and a warning', () => {
    const r = run([28, 28, 28]);
    expect(r.limitedHistory).toBe(true);
    expect(r.suitability).toBe('caution');
  });
  it('first cycle window is dated from the last period start', () => {
    const r = run([28, 28, 28, 28, 28, 28], '2026-11-20');
    expect(iso(r.windows[0].fertileFrom)).toBe('2026-11-27');
    expect(iso(r.windows[0].fertileTo)).toBe('2026-12-08');
  });
  it('skips windows that are already over and later windows use the shortest and longest cycle', () => {
    const r = run([26, 30, 28, 28, 28, 28], '2026-10-01');
    expect(r.windows[0].fertileTo.getTime()).toBeGreaterThanOrEqual(TODAY.getTime());
    const w1 = r.windows.find(w => w.cycleIndex === 1);
    if (w1) expect(w1.fertileFrom.getTime()).toBeLessThan(w1.fertileTo.getTime());
  });
  it('windows keep widening with each future cycle', () => {
    const r = run([26, 32, 28, 30, 27, 31], '2026-11-20');
    const widths = r.windows.map(w => w.fertileTo.getTime() - w.fertileFrom.getTime());
    expect(widths[1]).toBeGreaterThan(widths[0]);
  });
});

describe('parseCycleLengths', () => {
  it('parses commas and spaces', () => {
    expect(parseCycleLengths('28, 30 27;31')).toEqual({ ok: true, values: [28, 30, 27, 31] });
  });
  it('rejects empty and non-numeric input', () => {
    expect(parseCycleLengths('  ').ok).toBe(false);
    expect(parseCycleLengths('28, abc').ok).toBe(false);
    expect(parseCycleLengths('28.5, 30').ok).toBe(false);
  });
});

describe('validateSafePeriodInput', () => {
  const ok = { cycleLengths: [28, 29, 30, 28, 27, 29], lastPeriodStart: d('2026-11-10') };
  it('accepts valid input', () => expect(validateSafePeriodInput(ok, TODAY)).toBeNull());
  it('needs at least 3 cycles and at most 12', () => {
    expect(validateSafePeriodInput({ ...ok, cycleLengths: [28, 28] }, TODAY)).toMatch(/at least 3/);
    expect(validateSafePeriodInput({ ...ok, cycleLengths: Array(13).fill(28) }, TODAY)).toMatch(/at most/);
  });
  it('rejects cycles outside 21 to 45 days', () => {
    expect(validateSafePeriodInput({ ...ok, cycleLengths: [28, 28, 50] }, TODAY)).toMatch(/21 to 45/);
    expect(validateSafePeriodInput({ ...ok, cycleLengths: [28, 28, 18] }, TODAY)).toMatch(/21 to 45/);
  });
  it('rejects a future or very old last period', () => {
    expect(validateSafePeriodInput({ ...ok, lastPeriodStart: d('2026-12-01') }, TODAY)).toMatch(/future/);
    expect(validateSafePeriodInput({ ...ok, lastPeriodStart: d('2026-05-01') }, TODAY)).toMatch(/4 months/);
  });
});
