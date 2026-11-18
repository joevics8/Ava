import { describe, it, expect } from 'vitest';
import { daysAgoFromDate } from '../period';

describe('daysAgoFromDate', () => {
  const today = '2026-11-18';
  it('counts days back, including beyond a week', () => {
    expect(daysAgoFromDate('2026-11-18', today)).toBe(0);
    expect(daysAgoFromDate('2026-11-09', today)).toBe(9);
    expect(daysAgoFromDate('2026-10-01', today)).toBe(48);
  });
  it('rejects future, too-old, malformed and impossible dates', () => {
    expect(daysAgoFromDate('2026-11-19', today)).toBeNull();
    expect(daysAgoFromDate('2026-08-01', today)).toBeNull();
    expect(daysAgoFromDate('Nov 9', today)).toBeNull();
    expect(daysAgoFromDate(null, today)).toBeNull();
    expect(daysAgoFromDate('2026-02-31', today)).toBeNull();
  });
});
