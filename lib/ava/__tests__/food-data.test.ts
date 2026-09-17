import { describe, it, expect } from 'vitest';
import { getCountryFoods, pickLocalFoods, localizeEatTip } from '../food-data';

describe('getCountryFoods', () => {
  it('returns 50 seeded foods for Nigeria', () => {
    // Product target per research notes — locks in the count so a future
    // edit that accidentally drops entries gets caught.
    expect(getCountryFoods('Nigeria').length).toBe(50);
  });

  it('returns the Nigeria list for common spellings/aliases', () => {
    expect(getCountryFoods('Nigeria').length).toBeGreaterThan(0);
    expect(getCountryFoods('nigeria').length).toBeGreaterThan(0);
    expect(getCountryFoods('NG').length).toBeGreaterThan(0);
    expect(getCountryFoods('naija').length).toBeGreaterThan(0);
  });

  it('returns an empty list for an unknown or missing country', () => {
    expect(getCountryFoods('Wakanda')).toEqual([]);
    expect(getCountryFoods(undefined)).toEqual([]);
    expect(getCountryFoods(null)).toEqual([]);
  });
});

describe('pickLocalFoods', () => {
  it('returns foods matching a requested nutrient tag', () => {
    const result = pickLocalFoods(['iron'], 'Nigeria');
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain('beans');
  });

  it('returns null when the country has no seed data', () => {
    expect(pickLocalFoods(['iron'], 'Wakanda')).toBeNull();
  });

  it('returns null when no foods match the requested tags', () => {
    expect(pickLocalFoods(['nonexistent-tag'], 'Nigeria')).toBeNull();
  });
});

describe('localizeEatTip', () => {
  it('substitutes local foods when the country is known and tags match', () => {
    const result = localizeEatTip('Try iron-rich foods like spinach or lentils.', ['iron'], 'can help restore your energy', 'Nigeria');
    expect(result).not.toBe('Try iron-rich foods like spinach or lentils.');
    expect(result).toContain('can help restore your energy');
  });

  it('falls back to the generic tip when the country is unknown', () => {
    const generic = 'Try iron-rich foods like spinach or lentils.';
    expect(localizeEatTip(generic, ['iron'], 'can help restore your energy', undefined)).toBe(generic);
    expect(localizeEatTip(generic, ['iron'], 'can help restore your energy', 'Wakanda')).toBe(generic);
  });
});
