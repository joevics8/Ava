import { describe, expect, it } from 'vitest';
import { addMonths, checkLam } from '../lam';
import { iso, parseDate } from '../../calculators';

const d = (s: string) => parseDate(s)!;
const run = (birth: string, today: string, feeding: 'exclusive' | 'mostly' | 'no', periodReturned = false) =>
  checkLam({ birthDate: d(birth), today: d(today), feeding, periodReturned });

describe('LAM checker', () => {
  it('applies only when all three criteria are met', () => {
    const r = run('2026-09-01', '2026-11-01', 'exclusive');
    expect(r.lamApplies).toBe(true);
    expect(r.criteria.every(c => c.met)).toBe(true);
  });
  it('fails if feeding is not exclusive', () => {
    for (const f of ['mostly', 'no'] as const) {
      const r = run('2026-09-01', '2026-11-01', f);
      expect(r.lamApplies).toBe(false);
      expect(r.criteria.find(c => c.id === 'exclusive-feeding')!.met).toBe(false);
    }
  });
  it('fails if a period has returned', () => {
    expect(run('2026-09-01', '2026-11-01', 'exclusive', true).lamApplies).toBe(false);
  });
  it('fails when the baby is 6 months or older', () => {
    expect(run('2026-05-01', '2026-10-31', 'exclusive').lamApplies).toBe(true);   // one day before 6 months
    expect(run('2026-05-01', '2026-11-01', 'exclusive').lamApplies).toBe(false);  // 6 months today
    expect(run('2026-05-01', '2026-11-01', 'exclusive').criteria[0].met).toBe(false);
  });
  it('day 21 after birth is the date to have contraception in place', () => {
    const r = run('2026-10-01', '2026-10-10', 'no');
    expect(iso(r.contraceptionByDate)).toBe('2026-10-22');
    expect(r.daysToContraception).toBe(12);
    expect(run('2026-10-01', '2026-11-10', 'no').daysToContraception).toBeLessThan(0);
  });
  it('rejects a birth date in the future or more than 24 months ago', () => {
    expect(run('2026-11-10', '2026-11-01', 'no').valid).toBe(false);
    expect(run('2023-01-01', '2026-11-01', 'no').valid).toBe(false);
    expect(run('2026-10-01', '2026-11-01', 'no').valid).toBe(true);
  });
  it('age in days and weeks', () => {
    const r = run('2026-10-01', '2026-10-23', 'no');
    expect(r.ageDays).toBe(22);
    expect(r.ageWeeks).toBe(3);
  });
  it('addMonths clamps to month end', () => {
    expect(iso(addMonths(d('2026-08-31'), 6))).toBe('2027-02-28');
    expect(iso(addMonths(d('2026-01-15'), 6))).toBe('2026-07-15');
    expect(iso(addMonths(d('2026-10-31'), 6))).toBe('2027-04-30');
  });
});
