import { describe, expect, it } from 'vitest';
import { adviseMissedPill, type MissedPillInput } from '../missed-pill';
import { iso, parseDate } from '../../calculators';

const base: MissedPillInput = { pill: 'combined', lateness: 'two-plus-missed', week: 1, packDays: 28, unprotectedSex: false, takeDate: null };
const a = (o: Partial<MissedPillInput>) => adviseMissedPill({ ...base, ...o });

describe('combined pill', () => {
  it('less than 24 hours late: still protected, no extras', () => {
    const r = a({ lateness: 'within-window' });
    expect(r.level).toBe('ok');
    expect(r.backupDays).toBe(0);
    expect(r.emergency).toBe('not-needed');
  });
  it('one missed pill: take it, no condoms, no emergency contraception, whatever the week or sex', () => {
    for (const week of [1, 2, 3] as const) {
      const r = a({ lateness: 'one-missed', week, unprotectedSex: true });
      expect(r.backupDays).toBe(0);
      expect(r.emergency).toBe('not-needed');
      expect(r.skipBreak).toBe(false);
    }
  });
  it('two or more missed in week 1 without sex: 7 days condoms, no emergency contraception', () => {
    const r = a({ week: 1 });
    expect(r.backupDays).toBe(7);
    expect(r.emergency).toBe('not-needed');
    expect(r.skipBreak).toBe(false);
    expect(r.pregnancyTestNote).toBeNull();
  });
  it('two or more missed in week 1 WITH unprotected sex: ask about emergency contraception and test later', () => {
    const r = a({ week: 1, unprotectedSex: true });
    expect(r.emergency).toBe('ask');
    expect(r.emergencyText).toMatch(/5 days/);
    expect(r.pregnancyTestNote).toMatch(/3 weeks/);
  });
  it('week 2: 7 days condoms, emergency contraception not usually needed, break not skipped', () => {
    const r = a({ week: 2, unprotectedSex: true });
    expect(r.backupDays).toBe(7);
    expect(r.emergency).toBe('not-needed');
    expect(r.skipBreak).toBe(false);
  });
  it('week 3: skip the pill-free break (28-day: skip inactive pills; 21-day: no 7-day break)', () => {
    const r28 = a({ week: 3, packDays: 28 });
    const r21 = a({ week: 3, packDays: 21 });
    expect(r28.skipBreak).toBe(true);
    expect(r28.steps.join(' ')).toMatch(/skip the inactive/);
    expect(r21.skipBreak).toBe(true);
    expect(r21.steps.join(' ')).toMatch(/no 7-day break/);
    expect(r28.emergency).toBe('not-needed');
  });
  it('protected again 7 days after the missed pill is taken', () => {
    const r = a({ week: 2, takeDate: parseDate('2026-11-01') });
    expect(iso(r.protectedFrom!)).toBe('2026-11-08');
  });
  it('no date: no protected-from date', () => {
    expect(a({}).protectedFrom).toBeNull();
  });
});

describe('progestogen-only pills', () => {
  const pop = (pill: MissedPillInput['pill'], o: Partial<MissedPillInput> = {}) => adviseMissedPill({ ...base, pill, ...o });
  it('within the window: still protected', () => {
    for (const p of ['pop-3h', 'pop-12h', 'pop-24h'] as const) {
      const r = pop(p, { lateness: 'within-window' });
      expect(r.level).toBe('ok');
      expect(r.backupDays).toBe(0);
    }
  });
  it('traditional and desogestrel: 2 days of condoms after a missed pill', () => {
    for (const p of ['pop-3h', 'pop-12h'] as const) {
      const r = pop(p, { lateness: 'one-missed', takeDate: parseDate('2026-11-01') });
      expect(r.backupDays).toBe(2);
      expect(iso(r.protectedFrom!)).toBe('2026-11-03');
      expect(r.emergency).toBe('not-needed');
    }
  });
  it('drospirenone: 7 days of condoms', () => {
    const r = pop('pop-24h', { lateness: 'two-plus-missed', takeDate: parseDate('2026-11-01') });
    expect(r.backupDays).toBe(7);
    expect(iso(r.protectedFrom!)).toBe('2026-11-08');
  });
  it('unprotected sex after a missed POP: ask about emergency contraception', () => {
    const r = pop('pop-12h', { lateness: 'one-missed', unprotectedSex: true });
    expect(r.emergency).toBe('ask');
    expect(r.pregnancyTestNote).toMatch(/3 weeks/);
  });
  it('several missed POP pills: take just one', () => {
    expect(pop('pop-3h', { lateness: 'two-plus-missed' }).steps[0]).toMatch(/just one/);
  });
  it('week and pack type do not matter for POPs', () => {
    expect(pop('pop-12h', { lateness: 'one-missed', week: 3 }).skipBreak).toBe(false);
  });
});
