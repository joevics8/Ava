import { describe, expect, it } from 'vitest';
import { afterPositive, interpretLhPattern, LH_PATTERNS, planLhTesting, type LhPlanOk } from '../lh-surge';
import { iso, parseDate } from '../../calculators';

const plan = (cycleLength: number, extra: { shortest?: number | null; longest?: number | null; start?: string } = {}) => {
  const r = planLhTesting({ lastStart: extra.start ? parseDate(extra.start) : null, cycleLength, shortest: extra.shortest, longest: extra.longest });
  expect(r.ok).toBe(true);
  return r as LhPlanOk;
};

describe('when to start testing', () => {
  it('28-day cycle: start on day 11 (cycle length minus 17), ovulation day 15', () => {
    const p = plan(28);
    expect(p.startDay).toBe(11);
    expect(p.expectedOvulationDay).toBe(15);
    expect(p.stopDay).toBe(17);
    expect(p.bestFromDay).toBe(13);
    expect(p.bestToDay).toBe(15);
    expect(p.testCount).toBe(7);
  });
  it('start day is always cycle length minus 17 for typical cycles', () => {
    for (const c of [25, 30, 32, 35]) expect(plan(c).startDay).toBe(c - 17);
  });
  it('short cycles never start before day 5', () => {
    expect(plan(21).startDay).toBe(5);
    expect(plan(22).startDay).toBe(5);
    expect(plan(23).startDay).toBe(6);
  });
  it('irregular cycles: start from the shortest, stop after the longest', () => {
    const p = plan(30, { shortest: 26, longest: 36 });
    expect(p.startDay).toBe(9);
    expect(p.stopDay).toBe(25);
    expect(p.varied).toBe(true);
    expect(p.longWindow).toBe(true);
  });
  it('a lone shortest or longest value is allowed', () => {
    expect(plan(28, { shortest: 25 }).startDay).toBe(8);
    expect(plan(28, { longest: 34 }).stopDay).toBe(23);
  });
  it('gives dates from the last period start and matches the ovulation calculator', () => {
    const p = plan(28, { start: '2026-03-01' });
    expect(iso(p.dates!.start)).toBe('2026-03-11');
    expect(iso(p.dates!.ovulation)).toBe('2026-03-15');
    expect(iso(p.dates!.bestFrom)).toBe('2026-03-13');
    expect(iso(p.dates!.bestTo)).toBe('2026-03-15');
    expect(iso(p.dates!.stop)).toBe('2026-03-17');
  });
  it('rejects invalid input', () => {
    expect(planLhTesting({ lastStart: null, cycleLength: 19 })).toEqual({ ok: false, error: 'invalid-cycle' });
    expect(planLhTesting({ lastStart: null, cycleLength: 28.5 })).toEqual({ ok: false, error: 'invalid-cycle' });
    expect(planLhTesting({ lastStart: null, cycleLength: 28, shortest: 30, longest: 26 })).toEqual({ ok: false, error: 'invalid-range' });
    expect(planLhTesting({ lastStart: null, cycleLength: 28, shortest: 10 })).toEqual({ ok: false, error: 'invalid-range' });
    expect(planLhTesting({ lastStart: null, cycleLength: 28, longest: 60 })).toEqual({ ok: false, error: 'invalid-range' });
  });
});

describe('after a positive test', () => {
  it('ovulation is most likely the next day, within 48 hours', () => {
    const a = afterPositive(parseDate('2026-03-14')!);
    expect(iso(a.likely)).toBe('2026-03-15');
    expect(iso(a.earliest)).toBe('2026-03-14');
    expect(iso(a.latest)).toBe('2026-03-16');
    expect(a.bestDays.map(iso)).toEqual(['2026-03-14', '2026-03-15']);
  });
  it('crosses a month end', () => {
    expect(iso(afterPositive(parseDate('2026-02-28')!).latest)).toBe('2026-03-02');
  });
});

describe('what a pattern means', () => {
  it('has an interpretation for every pattern', () => {
    for (const p of LH_PATTERNS) {
      const r = interpretLhPattern(p.value);
      expect(r.headline.length).toBeGreaterThan(10);
      expect(r.points.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('a positive does not send people to a clinician; repeated no-surge and PCOS do', () => {
    expect(interpretLhPattern('positive').seeClinician).toBe(false);
    expect(interpretLhPattern('faint').seeClinician).toBe(false);
    expect(interpretLhPattern('none-once').seeClinician).toBe(false);
    expect(interpretLhPattern('none-repeated').seeClinician).toBe(true);
    expect(interpretLhPattern('pcos').seeClinician).toBe(true);
  });
  it('positive result states 24 to 36 hours and up to 48', () => {
    const txt = interpretLhPattern('positive').points.join(' ');
    expect(txt).toContain('24 to 36 hours');
    expect(txt).toContain('48');
  });
});
