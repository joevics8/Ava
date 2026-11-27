import { describe, it, expect } from 'vitest';
import { FOOD_LISTS } from '../food/index';
import { FOOD_TAGS } from '../food/types';
import { COUNTRIES, REGIONS, resolveCountry } from '../countries';
import { foodsForCycleDay, avoidTerms, sourcesFor, PLAN_DAYS } from '../food/plan';
import { getCountryFoods, localizeEatTip } from '../food-data';

const countrySlugs = COUNTRIES.filter(c => c.foodSlug).map(c => c.foodSlug!);
const regionSlugs = REGIONS.map(r => r.id as string);

describe('food lists', () => {
  it('has a list for every country, every region, and the general list', () => {
    for (const s of [...countrySlugs, ...regionSlugs, 'general']) expect(FOOD_LISTS[s], s).toBeDefined();
    expect(Object.keys(FOOD_LISTS).length).toBe(countrySlugs.length + regionSlugs.length + 1);
  });

  for (const [slug, list] of Object.entries(FOOD_LISTS)) {
    it(`${slug}: 55–100 unique foods, valid tags, every tag covered`, () => {
      expect(list.length).toBeGreaterThanOrEqual(55);
      expect(list.length).toBeLessThanOrEqual(100);
      const names = list.map(f => f.name.toLowerCase());
      expect(new Set(names).size).toBe(names.length);
      for (const f of list) {
        expect(f.name.length).toBeGreaterThan(1);
        expect(f.name.length).toBeLessThanOrEqual(45);
        expect(f.tags.length).toBeGreaterThanOrEqual(1);
        expect(f.tags.length).toBeLessThanOrEqual(3);
        for (const t of f.tags) expect(FOOD_TAGS as readonly string[]).toContain(t);
        expect(f.name).not.toMatch(/calor|detox|cleanse|\d/i);
      }
      for (const t of FOOD_TAGS) expect(list.filter(f => f.tags.includes(t)).length, `${slug} ${t}`).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('31-day rotation', () => {
  const who = { country: 'Nigeria' };

  it('gives 3 distinct foods for every day for each of the 50 countries', () => {
    for (const c of COUNTRIES.filter(c => c.foodSlug)) {
      const used = new Set<string>();
      for (let d = 1; d <= PLAN_DAYS; d++) {
        const p = foodsForCycleDay(d, { country: c.name })!;
        expect(p.source).toBe('country');
        expect(p.names.length, `${c.name} day ${d}`).toBe(3);
        expect(new Set(p.names).size).toBe(3);
        p.names.forEach(n => used.add(n));
      }
      // 93 slots over a 55+ list: nearly every food should get a turn.
      expect(used.size, c.name).toBeGreaterThanOrEqual(Math.floor(FOOD_LISTS[c.foodSlug!].length * 0.8));
    }
  });

  it('never repeats a food within 4 days', () => {
    const days = Array.from({ length: PLAN_DAYS }, (_, i) => foodsForCycleDay(i + 1, who)!.names);
    for (let i = 0; i < days.length; i++) for (let j = i + 1; j <= Math.min(i + 4, days.length - 1); j++) {
      expect(days[i].filter(n => days[j].includes(n)), `day ${i + 1} vs ${j + 1}`).toEqual([]);
    }
  });

  it('is deterministic and wraps past day 31', () => {
    expect(foodsForCycleDay(5, who)).toEqual(foodsForCycleDay(5, who));
    expect(foodsForCycleDay(32, who)!.names).toEqual(foodsForCycleDay(1, who)!.names);
  });

  it('favours foods that match the day (menstrual days lean iron)', () => {
    const iron = new Set(FOOD_LISTS.nigeria.filter(f => f.tags.includes('iron')).map(f => f.name));
    const day1 = foodsForCycleDay(1, who)!.names;
    expect(day1.some(n => iron.has(n))).toBe(true);
  });

  it('uses 2 regional + 1 general food for a country without its own list', () => {
    const p = foodsForCycleDay(10, { country: 'Togo' })!;
    expect(p.source).toBe('region');
    expect(p.slug).toBe('west-africa');
    expect(p.names.length).toBe(3);
    const west = new Set(FOOD_LISTS['west-africa'].map(f => f.name));
    const general = new Set(FOOD_LISTS['general'].map(f => f.name));
    expect(p.names.filter(n => west.has(n)).length).toBeGreaterThanOrEqual(2);
    expect(p.names.filter(n => general.has(n)).length).toBeGreaterThanOrEqual(1);
  });

  it('uses the picked region when the country is unknown, and nothing when both are unknown', () => {
    expect(foodsForCycleDay(3, { country: 'Wakanda', region: 'east-africa' })!.slug).toBe('east-africa');
    expect(foodsForCycleDay(3, { country: 'Wakanda' })).toBeNull();
    expect(foodsForCycleDay(3, {})).toBeNull();
  });

  it('keeps excluded foods out of the plan', () => {
    const avoid = avoidTerms('fish, eggs', 'peanuts');
    for (let d = 1; d <= PLAN_DAYS; d++) {
      for (const n of foodsForCycleDay(d, { country: 'Nigeria', avoid })!.names) {
        expect(n.toLowerCase()).not.toMatch(/fish|egg|groundnut|peanut|sardine|shrimp|crayfish/);
      }
    }
  });
});

describe('avoidTerms', () => {
  it('ignores "none" and filler words, expands families', () => {
    expect(avoidTerms('none', 'No')).toEqual([]);
    expect(avoidTerms('I avoid pork')).toContain('pork');
    expect(avoidTerms('dairy')).toContain('cheese');
    expect(avoidTerms('shellfish, nuts')).toEqual(expect.arrayContaining(['shrimp', 'cashew']));
    expect(avoidTerms(undefined, null)).toEqual([]);
  });
});

describe('localizeEatTip with the plan', () => {
  const generic = 'Try iron-rich foods like spinach or lentils.';
  it('uses the day plan when a day is given', () => {
    const t = localizeEatTip(generic, ['iron'], 'can help', 'Ghana', { day: 2, avg: 28, duration: 5 });
    expect(t).toMatch(/^Try .+ today — can help\.$/);
    expect(t).not.toBe(generic);
  });
  it('differs across days (rotation)', () => {
    const tips = new Set([1, 2, 3, 4, 5, 6].map(d => localizeEatTip(generic, ['iron'], 'x', 'Kenya', { day: d })));
    expect(tips.size).toBeGreaterThan(3);
  });
  it('falls back to the generic tip with no country and no region', () => {
    expect(localizeEatTip(generic, ['iron'], 'x', 'Wakanda', { day: 2 })).toBe(generic);
  });
  it('uses the picked region for unknown countries', () => {
    expect(localizeEatTip(generic, ['iron'], 'x', 'Wakanda', { day: 2, region: 'south-asia' })).not.toBe(generic);
  });
});

describe('getCountryFoods / sources', () => {
  it('returns the country list, or region + general', () => {
    expect(getCountryFoods('Nigeria').length).toBe(FOOD_LISTS.nigeria.length);
    expect(getCountryFoods('Togo').length).toBe(FOOD_LISTS['west-africa'].length + FOOD_LISTS.general.length);
    expect(getCountryFoods('Wakanda')).toEqual([]);
    expect(getCountryFoods('Wakanda', 'caribbean').length).toBeGreaterThan(0);
  });
  it('resolves every one of the 50 to country-level data', () => {
    for (const c of COUNTRIES.filter(c => c.foodSlug)) expect(sourcesFor({ country: c.name })!.source).toBe('country');
    expect(resolveCountry('Nigeria')!.foodSlug).toBe('nigeria');
  });
});
