import { describe, expect, it } from 'vitest';
import { parseDate } from '@/lib/tools/calculators';
import { fromLmp, fromWeeksDays } from '../pregnancy-months';
import { addMonths, calendarAge } from '../pregnancy-dates';

describe('weeks to months', () => {
  it('20 weeks is 4 months and 2 weeks, in the 5th month, second trimester', () => {
    const r = fromWeeksDays(20, 0)!;
    expect(r.completedMonths).toBe(4);
    expect(r.extraWeeks).toBe(2);
    expect(r.currentMonth).toBe(5);
    expect(r.trimester).toBe(2);
    expect(r.exactMonths).toBe(4.6);
    expect(r.weeksLeft).toBe(20);
  });
  it('12 weeks is still the first trimester; 13 weeks starts the second', () => {
    expect(fromWeeksDays(12, 6)!.trimester).toBe(1);
    expect(fromWeeksDays(13, 0)!.trimester).toBe(2);
  });
  it('the third trimester starts at 27 weeks (NHS)', () => {
    expect(fromWeeksDays(26, 6)!.trimester).toBe(2);
    expect(fromWeeksDays(27, 0)!.trimester).toBe(3);
  });
  it('40 weeks is 9 months with 0 weeks left', () => {
    const r = fromWeeksDays(40, 0)!;
    expect(r.completedMonths).toBe(9);
    expect(r.currentMonth).toBe(9);
    expect(r.weeksLeft).toBe(0);
    expect(r.pastDue).toBe(true);
  });
  it('4 weeks is 0 completed months in month 1; 5 weeks is in month 2', () => {
    expect(fromWeeksDays(4, 0)!.currentMonth).toBe(1);
    expect(fromWeeksDays(5, 0)!.currentMonth).toBe(2);
  });
  it('counts weeks and days left to 40 weeks', () => {
    const r = fromWeeksDays(37, 4)!;
    expect(r.weeksLeft).toBe(2);
    expect(r.daysLeft).toBe(3);
  });
  it('flags 42 weeks or more', () => {
    expect(fromWeeksDays(41, 6)!.veryLate).toBe(false);
    expect(fromWeeksDays(42, 0)!.veryLate).toBe(true);
  });
  it('rejects impossible input', () => {
    expect(fromWeeksDays(-1, 0)).toBeNull();
    expect(fromWeeksDays(10, 7)).toBeNull();
    expect(fromWeeksDays(10.5, 0)).toBeNull();
    expect(fromWeeksDays(50, 0)).toBeNull();
  });
  it('works from the last period date and rejects future or ancient dates', () => {
    const today = parseDate('2026-11-08')!;
    expect(fromLmp(parseDate('2026-06-21')!, today)!.weeks).toBe(20);
    expect(fromLmp(parseDate('2026-11-09')!, today)).toBeNull();
    expect(fromLmp(parseDate('2025-01-01')!, today)).toBeNull();
  });
});

describe('calendar helpers', () => {
  it('clamps month ends', () => {
    expect(addMonths(parseDate('2026-01-31')!, 1).toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(addMonths(parseDate('2026-11-30')!, 3).toISOString().slice(0, 10)).toBe('2027-02-28');
  });
  it('measures calendar age', () => {
    expect(calendarAge(parseDate('2026-01-15')!, parseDate('2026-04-20')!)).toMatchObject({ months: 3, weeks: 0, days: 5 });
    expect(calendarAge(parseDate('2026-01-31')!, parseDate('2026-03-01')!).months).toBe(1);
  });
});
