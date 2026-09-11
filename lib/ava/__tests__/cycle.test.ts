import { describe, it, expect } from 'vitest';
import {
  calcAverageCycleLength,
  predictNextPeriod,
  predictOvulationWindow,
  getCurrentPhase,
} from '../cycle';

describe('calcAverageCycleLength', () => {
  it('defaults to 28 with fewer than 2 dates', () => {
    expect(calcAverageCycleLength([])).toBe(28);
    expect(calcAverageCycleLength([new Date('2026-01-01')])).toBe(28);
  });

  it('averages gaps between sorted period start dates', () => {
    const dates = [
      new Date('2026-01-01'),
      new Date('2026-01-29'), // 28 days
      new Date('2026-02-26'), // 28 days
    ];
    expect(calcAverageCycleLength(dates)).toBe(28);
  });

  it('sorts unordered input before computing gaps', () => {
    const dates = [
      new Date('2026-02-26'),
      new Date('2026-01-01'),
      new Date('2026-01-29'),
    ];
    expect(calcAverageCycleLength(dates)).toBe(28);
  });
});

describe('predictNextPeriod', () => {
  it('predicts a window centered on lastStart + avgCycleLength', () => {
    const lastStart = new Date('2026-01-01');
    const { start, end } = predictNextPeriod(lastStart, 30, 2);
    expect(start.toISOString().slice(0, 10)).toBe('2026-01-29'); // +28
    expect(end.toISOString().slice(0, 10)).toBe('2026-02-02');   // +32
  });

  it('gives lower confidence for the untracked default (28) cycle length', () => {
    const lastStart = new Date('2026-01-01');
    expect(predictNextPeriod(lastStart, 28).confidence).toBe(60);
    expect(predictNextPeriod(lastStart, 30).confidence).toBe(75);
  });
});

describe('predictOvulationWindow', () => {
  it('places ovulation 14 days before the next period, with a -2/+1 fertile window', () => {
    const nextPeriodStart = new Date('2026-02-01');
    const { start, end } = predictOvulationWindow(nextPeriodStart, 30);
    // ovulation day = Jan 18; window = Jan 16 - Jan 19
    expect(start.toISOString().slice(0, 10)).toBe('2026-01-16');
    expect(end.toISOString().slice(0, 10)).toBe('2026-01-19');
  });
});

describe('getCurrentPhase', () => {
  it('reports menstrual phase for the first days of the cycle', () => {
    const today = new Date();
    const lastStart = new Date(today);
    lastStart.setDate(lastStart.getDate() - 1); // day 2 of cycle
    const { phase, day } = getCurrentPhase(lastStart, 30, 5);
    expect(phase).toBe('menstrual');
    expect(day).toBe(2);
  });

  it('wraps correctly using modulo for a day count beyond one cycle length', () => {
    const today = new Date();
    const lastStart = new Date(today);
    lastStart.setDate(lastStart.getDate() - 35); // 36 days into a 30-day cycle
    const { day } = getCurrentPhase(lastStart, 30, 5);
    expect(day).toBe(6); // 36 mod 30 = 6
  });
});
