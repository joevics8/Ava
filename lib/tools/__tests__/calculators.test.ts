import { describe, it, expect } from 'vitest';
import { parseDate, iso, forecastPeriods, forecastOvulation, forecastDueDate, validCycleLength } from '../calculators';

describe('calculators', () => {
  it('parses only real calendar dates', () => {
    expect(parseDate('2026-09-10')).not.toBeNull();
    expect(parseDate('2026-02-30')).toBeNull();
    expect(parseDate('10/09/2026')).toBeNull();
  });

  it('forecasts periods with a ±2 day window', () => {
    const [p1, p2] = forecastPeriods(parseDate('2026-09-10')!, 30, 5);
    expect(iso(p1.start)).toBe('2026-10-10');
    expect(iso(p1.windowStart)).toBe('2026-10-08');
    expect(iso(p1.windowEnd)).toBe('2026-10-12');
    expect(iso(p1.end)).toBe('2026-10-14');
    expect(iso(p2.start)).toBe('2026-11-09');
  });

  it('puts ovulation 14 days before the next period and the fertile window 5 days before it', () => {
    const o = forecastOvulation(parseDate('2026-09-10')!, 30);
    expect(iso(o.nextPeriod)).toBe('2026-10-10');
    expect(iso(o.ovulation)).toBe('2026-09-26');
    expect(iso(o.fertileStart)).toBe('2026-09-21');
    expect(iso(o.fertileEnd)).toBe('2026-09-27');
  });

  it('computes due date as LMP + 280 days and the gestational age', () => {
    const d = forecastDueDate(parseDate('2026-01-01')!, new Date('2026-03-12T10:00:00Z'));
    expect(iso(d.dueDate)).toBe('2026-10-08');
    expect(d.weeks).toBe(10);
    expect(d.days).toBe(0);
    expect(d.trimester).toBe(1);
  });

  it('rejects implausible cycle lengths', () => {
    expect(validCycleLength(28)).toBe(true);
    expect(validCycleLength(12)).toBe(false);
    expect(validCycleLength(28.5)).toBe(false);
  });
});
