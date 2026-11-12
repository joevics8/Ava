import { describe, expect, it } from 'vitest';
import { parseDate } from '@/lib/tools/calculators';
import { timingFromPeriod, timingFromSex } from '../pregnancy-test-timing';

const d = (s: string) => parseDate(s)!;
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe('timing from unprotected sex', () => {
  const sex = d('2026-11-01');
  it('earliest possible positive is about 10 days after; a reliable negative is 21 days after', () => {
    const t = timingFromSex(sex, d('2026-11-02'))!;
    expect(iso(t.earliest)).toBe('2026-11-11');
    expect(iso(t.reliable)).toBe('2026-11-22');
    expect(iso(t.retestFrom)).toBe('2026-11-25');
    expect(iso(t.retestTo)).toBe('2026-11-29');
  });
  it('places today as too early, early or reliable', () => {
    expect(timingFromSex(sex, d('2026-11-05'))!.today).toBe('too-early');
    expect(timingFromSex(sex, d('2026-11-15'))!.today).toBe('early');
    expect(timingFromSex(sex, d('2026-11-22'))!.today).toBe('reliable');
    expect(timingFromSex(sex, d('2027-01-01'))!.today).toBe('reliable');
  });
  it('rejects a date in the future', () => {
    expect(timingFromSex(d('2026-11-10'), d('2026-11-08'))).toBeNull();
  });
});

describe('timing from the last period', () => {
  it('28-day cycle: period due day 28, ovulation day 14, earliest test 4 days before the period', () => {
    const t = timingFromPeriod(d('2026-10-01'), 28, d('2026-10-15'))!;
    expect(iso(t.expectedPeriod!)).toBe('2026-10-29');
    expect(iso(t.earliest)).toBe('2026-10-25');
    expect(iso(t.reliable)).toBe('2026-10-29');
    expect(iso(t.retestFrom)).toBe('2026-11-01');
    expect(iso(t.retestTo)).toBe('2026-11-05');
  });
  it('a longer cycle (for irregular periods) moves the reliable date later', () => {
    expect(iso(timingFromPeriod(d('2026-10-01'), 40, d('2026-10-15'))!.reliable)).toBe('2026-11-10');
  });
  it('places today in the timeline', () => {
    const last = d('2026-10-01');
    expect(timingFromPeriod(last, 28, d('2026-10-20'))!.today).toBe('too-early');
    expect(timingFromPeriod(last, 28, d('2026-10-27'))!.today).toBe('early');
    expect(timingFromPeriod(last, 28, d('2026-10-29'))!.today).toBe('reliable');
  });
  it('rejects bad cycle lengths and future dates', () => {
    expect(timingFromPeriod(d('2026-10-01'), 10, d('2026-10-15'))).toBeNull();
    expect(timingFromPeriod(d('2026-10-01'), 90, d('2026-10-15'))).toBeNull();
    expect(timingFromPeriod(d('2026-10-01'), 28.5, d('2026-10-15'))).toBeNull();
    expect(timingFromPeriod(d('2026-11-10'), 28, d('2026-11-08'))).toBeNull();
  });
});
