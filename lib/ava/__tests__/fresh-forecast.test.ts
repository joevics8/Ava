import { describe, it, expect } from 'vitest';
import { freshForecast, withFreshForecast } from '../cycle';

const now = new Date('2026-11-18T08:00:00Z');

describe('freshForecast', () => {
  it('ignores a stale stored next period: after a Nov 9 start the next period is in December, never Oct 8', () => {
    const row = {
      period_start_dates: ['2026-07-15', '2026-09-10', '2026-11-09'], avg_cycle_length: 30,
      next_period_start: '2026-10-08', next_period_end: '2026-10-12', next_ovulation_start: '2026-09-22', next_ovulation_end: '2026-09-24',
    };
    const f = withFreshForecast(row, now)!;
    expect(f.next_period_start >= '2026-12-01').toBe(true);
    expect(f.next_period_start > '2026-11-09').toBe(true);
    expect(f.next_ovulation_start > '2026-11-09').toBe(true);
    expect(f.period_start_dates).toEqual(row.period_start_dates);
  });

  it('follows the date when it is corrected, with no stored value involved', () => {
    const a = freshForecast({ period_start_dates: ['2026-11-09'], avg_cycle_length: 28 }, now)!;
    const b = freshForecast({ period_start_dates: ['2026-11-11'], avg_cycle_length: 28 }, now)!;
    expect(b.next_period_start > a.next_period_start).toBe(true);
  });

  it('keeps a merely late period in the past so lateness stays visible', () => {
    const f = freshForecast({ period_start_dates: ['2026-10-10'], avg_cycle_length: 28 }, now)!; // expected ~Nov 7, 11 days late
    expect(f.next_period_start < '2026-11-18').toBe(true);
  });

  it('rolls an abandoned log forward to a window that is still ahead', () => {
    const f = freshForecast({ period_start_dates: ['2026-06-01'], avg_cycle_length: 28 }, now)!;
    expect(f.next_period_end >= '2026-11-18').toBe(true);
  });

  it('leaves rows with no dates alone', () => {
    expect(withFreshForecast({ period_start_dates: [], next_period_start: '2026-10-08' }, now)!.next_period_start).toBe('2026-10-08');
    expect(withFreshForecast(null, now)).toBeNull();
  });
});
