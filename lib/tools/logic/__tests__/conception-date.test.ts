import { describe, expect, it } from 'vitest';
import { estimateConception, ultrasoundMargin, validateConceptionInput } from '../conception-date';
import { iso, parseDate } from '../../calculators';

const d = (s: string) => parseDate(s)!;
const TODAY = d('2026-11-24');

describe('conception date from due date', () => {
  it('counts back 266 days', () => {
    const r = estimateConception({ method: 'due-date', date: d('2027-03-01') });
    expect(iso(r.conception)).toBe('2026-06-08');
    expect(iso(r.lmp)).toBe('2026-05-25');
    expect(iso(r.dueDate)).toBe('2027-03-01');
    expect(r.marginDays).toBe(7);
  });
  it('shows the days sex could have caused the pregnancy (5 before to 1 after)', () => {
    const r = estimateConception({ method: 'due-date', date: d('2027-03-01') });
    expect(iso(r.sexWindowStart)).toBe('2026-06-03');
    expect(iso(r.sexWindowEnd)).toBe('2026-06-09');
  });
});

describe('conception date from LMP', () => {
  it('28-day cycle: conception 14 days after the LMP and due date LMP + 280', () => {
    const r = estimateConception({ method: 'lmp', date: d('2026-10-01'), cycleLength: 28 });
    expect(iso(r.conception)).toBe('2026-10-15');
    expect(iso(r.dueDate)).toBe('2027-07-08');
    expect(r.cycleLength).toBe(28);
  });
  it('defaults to 28 days', () => {
    expect(iso(estimateConception({ method: 'lmp', date: d('2026-10-01') }).conception)).toBe('2026-10-15');
  });
  it('adjusts for a 35-day cycle (ovulation day 21) and a 24-day cycle (day 10)', () => {
    expect(iso(estimateConception({ method: 'lmp', date: d('2026-10-01'), cycleLength: 35 }).conception)).toBe('2026-10-22');
    expect(iso(estimateConception({ method: 'lmp', date: d('2026-10-01'), cycleLength: 24 }).conception)).toBe('2026-10-11');
  });
  it('adds a caution for cycles outside 24 to 35 days', () => {
    expect(estimateConception({ method: 'lmp', date: d('2026-10-01'), cycleLength: 40 }).notes.join(' ')).toMatch(/less certain/);
  });
});

describe('conception date from ultrasound', () => {
  it('8w0d on 1 Nov: LMP 56 days earlier, conception 14 days after that', () => {
    const r = estimateConception({ method: 'ultrasound', date: d('2026-11-01'), weeks: 8, days: 0 });
    expect(iso(r.lmp)).toBe('2026-09-06');
    expect(iso(r.conception)).toBe('2026-09-20');
    expect(r.marginDays).toBe(5);
  });
  it('margins widen with gestational age', () => {
    expect(ultrasoundMargin(8 * 7 + 6)).toBe(5);
    expect(ultrasoundMargin(9 * 7)).toBe(7);
    expect(ultrasoundMargin(16 * 7)).toBe(10);
    expect(ultrasoundMargin(22 * 7)).toBe(14);
    expect(ultrasoundMargin(30 * 7)).toBe(21);
  });
});

describe('validation', () => {
  it('accepts good input', () => {
    expect(validateConceptionInput({ method: 'due-date', date: d('2027-03-01') }, TODAY)).toBeNull();
    expect(validateConceptionInput({ method: 'lmp', date: d('2026-10-01'), cycleLength: 30 }, TODAY)).toBeNull();
    expect(validateConceptionInput({ method: 'ultrasound', date: d('2026-11-01'), weeks: 8, days: 2 }, TODAY)).toBeNull();
  });
  it('rejects due dates far in the past or too far ahead', () => {
    expect(validateConceptionInput({ method: 'due-date', date: d('2026-01-01') }, TODAY)).toMatch(/ago|more than two weeks/);
    expect(validateConceptionInput({ method: 'due-date', date: d('2027-12-01') }, TODAY)).toMatch(/too far ahead/);
  });
  it('rejects future or very old LMP and bad cycle lengths', () => {
    expect(validateConceptionInput({ method: 'lmp', date: d('2026-12-01') }, TODAY)).toMatch(/future/);
    expect(validateConceptionInput({ method: 'lmp', date: d('2025-01-01') }, TODAY)).toMatch(/42 weeks/);
    expect(validateConceptionInput({ method: 'lmp', date: d('2026-10-01'), cycleLength: 12 }, TODAY)).toMatch(/21 to 45/);
    expect(validateConceptionInput({ method: 'lmp', date: d('2026-10-01'), cycleLength: 28.5 }, TODAY)).toMatch(/21 to 45/);
  });
  it('rejects bad ultrasound input', () => {
    const base = { method: 'ultrasound' as const, date: d('2026-11-01') };
    expect(validateConceptionInput({ ...base }, TODAY)).toMatch(/weeks and days/);
    expect(validateConceptionInput({ ...base, weeks: 3, days: 0 }, TODAY)).toMatch(/between 4 and 41/);
    expect(validateConceptionInput({ ...base, weeks: 8, days: 7 }, TODAY)).toMatch(/0 and 6/);
    expect(validateConceptionInput({ ...base, date: d('2026-12-01'), weeks: 8, days: 0 }, TODAY)).toMatch(/future/);
    expect(validateConceptionInput({ ...base, date: d('2026-01-01'), weeks: 20, days: 0 }, TODAY)).toMatch(/42 weeks/);
  });
});
