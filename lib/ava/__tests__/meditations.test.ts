import { describe, it, expect } from 'vitest';
import { MEDITATIONS, MEDITATION_PURPOSES } from '../meditations';

describe('MEDITATIONS content', () => {
  it('has all 7 purposes with at least 2 scripts each', () => {
    expect(MEDITATION_PURPOSES.length).toBe(7);
    for (const p of MEDITATION_PURPOSES) {
      expect(MEDITATIONS[p.key]?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every script has a non-empty title, duration, setup, and script body', () => {
    for (const key of Object.keys(MEDITATIONS)) {
      for (const item of MEDITATIONS[key]) {
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.duration.length).toBeGreaterThan(0);
        expect(item.setup.length).toBeGreaterThan(0);
        expect(item.script.length).toBeGreaterThan(0);
        // setup is meant to be short position/posture instructions, not the
        // full guided content — script should always be the longer part.
        expect(item.script.length).toBeGreaterThan(item.setup.length);
      }
    }
  });

  it('has no duplicate scripts across the whole library', () => {
    const all: string[] = [];
    for (const key of Object.keys(MEDITATIONS)) {
      for (const item of MEDITATIONS[key]) all.push(item.script);
    }
    expect(new Set(all).size).toBe(all.length);
  });
});
