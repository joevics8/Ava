import { describe, it, expect } from 'vitest';
import { AFFIRMATIONS, AFFIRMATION_CATEGORIES, getDailyMorningAffirmation } from '../affirmations';

describe('AFFIRMATIONS content', () => {
  it('has all 12 categories with content', () => {
    for (const cat of AFFIRMATION_CATEGORIES) {
      expect(AFFIRMATIONS[cat.key]?.length).toBeGreaterThan(0);
    }
  });

  it('morning has 50 affirmations, all other categories have at least 5', () => {
    expect(AFFIRMATIONS.morning.length).toBe(50);
    for (const cat of AFFIRMATION_CATEGORIES) {
      if (cat.key === 'morning') continue;
      expect(AFFIRMATIONS[cat.key].length).toBeGreaterThanOrEqual(5);
    }
  });

  it('every affirmation has multiple distinct lines (not a single line, not a repeated line)', () => {
    for (const key of Object.keys(AFFIRMATIONS)) {
      for (const text of AFFIRMATIONS[key]) {
        const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
        expect(lines.length).toBeGreaterThanOrEqual(3);
        expect(new Set(lines).size).toBe(lines.length); // no line repeated verbatim
      }
    }
  });

  it('has no duplicate affirmations across the whole library', () => {
    const all: string[] = [];
    for (const key of Object.keys(AFFIRMATIONS)) all.push(...AFFIRMATIONS[key]);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('getDailyMorningAffirmation', () => {
  it('returns a valid affirmation from the morning pool for any date', () => {
    const jan1 = getDailyMorningAffirmation(new Date(2026, 0, 1));
    const dec31 = getDailyMorningAffirmation(new Date(2026, 11, 31));
    expect(AFFIRMATIONS.morning).toContain(jan1);
    expect(AFFIRMATIONS.morning).toContain(dec31);
  });

  it('rotates rather than always returning the same affirmation', () => {
    const day1 = getDailyMorningAffirmation(new Date(2026, 0, 1));
    const day2 = getDailyMorningAffirmation(new Date(2026, 0, 2));
    expect(day1).not.toBe(day2);
  });
});
