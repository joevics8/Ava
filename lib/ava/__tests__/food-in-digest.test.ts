import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildMorningDigest } from '../morning';
import { foodsForCycleDay, joinFoods } from '../food/plan';

// Period started 1 Nov 2026, 28-day cycle, so 1 Nov = cycle day 1, 14 Nov = day 14, etc.
const cycle = { period_start_dates: ['2026-11-01'], avg_cycle_length: 28, period_duration: 5, next_period_start: '2026-11-29' };
const base = { id: 'u1', name: 'Ada', mode: 'cycle' };

async function eatLine(user: any, cycleDay: number): Promise<string> {
  vi.setSystemTime(new Date(`2026-11-${String(cycleDay).padStart(2, '0')}T08:00:00Z`));
  const { text } = await buildMorningDigest(user, cycle, []);
  const line = text.split('\n').find(l => l.includes('Eat:'));
  expect(line, `no Eat line on day ${cycleDay}`).toBeDefined();
  return line!;
}

describe('morning digest food = her country + her cycle day', () => {
  beforeAll(() => { vi.useFakeTimers(); });
  afterAll(() => { vi.useRealTimers(); });

  it('shows that day\'s 3 foods from her own country', async () => {
    for (const [country, day] of [['Nigeria', 1], ['Nigeria', 9], ['Japan', 14], ['Brazil', 20], ['India', 27]] as const) {
      const expected = foodsForCycleDay(day, { country, avg: 28, duration: 5 })!;
      expect(expected.source).toBe('country');
      const line = await eatLine({ ...base, country }, day);
      expect(line, `${country} day ${day}`).toContain(joinFoods(expected.names));
    }
  });

  it('changes from one day to the next', async () => {
    const lines = new Set<string>();
    for (let d = 1; d <= 10; d++) lines.add(await eatLine({ ...base, country: 'Ghana' }, d));
    expect(lines.size).toBe(10);
  });

  it('accepts however the country was typed', async () => {
    const a = await eatLine({ ...base, country: 'Nigeria' }, 5);
    expect(await eatLine({ ...base, country: 'naija' }, 5)).toBe(a);
    expect(await eatLine({ ...base, country: ' NG ' }, 5)).toBe(a);
  });

  it('uses region + general foods for a country outside the 50', async () => {
    const expected = foodsForCycleDay(8, { country: 'Togo', avg: 28, duration: 5 })!;
    expect(expected.source).toBe('region');
    expect(await eatLine({ ...base, country: 'Togo' }, 8)).toContain(joinFoods(expected.names));
  });

  it('uses the region she picked when the country is not recognised', async () => {
    const expected = foodsForCycleDay(8, { country: 'Narnia', region: 'caribbean', avg: 28, duration: 5 })!;
    expect(expected.slug).toBe('caribbean');
    expect(await eatLine({ ...base, country: 'Narnia', food_region: 'caribbean' }, 8)).toContain(joinFoods(expected.names));
  });

  it('keeps the generic tip when neither country nor region is known', async () => {
    const line = await eatLine({ ...base, country: 'Narnia' }, 8);
    expect(line).not.toContain('today —');
  });

  it('skips foods she said she avoids or is allergic to', async () => {
    const user = { ...base, country: 'Nigeria', food_profile: { avoid: 'fish, beef', allergies: 'groundnuts' } };
    for (let d = 1; d <= 28; d++) {
      expect((await eatLine(user, d)).toLowerCase()).not.toMatch(/fish|beef|groundnut|peanut/);
    }
  });
});
