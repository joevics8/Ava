import { describe, it, expect } from 'vitest';
import { getPregnancyWeek } from '../pregnancy';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe('getPregnancyWeek', () => {
  it('reports week 1 on the LMP date itself', () => {
    const { week } = getPregnancyWeek(daysAgo(0));
    expect(week).toBe(1);
  });

  it('reports week 2 after 7 days', () => {
    const { week } = getPregnancyWeek(daysAgo(7));
    expect(week).toBe(2);
  });

  it('sets due date to 280 days (40 weeks) from LMP', () => {
    const start = new Date('2026-01-01');
    const { dueDate } = getPregnancyWeek(start);
    const expected = new Date('2026-01-01');
    expected.setDate(expected.getDate() + 280);
    expect(dueDate.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10));
  });

  it('places week 30 in the third trimester', () => {
    const { trimesterName } = getPregnancyWeek(daysAgo(30 * 7));
    expect(trimesterName.toLowerCase()).toContain('third');
  });

  it('places week 20 in the second trimester', () => {
    const { trimesterName } = getPregnancyWeek(daysAgo(20 * 7));
    expect(trimesterName.toLowerCase()).toContain('second');
  });

  it('places week 8 in the first trimester', () => {
    const { trimesterName } = getPregnancyWeek(daysAgo(8 * 7));
    expect(trimesterName.toLowerCase()).toContain('first');
  });
});
