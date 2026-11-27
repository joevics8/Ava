import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

const getCycleData = vi.fn();
vi.mock('../db', async (orig) => ({ ...(await orig<typeof import('../db')>()), getCycleData: (...a: any[]) => (getCycleData as any)(...a) }));

import { menuHeader, buildWeekPlan, showFoodMenu, handleFoodCallback } from '../food';
import { foodsForCycleDay, joinFoods } from '../food/plan';

// Period began 1 Nov 2026 → 27 Nov 2026 = cycle day 27 of 28.
const cycle = { period_start_dates: ['2026-11-01'], avg_cycle_length: 28, period_duration: 5, next_period_start: '2026-11-29' };
const user = (extra: Record<string, unknown> = {}): any => ({ id: 'u1', telegram_id: 1, name: 'Ada', country: 'Nigeria', plan: 'free', ...extra });

describe('menuHeader', () => {
  it('tells her what the suggestions are tailored to', () => {
    expect(menuHeader(user())).toContain('Using *Nigeria* foods');
    expect(menuHeader(user({ country: 'Togo' }))).toContain('West Africa');
    expect(menuHeader(user({ country: 'Narnia' }))).toContain("don't know your region");
    expect(menuHeader(user({ country: 'Narnia', food_region: 'caribbean' }))).toContain('Caribbean');
  });
  it('shows saved preferences, or invites her to add some', () => {
    expect(menuHeader(user())).toContain('No food preferences saved yet');
    const h = menuHeader(user({ food_profile: { diet: 'vegetarian', avoid: 'beans', allergies: 'None', budget: 'Moderate' } }));
    expect(h).toContain('way of eating: vegetarian');
    expect(h).toContain('avoids: beans');
    expect(h).not.toContain('allergies');
    expect(h).not.toContain('Moderate');
  });
  it('falls back to the plain title without a user', () => {
    expect(menuHeader()).toBe('🍽️ *What would you like help with?*');
  });
});

describe('showFoodMenu', () => {
  it('lists the options, including the 7-day plan, and offers region choice only when needed', async () => {
    const sent: any[] = [];
    await showFoodMenu(1, async (_c, text, kb) => { sent.push({ text, kb }); }, user());
    const labels = sent[0].kb.flat().map((b: any) => b.callback_data);
    expect(labels).toEqual(expect.arrayContaining(['food_today', 'food_week', 'food_learn']));
    expect(labels).not.toContain('food_regionpick');
    const sent2: any[] = [];
    await showFoodMenu(1, async (_c, text, kb) => { sent2.push({ text, kb }); }, user({ country: 'Narnia' }));
    expect(sent2[0].kb.flat().map((b: any) => b.callback_data)).toContain('food_regionpick');
  });
});

describe('buildWeekPlan', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-27T08:00:00Z')); });
  afterAll(() => { vi.useRealTimers(); });
  beforeEach(() => getCycleData.mockResolvedValue(cycle));

  it('gives 7 days of that day\'s foods from her country, wrapping at the next period', async () => {
    const { text } = await buildWeekPlan(user());
    expect(text).toContain('Your next 7 days');
    expect(text).toContain('Nigeria foods');
    expect(text.match(/\* · day \d+/g)).toHaveLength(7);
    // Day 27 today, then 28, then back to 1 when the next period starts.
    expect(text).toContain('Today* · day 27');
    expect(text).toContain('day 28');
    expect(text).toContain('day 1\n');
    expect(text).toContain(joinFoods(foodsForCycleDay(27, { country: 'Nigeria', avg: 28, duration: 5 })!.names).replace(/ or /g, ' · ').replace(/, /g, ' · '));
  });
  it('leaves out foods she avoids and says so', async () => {
    const { text } = await buildWeekPlan(user({ food_profile: { avoid: 'fish, beef', allergies: 'eggs' } }));
    expect(text).not.toMatch(/\b(fish|beef|eggs?)\b/i);
    expect(text).toContain('Leaving out foods you avoid');
  });
  it('uses region foods for a country without its own list', async () => {
    expect((await buildWeekPlan(user({ country: 'Togo' }))).text).toContain('West Africa foods');
  });
  it('asks for a region when it has none', async () => {
    const r = await buildWeekPlan(user({ country: 'Narnia' }));
    expect(r.needsRegion).toBe(true);
  });
  it('asks for period dates when it has none, and is not offered in pregnancy', async () => {
    getCycleData.mockResolvedValue(null);
    expect((await buildWeekPlan(user())).text).toContain('period dates');
    expect((await buildWeekPlan(user({ mode: 'pregnant' }))).text).toContain('during pregnancy');
  });
});

describe('handleFoodCallback', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-27T08:00:00Z')); });
  afterAll(() => { vi.useRealTimers(); });
  it('sends the week plan for food_week and the picker for food_regionpick', async () => {
    getCycleData.mockResolvedValue(cycle);
    const sent: string[] = [];
    const send = async (_c: number, t: string) => { sent.push(t); };
    const kbs: any[] = [];
    const sendKb = async (_c: number, t: string, kb: any[][]) => { kbs.push({ t, kb }); };
    expect(await handleFoodCallback(1, user(), 'food_week', send, sendKb)).toBe(true);
    expect(sent[0]).toContain('Your next 7 days');
    await handleFoodCallback(1, user(), 'food_regionpick', send, sendKb);
    expect(kbs[0].kb.flat().map((b: any) => b.callback_data)).toContain('food_region_west-africa');
  });
});
