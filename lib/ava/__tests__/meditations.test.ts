import { describe, it, expect } from 'vitest';
import { MEDITATIONS, MEDITATION_PURPOSES } from '../meditations';

describe('MEDITATIONS content', () => {
  it('has all 7 purposes with at least 2 scripts each', () => {
    expect(MEDITATION_PURPOSES.length).toBe(7);
    for (const p of MEDITATION_PURPOSES) {
      expect(MEDITATIONS[p.key]?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('has no duplicate scripts across the whole library', () => {
    const all: string[] = [];
    for (const key of Object.keys(MEDITATIONS)) all.push(...MEDITATIONS[key]);
    expect(new Set(all).size).toBe(all.length);
  });
});
