import { describe, it, expect } from 'vitest';
import { resolveCountry, regionFor, COUNTRIES, REGIONS, normalizeCountryInput } from '../countries';

describe('resolveCountry', () => {
  it('resolves names, aliases, codes and spellings', () => {
    for (const t of ['Nigeria', 'nigeria', 'NG', 'naija', ' Nigeria ', 'NIGERIA.', 'The Gambia']) expect(resolveCountry(t)).not.toBeNull();
    expect(resolveCountry('USA')?.name).toBe('United States');
    expect(resolveCountry('U.S.A.')?.name).toBe('United States');
    expect(resolveCountry('England')?.name).toBe('United Kingdom');
    expect(resolveCountry("Cote d'Ivoire")?.foodSlug).toBe('ivory-coast');
    expect(resolveCountry('Côte d’Ivoire')?.foodSlug).toBe('ivory-coast');
    expect(resolveCountry('Türkiye')?.foodSlug).toBe('turkey');
    expect(resolveCountry('Korea')?.foodSlug).toBe('south-korea');
  });
  it('accepts a city before the country and one-letter typos', () => {
    expect(resolveCountry('Lagos, Nigeria')?.name).toBe('Nigeria');
    expect(resolveCountry('Nigria')?.name).toBe('Nigeria');
    expect(resolveCountry('Ghanna')?.name).toBe('Ghana');
  });
  it('returns null for nonsense, empty input and short unknowns', () => {
    for (const t of ['Wakanda', '', '   ', null, undefined, 'xx', 'asdfgh']) expect(resolveCountry(t as any)).toBeNull();
  });
  it('normalises input', () => {
    expect(normalizeCountryInput('  The U.S.A. ')).toBe('usa');
  });
});

describe('country table', () => {
  it('has exactly 50 countries with their own food list', () => {
    expect(COUNTRIES.filter(c => c.foodSlug).length).toBe(50);
  });
  it('gives every country a known region and keeps names unique', () => {
    const ids = new Set(REGIONS.map(r => r.id));
    for (const c of COUNTRIES) expect(ids.has(c.region)).toBe(true);
    expect(new Set(COUNTRIES.map(c => c.name)).size).toBe(COUNTRIES.length);
    expect(COUNTRIES.length).toBeGreaterThan(190);
  });
  it('maps remaining countries to the right region', () => {
    expect(resolveCountry('Togo')?.region).toBe('west-africa');
    expect(resolveCountry('Rwanda')?.region).toBe('east-africa');
    expect(resolveCountry('Nepal')?.region).toBe('south-asia');
    expect(resolveCountry('Fiji')?.region).toBe('oceania-pacific');
    expect(resolveCountry('Cuba')?.region).toBe('caribbean');
  });
});

describe('regionFor', () => {
  it('prefers the country region, then the picked one', () => {
    expect(regionFor('Togo', 'east-africa')).toBe('west-africa');
    expect(regionFor('Wakanda', 'east-africa')).toBe('east-africa');
    expect(regionFor('Wakanda', 'nope')).toBeNull();
    expect(regionFor(null, null)).toBeNull();
  });
});
