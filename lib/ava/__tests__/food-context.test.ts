import { describe, it, expect } from 'vitest';
import { buildFoodContext, looksFoodRelated, topicTags, profileLines } from '../food-context';
import { FOOD_LISTS } from '../food/index';
import { isExcluded, avoidTerms, dietTerms } from '../food/plan';

const cycle = { day: 2, avg: 28, duration: 5, phase: 'Menstrual phase' };
const user = (extra: Record<string, unknown> = {}): any => ({ id: 'u', name: 'Ada', country: 'Nigeria', ...extra });

describe('looksFoodRelated', () => {
  it('spots food questions', () => {
    for (const t of ['what should I eat today?', 'I am hungry', 'any good breakfast ideas', 'foods high in iron', 'something to eat for cramps', 'what can I cook tonight']) expect(looksFoodRelated(t), t).toBe(true);
  });
  it('ignores everything else', () => {
    for (const t of ['when is my next period', 'is spotting normal', 'I have cramps', 'thanks!', 'how long does ovulation last']) expect(looksFoodRelated(t), t).toBe(false);
  });
});

describe('topicTags', () => {
  it('maps what she asks to nutrient tags', () => {
    expect(topicTags('I am so tired, what should I eat')).toEqual(expect.arrayContaining(['energy', 'iron']));
    expect(topicTags('foods for cramps')).toContain('magnesium');
    expect(topicTags('I feel bloated')).toContain('digestion');
    expect(topicTags('hello')).toEqual([]);
  });
});

describe('buildFoodContext', () => {
  it('is empty when the message is not about food', () => {
    expect(buildFoodContext(user(), 'is spotting normal?', cycle)).toBe('');
  });

  it("includes her country's foods, today's picks and cycle day", () => {
    const out = buildFoodContext(user(), 'what should I eat today?', cycle);
    expect(out).toContain('FOOD CONTEXT');
    expect(out).toContain('Nigeria');
    expect(out).toContain('Cycle day 2');
    expect(out).toContain("Today's picks");
    expect(out).toContain('Local foods that fit what she asked');
  });

  it('lists foods that fit the question first (tired → energy/iron foods)', () => {
    const out = buildFoodContext(user(), 'I am so tired, what can I eat?', undefined);
    const names = /Local foods that fit what she asked: (.+)\./.exec(out)![1].split(', ').slice(0, 6);
    const byName = new Map(FOOD_LISTS.nigeria.map(f => [f.name, f.tags]));
    for (const n of names) expect(byName.get(n)!.some(t => t === 'energy' || t === 'iron'), n).toBe(true);
  });

  it('never offers foods she avoids or that break her diet', () => {
    const u = user({ food_profile: { diet: 'vegetarian', avoid: 'beans', allergies: 'eggs' } });
    const out = buildFoodContext(u, 'what should I eat for iron?', cycle);
    const listed = out.split('\n').filter(l => /Local foods|Today's picks/.test(l)).join(' ');
    expect(listed).not.toMatch(/\b(beef|chicken|goat|fish|liver|beans?|eggs?)\b/i);
    expect(out).toContain('Way of eating: vegetarian');
  });

  it('uses the closest region for a country without its own list', () => {
    const out = buildFoodContext(user({ country: 'Togo' }), 'what should I eat?', cycle);
    expect(out).toContain('West Africa');
  });

  it('uses the region she picked when her country is unknown', () => {
    const out = buildFoodContext(user({ country: 'Narnia', food_region: 'caribbean' }), 'what should I eat?', cycle);
    expect(out).toContain('Caribbean');
  });

  it('says so when it has no local list at all', () => {
    const out = buildFoodContext(user({ country: 'Narnia' }), 'what should I eat?', cycle);
    expect(out).toContain('no local list');
    expect(out).not.toContain('Local foods that fit');
  });

  it('works without a cycle (pregnant or no dates)', () => {
    const out = buildFoodContext(user(), 'what should I eat?', undefined);
    expect(out).not.toContain('Cycle day');
    expect(out).toContain('Local foods that fit');
  });

  it('notes when nothing is saved and skips "none" answers', () => {
    expect(buildFoodContext(user(), 'what should I eat?', cycle)).toContain('No saved food preferences yet');
    expect(profileLines({ avoid: 'None', allergies: 'none', budget: 'Moderate' } as any)).toEqual(['Budget: Moderate']);
  });
});

describe('food exclusion matching', () => {
  it('matches whole words, not fragments', () => {
    expect(isExcluded('chamomile tea', ['ham'])).toBe(false);
    expect(isExcluded('coconut water', ['nut'])).toBe(false);
    expect(isExcluded('eggplant stew', ['egg'])).toBe(false);
    expect(isExcluded('boiled eggs', ['egg'])).toBe(true);
    expect(isExcluded('roasted nuts', ['nut'])).toBe(true);
    expect(isExcluded('anchovies on toast', ['anchov'])).toBe(true);
    expect(isExcluded('Grilled Chicken', ['chicken'])).toBe(true);
  });
  it('turns ways of eating into avoided words', () => {
    expect(dietTerms('I am vegetarian')).toEqual(expect.arrayContaining(['beef', 'chicken', 'fish', 'shrimp']));
    expect(dietTerms('vegan')).toEqual(expect.arrayContaining(['milk', 'egg', 'honey']));
    expect(dietTerms('halal')).toEqual(expect.arrayContaining(['pork']));
    expect(dietTerms('halal')).not.toContain('beef');
    expect(dietTerms('none')).toEqual([]);
    expect(avoidTerms('vegetarian')).toEqual(expect.arrayContaining(['beef', 'fish']));
  });
});
