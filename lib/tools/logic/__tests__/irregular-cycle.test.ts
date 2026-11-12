import { describe, expect, it } from 'vitest';
import { iso, parseDate } from '@/lib/tools/calculators';
import { analyseCycles, parseCycleLengths } from '../irregular-cycle';

const start = parseDate('2026-01-01')!;

describe('parseCycleLengths', () => {
  it('accepts commas, spaces and new lines', () => {
    expect(parseCycleLengths('28, 31 27\n35').values).toEqual([28, 31, 27, 35]);
  });
  it('needs 3 to 12 values', () => {
    expect(parseCycleLengths('28, 30').error).toMatch(/at least 3/);
    expect(parseCycleLengths('28,28,28,28,28,28,28,28,28,28,28,28,28').error).toMatch(/no more than 12/);
    expect(parseCycleLengths('').error).toBeTruthy();
  });
  it('rejects non-numbers and out-of-range lengths', () => {
    expect(parseCycleLengths('28, abc, 30').error).toMatch(/not a whole number/);
    expect(parseCycleLengths('28, 2.5, 30').error).toBeTruthy();
    expect(parseCycleLengths('28, 14, 30').error).toMatch(/between 15 and 90/);
    expect(parseCycleLengths('28, 91, 30').error).toMatch(/between 15 and 90/);
    expect(parseCycleLengths('15, 90, 30').error).toBeUndefined();
  });
});

describe('analyseCycles', () => {
  it('computes average, shortest, longest and variation', () => {
    const a = analyseCycles([26, 28, 32], start);
    expect(a.average).toBe(28.7);
    expect(a.shortest).toBe(26);
    expect(a.longest).toBe(32);
    expect(a.variation).toBe(6);
    expect(a.regularity).toBe('regular');
  });
  it('next period range runs from shortest to longest from the first day of the last period', () => {
    const a = analyseCycles([26, 28, 32], start);
    expect(iso(a.nextEarliest)).toBe('2026-01-27');
    expect(iso(a.nextLikely)).toBe('2026-01-30');   // round(28.7) = 29 days
    expect(iso(a.nextLatest)).toBe('2026-02-02');
  });
  it('calendar method: shortest 26 and longest 32 gives cycle days 8 to 21', () => {
    const a = analyseCycles([26, 28, 32], start);
    expect(a.fertileStartDay).toBe(8);
    expect(a.fertileEndDay).toBe(21);
    expect(iso(a.fertileStart!)).toBe('2026-01-08');   // day 8 = start + 7
    expect(iso(a.fertileEnd!)).toBe('2026-01-21');     // day 21 = start + 20
  });
  it('classifies regularity by the gap between shortest and longest', () => {
    expect(analyseCycles([28, 28, 35], start).regularity).toBe('regular');      // 7
    expect(analyseCycles([28, 28, 36], start).regularity).toBe('borderline');   // 8
    expect(analyseCycles([28, 28, 37], start).regularity).toBe('borderline');   // 9
    expect(analyseCycles([28, 28, 38], start).regularity).toBe('irregular');    // 10
    expect(analyseCycles([28, 28, 38], start).wideWindow).toBe(true);
  });
  it('flags cycles under 21 or over 35 days', () => {
    const a = analyseCycles([19, 28, 40], start);
    expect(a.hasShortCycle).toBe(true);
    expect(a.hasLongCycle).toBe(true);
    expect(a.clinicNotes.length).toBeGreaterThanOrEqual(2);
    expect(analyseCycles([28, 29, 30], start).clinicNotes).toEqual([]);
  });
  it('gives no fertile window when the shortest cycle is too short for the rule', () => {
    const a = analyseCycles([17, 28, 30], start);
    expect(a.fertileStart).toBeNull();
    expect(a.fertileEnd).toBeNull();
    expect(a.fertileStartDay).toBe(-1);
  });
  it('identical cycles give a one-length range', () => {
    const a = analyseCycles([28, 28, 28], start);
    expect(a.variation).toBe(0);
    expect(iso(a.nextEarliest)).toBe(iso(a.nextLatest));
  });
});
