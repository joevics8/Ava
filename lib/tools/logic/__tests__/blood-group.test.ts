import { describe, expect, it } from 'vitest';
import { aboNoteApplies, assessBlood, possibleChildAbo, possibleChildRh, rhConcern } from '../blood-group';

describe('ABO inheritance (possible child groups)', () => {
  it('O x O can only have O', () => expect(possibleChildAbo('O', 'O')).toEqual(['O']));
  it('A x A can have A or O, never B or AB', () => expect(possibleChildAbo('A', 'A')).toEqual(['A', 'O']));
  it('A x B can have every group', () => expect(possibleChildAbo('A', 'B')).toEqual(['A', 'B', 'AB', 'O']));
  it('AB x AB cannot have O', () => expect(possibleChildAbo('AB', 'AB')).toEqual(['A', 'B', 'AB']));
  it('AB x O can have A or B only', () => expect(possibleChildAbo('AB', 'O')).toEqual(['A', 'B']));
  it('O x A can have A or O', () => expect(possibleChildAbo('O', 'A')).toEqual(['A', 'O']));
  it('is symmetric', () => {
    for (const m of ['A', 'B', 'AB', 'O'] as const) for (const f of ['A', 'B', 'AB', 'O'] as const) {
      expect(possibleChildAbo(m, f)).toEqual(possibleChildAbo(f, m));
    }
  });
});

describe('Rh inheritance and incompatibility', () => {
  it('two Rh-negative parents can only have an Rh-negative child', () => expect(possibleChildRh('-', '-')).toEqual(['-']));
  it('an Rh-positive parent may carry the negative gene, so either is possible', () => {
    expect(possibleChildRh('+', '+')).toEqual(['+', '-']);
    expect(possibleChildRh('-', '+')).toEqual(['+', '-']);
    expect(possibleChildRh('+', '-')).toEqual(['+', '-']);
  });
  it('concern only when the mother is Rh-negative and the baby could be Rh-positive', () => {
    expect(rhConcern('-', '+')).toBe('possible');
    expect(rhConcern('-', '-')).toBe('none');
    expect(rhConcern('+', '-')).toBe('not-applicable');
    expect(rhConcern('+', '+')).toBe('not-applicable');
  });
  it('flags the O-mother ABO note only when the baby could be A, B or AB', () => {
    expect(aboNoteApplies('O', 'A')).toBe(true);
    expect(aboNoteApplies('O', 'O')).toBe(false);
    expect(aboNoteApplies('A', 'B')).toBe(false);
  });
  it('assessBlood combines everything', () => {
    const r = assessBlood({ abo: 'O', rh: '-' }, { abo: 'A', rh: '+' });
    expect(r.abo).toEqual(['A', 'O']);
    expect(r.rh).toEqual(['+', '-']);
    expect(r.rhConcern).toBe('possible');
    expect(r.aboNote).toBe(true);
  });
});
