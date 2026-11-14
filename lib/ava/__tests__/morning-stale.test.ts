import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildMorningDigest } from '../morning';

const STALE_LINE = 'I may be out of date on your last period';

// Last period 2026-09-01, 28-day cycle: by 2026-11-14 it is 59 days on, well past the 14-day stale mark.
const user: any = { id: 'u1', name: 'Ada', mode: 'cycle', country: 'NG' };
const cycle = (extra: Record<string, unknown> = {}) => ({
  period_start_dates: ['2026-09-01'],
  avg_cycle_length: 28,
  period_duration: 5,
  next_period_start: '2026-09-29',
  ...extra,
});

describe('morning digest: "may be out of date" line', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-14T08:00:00Z')); });
  afterAll(() => { vi.useRealTimers(); });

  it('shows while the stale date is unconfirmed', async () => {
    const { text } = await buildMorningDigest(user, cycle(), []);
    expect(text).toContain(STALE_LINE);
  });

  it('stops once she has confirmed that date', async () => {
    const { text } = await buildMorningDigest(user, cycle({ last_period_confirmed_for: '2026-09-01' }), []);
    expect(text).not.toContain(STALE_LINE);
  });

  it('a confirmation of an older date does not silence a newer stale one', async () => {
    const { text } = await buildMorningDigest(
      user,
      cycle({ period_start_dates: ['2026-08-04', '2026-09-01'], last_period_confirmed_for: '2026-08-04' }),
      [],
    );
    expect(text).toContain(STALE_LINE);
  });
});
