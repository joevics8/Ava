import { describe, it, expect } from 'vitest';
import { hasMonthOfHistory } from '../morning';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('hasMonthOfHistory', () => {
  it('returns false with no logs', () => {
    expect(hasMonthOfHistory([])).toBe(false);
  });

  it('returns false when the oldest log is under 30 days old', () => {
    const logs = [
      { logged_at: daysAgo(2) },
      { logged_at: daysAgo(10) },
      { logged_at: daysAgo(20) }, // oldest — 20 days, not enough
    ] as any;
    expect(hasMonthOfHistory(logs)).toBe(false);
  });

  it('returns true when the oldest log is 30+ days old', () => {
    const logs = [
      { logged_at: daysAgo(2) },
      { logged_at: daysAgo(15) },
      { logged_at: daysAgo(31) }, // oldest — over 30 days
    ] as any;
    expect(hasMonthOfHistory(logs)).toBe(true);
  });

  it('free users are structurally capped at 14 days of retained history, so this can never be true for them', () => {
    // Mirrors getMemoryContext's 14-day fetch window for free users — even
    // the oldest possible log a free user could have fetched is well short
    // of the 30-day threshold.
    const logs = [{ logged_at: daysAgo(14) }] as any;
    expect(hasMonthOfHistory(logs)).toBe(false);
  });
});
