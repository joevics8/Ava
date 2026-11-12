import { describe, expect, it } from 'vitest';
import { parseDate } from '@/lib/tools/calculators';
import { categoryFor, correctedAge } from '../corrected-age';

const d = (s: string) => parseDate(s)!;

describe('corrected age', () => {
  it('born at 32 weeks: 8 weeks early, due date 56 days after birth', () => {
    const r = correctedAge(d('2026-01-01'), 32, 0, d('2026-06-01'))!;
    expect(r.preterm).toBe(true);
    expect(r.earlyDays).toBe(56);
    expect(r.earlyWeeks).toBe(8);
    expect(r.dueDate.toISOString().slice(0, 10)).toBe('2026-02-26');
    // chronological 5 months; corrected measured from the due date (26 Feb): 3 months, 6 days
    expect(r.chronological.months).toBe(5);
    expect(r.corrected).toMatchObject({ months: 3, weeks: 0, days: 6 });
  });
  it('born at 30 weeks and 3 days: 9 weeks and 4 days early', () => {
    const r = correctedAge(d('2026-01-01'), 30, 3, d('2026-06-01'))!;
    expect(r.earlyDays).toBe(67);
    expect(r.earlyWeeks).toBe(9);
    expect(r.earlyExtraDays).toBe(4);
  });
  it('term babies are not corrected', () => {
    const r = correctedAge(d('2026-01-01'), 39, 0, d('2026-06-01'))!;
    expect(r.preterm).toBe(false);
    expect(r.earlyDays).toBe(0);
    expect(r.corrected!.totalDays).toBe(r.chronological.totalDays);
  });
  it('37 weeks is the first week that counts as term (no correction)', () => {
    expect(correctedAge(d('2026-01-01'), 36, 6, d('2026-06-01'))!.preterm).toBe(true);
    expect(correctedAge(d('2026-01-01'), 37, 0, d('2026-06-01'))!.preterm).toBe(false);
  });
  it('a newborn who has not reached the due date has no corrected age yet', () => {
    const r = correctedAge(d('2026-01-01'), 28, 0, d('2026-02-01'))!;
    expect(r.beforeDueDate).toBe(true);
    expect(r.corrected).toBeNull();
    expect(r.daysToDueDate).toBe(84 - 31);
  });
  it('on the due date the corrected age is zero', () => {
    const r = correctedAge(d('2026-01-01'), 32, 0, d('2026-02-26'))!;
    expect(r.beforeDueDate).toBe(false);
    expect(r.corrected!.totalDays).toBe(0);
  });
  it('flags when the baby is past two years', () => {
    expect(correctedAge(d('2024-01-01'), 30, 0, d('2026-06-01'))!.pastTwoYears).toBe(true);
    expect(correctedAge(d('2025-01-01'), 30, 0, d('2026-06-01'))!.pastTwoYears).toBe(false);
  });
  it('rejects impossible input', () => {
    expect(correctedAge(d('2026-01-01'), 20, 0, d('2026-06-01'))).toBeNull();
    expect(correctedAge(d('2026-01-01'), 43, 0, d('2026-06-01'))).toBeNull();
    expect(correctedAge(d('2026-01-01'), 30, 7, d('2026-06-01'))).toBeNull();
    expect(correctedAge(d('2026-07-01'), 30, 0, d('2026-06-01'))).toBeNull();   // born in the future
    expect(correctedAge(d('2015-01-01'), 30, 0, d('2026-06-01'))).toBeNull();   // too old for this tool
  });
  it('categories follow the usual groups', () => {
    expect(categoryFor(27)).toBe('extremely preterm');
    expect(categoryFor(28)).toBe('very preterm');
    expect(categoryFor(31)).toBe('very preterm');
    expect(categoryFor(32)).toBe('moderately preterm');
    expect(categoryFor(34)).toBe('late preterm');
    expect(categoryFor(36)).toBe('late preterm');
    expect(categoryFor(37)).toBe('early term');
    expect(categoryFor(40)).toBe('full term');
  });
});
