import { describe, expect, it } from 'vitest';
import { assessWindow, windowFor } from '../sti-window';
import { iso, parseDate } from '../../calculators';

const at = (exposure: string, today: string, infection: Parameters<typeof assessWindow>[0]['infection'] = 'hiv', hivTest: Parameters<typeof assessWindow>[0]['hivTest'] = 'lab-ag-ab') =>
  assessWindow({ exposure: parseDate(exposure)!, today: parseDate(today)!, infection, hivTest });

describe('window periods', () => {
  it('uses the CDC HIV figures', () => {
    expect(windowFor('hiv', 'nat')).toMatchObject({ earliest: 10, conclusive: 33 });
    expect(windowFor('hiv', 'lab-ag-ab')).toMatchObject({ earliest: 18, conclusive: 45 });
    expect(windowFor('hiv', 'rapid-ag-ab')).toMatchObject({ earliest: 18, conclusive: 90 });
    expect(windowFor('hiv', 'self-test-ab')).toMatchObject({ earliest: 23, conclusive: 90 });
  });
  it('chlamydia and gonorrhoea: 14 days; syphilis: 90 days with no firm earliest day', () => {
    expect(windowFor('chlamydia', 'nat')).toMatchObject({ earliest: 14, conclusive: 14 });
    expect(windowFor('gonorrhoea', 'nat')).toMatchObject({ earliest: 14, conclusive: 14 });
    expect(windowFor('syphilis', 'nat')).toMatchObject({ earliest: null, conclusive: 90 });
  });
  it('computes the earliest and conclusive dates', () => {
    const r = at('2026-10-01', '2026-10-05');
    expect(iso(r.earliest!)).toBe('2026-10-19');
    expect(iso(r.conclusive)).toBe('2026-11-15');
  });
  it('status moves from too early to testable to conclusive', () => {
    expect(at('2026-10-01', '2026-10-10').status).toBe('too-early');
    expect(at('2026-10-01', '2026-10-19').status).toBe('testable');      // day 18
    expect(at('2026-10-01', '2026-11-14').status).toBe('testable');      // day 44
    expect(at('2026-10-01', '2026-11-15').status).toBe('conclusive');    // day 45
  });
  it('a future exposure date is invalid', () => {
    expect(at('2026-10-10', '2026-10-01').status).toBe('invalid');
  });
  it('syphilis is never "testable", only too early or conclusive', () => {
    expect(at('2026-10-01', '2026-10-20', 'syphilis').status).toBe('too-early');
    expect(at('2026-10-01', '2026-12-30', 'syphilis').status).toBe('conclusive');
    expect(at('2026-10-01', '2026-10-20', 'syphilis').earliest).toBeNull();
  });
  it('chlamydia is conclusive at 14 days', () => {
    expect(at('2026-10-01', '2026-10-14', 'chlamydia').status).toBe('too-early');
    expect(at('2026-10-01', '2026-10-15', 'chlamydia').status).toBe('conclusive');
  });
  it('flags post-exposure prophylaxis only for HIV within about 3 days', () => {
    expect(at('2026-10-01', '2026-10-01').pepUrgent).toBe(true);
    expect(at('2026-10-01', '2026-10-04').pepUrgent).toBe(true);
    expect(at('2026-10-01', '2026-10-05').pepUrgent).toBe(false);
    expect(at('2026-10-01', '2026-10-02', 'chlamydia').pepUrgent).toBe(false);
  });
  it('always tells people to test with symptoms and count from the latest exposure', () => {
    expect(at('2026-10-01', '2026-10-02').notes.join(' ')).toMatch(/symptoms/);
    expect(at('2026-10-01', '2026-10-02').notes.join(' ')).toMatch(/most recent/);
  });
});
