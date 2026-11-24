import { describe, expect, it } from 'vitest';
import { cycleDayInfo, phaseBoundaries, MAX_CYCLE_DAY, type CycleDayOk } from '../cycle-day';
import { iso, parseDate } from '../../calculators';

const d = (s: string) => parseDate(s)!;
const run = (target: string, cycleLength = 28, periodLength = 5, lastStart = '2026-01-01') =>
  cycleDayInfo({ lastStart: d(lastStart), cycleLength, periodLength, target: d(target) });
const ok = (r: ReturnType<typeof run>) => { expect(r.ok).toBe(true); return r as CycleDayOk; };

describe('cycle day', () => {
  it('the first day of the period is day 1 in the menstrual phase', () => {
    const r = ok(run('2026-01-01'));
    expect(r.cycleDay).toBe(1);
    expect(r.phase).toBe('menstrual');
    expect(r.daysToNextPeriod).toBe(28);
  });
  it('counts days inclusively', () => {
    expect(ok(run('2026-01-10')).cycleDay).toBe(10);
  });
  it('the last day of the cycle has 1 day to go and the next period is the day after', () => {
    const r = ok(run('2026-01-28'));
    expect(r.cycleDay).toBe(28);
    expect(r.daysToNextPeriod).toBe(1);
    expect(iso(r.nextPeriod)).toBe('2026-01-29');
    expect(r.status).toBe('in-cycle');
  });
});

describe('phases for a 28-day cycle with a 5-day period', () => {
  it('uses the same ovulation date as the site ovulation calculator (day 15)', () => {
    const r = ok(run('2026-01-15'));
    expect(r.ovulationDay).toBe(15);
    expect(iso(r.ovulationDate)).toBe('2026-01-15');
    expect(r.phase).toBe('ovulation');
  });
  it('has the expected boundaries', () => {
    const b = phaseBoundaries(28, 5).phases;
    expect(b).toEqual([
      { phase: 'menstrual', startDay: 1, endDay: 5 },
      { phase: 'follicular', startDay: 6, endDay: 13 },
      { phase: 'ovulation', startDay: 14, endDay: 16 },
      { phase: 'luteal', startDay: 17, endDay: 28 },
    ]);
  });
  it('maps boundary days to the right phase', () => {
    const phase = (n: number) => ok(run(iso(new Date(d('2026-01-01').getTime() + (n - 1) * 86400000)))).phase;
    expect(phase(5)).toBe('menstrual');
    expect(phase(6)).toBe('follicular');
    expect(phase(13)).toBe('follicular');
    expect(phase(14)).toBe('ovulation');
    expect(phase(16)).toBe('ovulation');
    expect(phase(17)).toBe('luteal');
    expect(phase(28)).toBe('luteal');
  });
});

describe('other cycle lengths', () => {
  it('phases always cover every day from 1 to the cycle length with no gaps or overlaps', () => {
    for (let c = 21; c <= 45; c++) {
      for (let p = 2; p <= 10; p++) {
        const { phases } = phaseBoundaries(c, p);
        expect(phases[0].startDay).toBe(1);
        expect(phases[phases.length - 1].endDay).toBe(c);
        for (let i = 1; i < phases.length; i++) expect(phases[i].startDay).toBe(phases[i - 1].endDay + 1);
      }
    }
  });
  it('a 35-day cycle ovulates on day 22', () => {
    expect(phaseBoundaries(35, 5).ovulationDay).toBe(22);
  });
  it('a long period on a short cycle never puts ovulation inside the period', () => {
    const { ovulationDay } = phaseBoundaries(21, 10);
    expect(ovulationDay).toBeGreaterThan(10);
  });
});

describe('late periods and invalid input', () => {
  it('flags the due day, then days late, and keeps the luteal phase', () => {
    const due = ok(run('2026-01-29'));
    expect(due.status).toBe('due');
    expect(due.daysToNextPeriod).toBe(0);
    const late = ok(run('2026-02-03'));
    expect(late.status).toBe('late');
    expect(late.daysLate).toBe(5);
    expect(late.phase).toBe('luteal');
    expect(late.headline).toContain('5 days');
  });
  it('says 1 day, not 1 days', () => {
    expect(ok(run('2026-01-30')).headline).toContain('1 day later');
  });
  it('rejects a date before the period start', () => {
    expect(run('2025-12-31')).toEqual({ ok: false, error: 'before-start' });
  });
  it('rejects an old date entered by mistake', () => {
    expect(run('2026-05-15')).toEqual({ ok: false, error: 'too-far' });
    const last = new Date(d('2026-01-01').getTime() + (MAX_CYCLE_DAY - 1) * 86400000);
    expect(run(iso(last)).ok).toBe(true);
  });
  it('rejects bad cycle and period lengths', () => {
    expect(run('2026-01-10', 20)).toEqual({ ok: false, error: 'invalid-cycle' });
    expect(run('2026-01-10', 46)).toEqual({ ok: false, error: 'invalid-cycle' });
    expect(run('2026-01-10', 28.5)).toEqual({ ok: false, error: 'invalid-cycle' });
    expect(run('2026-01-10', 28, 1)).toEqual({ ok: false, error: 'invalid-period' });
    expect(run('2026-01-10', 28, 11)).toEqual({ ok: false, error: 'invalid-period' });
  });
  it('works across a year boundary and a leap day', () => {
    const r = ok(run('2028-03-01', 28, 5, '2028-02-20'));
    expect(r.cycleDay).toBe(11);
  });
});
