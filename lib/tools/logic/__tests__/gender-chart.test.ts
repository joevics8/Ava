import { describe, expect, it } from 'vitest';
import { buildChart, checkDates, conceptionFromLmp, lunarAge, lunarSupported, predict, toLunar } from '../gender-chart';
import { iso, parseDate } from '../../calculators';

const d = (s: string) => parseDate(s)!;

describe('toLunar (needs the Chinese calendar in this runtime)', () => {
  it('is supported here', () => expect(lunarSupported()).toBe(true));
  it('finds Chinese New Year and the day before it', () => {
    expect(toLunar(d('2026-02-17'))).toEqual({ year: 2026, month: 1, day: 1, leap: false });
    expect(toLunar(d('2026-02-16'))).toEqual({ year: 2025, month: 12, day: 29, leap: false });
  });
  it('flags leap months', () => {
    expect(toLunar(d('2025-07-25'))).toEqual({ year: 2025, month: 6, day: 1, leap: true });
    expect(toLunar(d('2023-03-22'))?.leap).toBe(true);
    expect(toLunar(d('2025-06-25'))?.leap).toBe(false);
  });
});

describe('lunarAge', () => {
  it('is 1 in the birth year and goes up at Chinese New Year, not on the birthday', () => {
    const born = toLunar(d('1995-08-10'))!;
    expect(lunarAge(born, toLunar(d('1995-08-10'))!)).toBe(1);
    expect(lunarAge(born, toLunar(d('1996-02-18'))!)).toBe(1); // day before CNY 1996 (19 Feb)
    expect(lunarAge(born, toLunar(d('1996-02-19'))!)).toBe(2);
  });
  it('counts a January birth in the previous lunar year', () => {
    const born = toLunar(d('1996-01-15'))!; // before CNY 1996
    expect(born.year).toBe(1995);
    expect(lunarAge(born, toLunar(d('1996-03-01'))!)).toBe(2);
  });
});

describe('predict', () => {
  it('odd = boy, even = girl', () => {
    expect(predict(26, 4)).toBe('girl');
    expect(predict(26, 5)).toBe('boy');
    expect(predict(31, 8)).toBe('boy');
    expect(predict(30, 8)).toBe('girl');
  });
});

describe('buildChart', () => {
  const birth = d('1995-08-10');
  const conception = d('2026-11-10');
  const chart = buildChart(birth, conception)!;

  it('uses lunar age + lunar month of conception', () => {
    const l = toLunar(conception)!;
    expect(chart.lunar).toEqual(l);
    expect(chart.age).toBe(l.year - toLunar(birth)!.year + 1);
    expect(chart.sum).toBe(chart.age + l.month);
    expect(chart.guess).toBe(predict(chart.age, l.month));
  });
  it('gives 12 contiguous lunar months starting with the conception month', () => {
    expect(chart.rows).toHaveLength(12);
    expect(chart.rows[0].current).toBe(true);
    expect(chart.rows.slice(1).every(r => !r.current)).toBe(true);
    chart.rows.forEach((r, i) => {
      const len = (r.end.getTime() - r.start.getTime()) / 86_400_000 + 1;
      expect([29, 30]).toContain(len);
      if (i > 0) expect(iso(r.start)).toBe(iso(new Date(chart.rows[i - 1].end.getTime() + 86_400_000)));
    });
    expect(chart.rows[0].start.getTime()).toBeLessThanOrEqual(conception.getTime());
    expect(chart.rows[0].end.getTime()).toBeGreaterThanOrEqual(conception.getTime());
    expect(chart.rows[0].guess).toBe(chart.guess);
  });
  it('raises the age when the rows cross Chinese New Year', () => {
    const ages = chart.rows.map(r => r.age);
    expect(ages[ages.length - 1]).toBe(ages[0] + 1);
  });
  it('notes a leap-month conception', () => {
    expect(buildChart(birth, d('2025-08-01'))!.leapNote).toBe(true);
    expect(chart.leapNote).toBe(false);
  });
});

describe('conceptionFromLmp / checkDates', () => {
  it('adds 14 days', () => expect(iso(conceptionFromLmp(d('2026-10-01')))).toBe('2026-10-15'));
  const today = d('2026-11-27');
  it('accepts a normal case', () => expect(checkDates(d('1995-08-10'), d('2026-10-15'), today)).toBe('ok'));
  it('rejects implausible ages and far-future dates', () => {
    expect(checkDates(d('2020-01-01'), d('2026-10-15'), today)).toBe('too-young');
    expect(checkDates(d('1950-01-01'), d('2026-10-15'), today)).toBe('too-old');
    expect(checkDates(d('2030-01-01'), d('2026-10-15'), today)).toBe('birth-in-future');
    expect(checkDates(d('1995-08-10'), d('2030-01-01'), today)).toBe('conception-too-far');
  });
  it('allows planning ahead', () => expect(checkDates(d('1995-08-10'), d('2027-03-01'), today)).toBe('ok'));
});
