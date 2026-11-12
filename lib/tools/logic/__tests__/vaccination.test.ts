import { describe, expect, it } from 'vitest';
import { parseDate } from '@/lib/tools/calculators';
import { ageToDate, buildSchedule, PRESETS, statusFor } from '../vaccination';

const d = (s: string) => parseDate(s)!;
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe('vaccination schedule', () => {
  const dob = d('2026-01-10');

  it('converts weeks, months and years to dates from the birth date', () => {
    expect(iso(ageToDate(dob, { w: 6 }))).toBe('2026-02-21');
    expect(iso(ageToDate(dob, { m: 9 }))).toBe('2026-10-10');
    expect(iso(ageToDate(dob, { y: 4 }))).toBe('2030-01-10');
    expect(iso(ageToDate(d('2026-01-31'), { m: 1 }))).toBe('2026-02-28');
  });

  it('WHO: the 6-week doses fall at 6 weeks and the pentavalent series is 6, 10 and 14 weeks', () => {
    const rows = buildSchedule('who', dob, d('2026-01-10'))!;
    const penta = rows.filter(r => r.vaccine.startsWith('DTP-HepB-Hib'));
    expect(penta.map(r => iso(r.from))).toEqual(['2026-02-21', '2026-03-21', '2026-04-18']);
    expect(rows.find(r => r.vaccine === 'BCG')!.status).toBe('due-now');
  });

  it('WHO: measles-rubella doses at 9 and 15 months', () => {
    const rows = buildSchedule('who', dob, d('2026-01-10'))!.filter(r => r.vaccine === 'Measles-rubella');
    expect(rows.map(r => iso(r.from))).toEqual(['2026-10-10', '2027-04-10']);
  });

  it('CDC: 2, 4 and 6 month series and the 12-15 month MMR window', () => {
    const rows = buildSchedule('cdc', dob, d('2026-01-10'))!;
    expect(rows.filter(r => r.vaccine === 'DTaP').map(r => iso(r.from))).toEqual(['2026-03-10', '2026-05-10', '2026-07-10', '2027-04-10', '2030-01-10']);
    const mmr = rows.find(r => r.vaccine === 'MMR' && r.dose === 'Dose 1')!;
    expect([iso(mmr.from), iso(mmr.until)]).toEqual(['2027-01-10', '2027-04-10']);
  });

  it('marks doses upcoming, due now or past the usual window', () => {
    const rows = buildSchedule('who', dob, d('2026-03-01'))!;
    const dose1 = rows.find(r => r.vaccine.startsWith('DTP-HepB-Hib') && r.dose === 'Dose 1')!;
    expect(dose1.status).toBe('due-now');                 // 6 weeks = 21 Feb, window to 21 Mar
    const dose3 = rows.find(r => r.vaccine.startsWith('DTP-HepB-Hib') && r.dose === 'Dose 3')!;
    expect(dose3.status).toBe('upcoming');
    expect(dose3.days).toBe(48);
    const later = buildSchedule('who', dob, d('2026-08-01'))!;
    expect(later.find(r => r.vaccine.startsWith('DTP-HepB-Hib') && r.dose === 'Dose 1')!.status).toBe('past');
    expect(later.find(r => r.vaccine === 'Hepatitis B')!.status).toBe('past');
  });

  it('the window boundaries are inclusive', () => {
    expect(statusFor(d('2026-01-01'), d('2026-01-10'), d('2026-01-01'))).toBe('due-now');
    expect(statusFor(d('2026-01-01'), d('2026-01-10'), d('2026-01-10'))).toBe('due-now');
    expect(statusFor(d('2026-01-01'), d('2026-01-10'), d('2026-01-11'))).toBe('past');
    expect(statusFor(d('2026-01-01'), d('2026-01-10'), d('2025-12-31'))).toBe('upcoming');
  });

  it('rows are sorted by date', () => {
    for (const id of ['who', 'cdc'] as const) {
      const times = buildSchedule(id, dob, d('2026-02-01'))!.map(r => r.from.getTime());
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('every dose has a window that ends after it starts', () => {
    for (const id of ['who', 'cdc'] as const) {
      for (const r of buildSchedule(id, dob, d('2026-02-01'))!) expect(r.until.getTime()).toBeGreaterThanOrEqual(r.from.getTime());
    }
  });

  it('rejects a future birth date or a teenager past the schedule', () => {
    expect(buildSchedule('who', d('2026-12-01'), d('2026-11-08'))).toBeNull();
    expect(buildSchedule('who', d('2005-01-01'), d('2026-11-08'))).toBeNull();
  });

  it('every preset has a source note and footnotes', () => {
    for (const p of Object.values(PRESETS)) { expect(p.source.length).toBeGreaterThan(30); expect(p.footnotes.length).toBeGreaterThan(0); }
  });
});
