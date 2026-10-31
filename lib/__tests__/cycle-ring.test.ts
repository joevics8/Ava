import { describe, expect, it } from 'vitest';
import { cycleDayFrom, cyclePhases, phaseOfDay } from '@/lib/cycle-ring';

describe('cyclePhases', () => {
  it('splits a 28-day cycle with a 5-day period', () => {
    expect(cyclePhases(28, 5).map(p => [p.key, p.start, p.end])).toEqual([
      ['period', 1, 5],
      ['follicular', 6, 12],
      ['ovulation', 13, 15],
      ['luteal', 16, 28],
    ]);
  });

  it('always covers every day exactly once, for any plausible input', () => {
    for (let cycle = 21; cycle <= 45; cycle++) {
      for (let period = 2; period <= 10; period++) {
        const spans = cyclePhases(cycle, period);
        expect(spans[0].start).toBe(1);
        expect(spans[spans.length - 1].end).toBe(cycle);
        spans.forEach((s, i) => {
          expect(s.days).toBe(s.end - s.start + 1);
          if (i > 0) expect(s.start).toBe(spans[i - 1].end + 1);
        });
        expect(spans.reduce((n, s) => n + s.days, 0)).toBe(cycle);
      }
    }
  });

  it('places ovulation about 14 days before the next period', () => {
    const ov = cyclePhases(32, 5).find(p => p.key === 'ovulation')!;
    expect(ov.start).toBeLessThanOrEqual(32 - 14);
    expect(ov.end).toBeGreaterThanOrEqual(32 - 14);
  });

  it('falls back to defaults for garbage input', () => {
    expect(cyclePhases(Number.NaN, Number.NaN)).toEqual(cyclePhases(28, 5));
  });
});

describe('phaseOfDay', () => {
  const spans = cyclePhases(28, 5);
  it('maps days to phases', () => {
    expect(phaseOfDay(1, spans)).toBe('period');
    expect(phaseOfDay(14, spans)).toBe('ovulation');
    expect(phaseOfDay(28, spans)).toBe('luteal');
  });
  it('returns null outside the cycle', () => {
    expect(phaseOfDay(29, spans)).toBeNull();
  });
});

describe('cycleDayFrom', () => {
  const today = new Date(2026, 9, 31); // 31 Oct 2026, local time
  it('counts the first day of the period as day 1', () => {
    expect(cycleDayFrom('2026-10-31', today)).toBe(1);
    expect(cycleDayFrom('2026-10-18', today)).toBe(14);
  });
  it('crosses month boundaries', () => {
    expect(cycleDayFrom('2026-09-30', today)).toBe(32);
  });
  it('returns null for missing, invalid or future dates', () => {
    expect(cycleDayFrom(undefined, today)).toBeNull();
    expect(cycleDayFrom('not a date', today)).toBeNull();
    expect(cycleDayFrom('2026-11-02', today)).toBeNull();
  });
});
