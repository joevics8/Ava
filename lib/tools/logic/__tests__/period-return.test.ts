import { describe, expect, it } from 'vitest';
import { SCENARIOS, periodReturnWindow, type Scenario } from '../period-return';
import { iso, parseDate } from '../../calculators';

const d = (s: string) => parseDate(s)!;

describe('period return timeline', () => {
  it('after birth, not breastfeeding: 6 to 12 weeks', () => {
    const r = periodReturnWindow('birth-not-breastfeeding', d('2026-01-01'), d('2026-01-10'))!;
    expect(iso(r.start)).toBe('2026-02-12');   // +42 days
    expect(iso(r.end)).toBe('2026-03-26');     // +84 days
  });
  it('after miscarriage: 4 to 6 weeks, ask a clinician after 8', () => {
    const r = periodReturnWindow('miscarriage-or-abortion', d('2026-01-01'), d('2026-01-02'))!;
    expect(iso(r.start)).toBe('2026-01-29');
    expect(iso(r.end)).toBe('2026-02-12');
    expect(iso(r.askFrom!)).toBe('2026-02-26');
  });
  it('injection: about 10 months on average from the last injection', () => {
    const r = periodReturnWindow('stop-injection', d('2026-01-01'), d('2026-01-02'))!;
    expect(iso(r.typical!)).toBe('2026-10-28');   // +300 days
    expect(r.info.wide).toBe(true);
    expect(r.info.summary).toMatch(/10 months/);
  });
  it('breastfeeding has no single ask-a-clinician date', () => {
    const r = periodReturnWindow('birth-breastfeeding', d('2026-01-01'), d('2026-01-02'))!;
    expect(r.askFrom).toBeNull();
    expect(r.info.wide).toBe(true);
  });
  it('phase: before, within, after', () => {
    const e = d('2026-01-01');
    expect(periodReturnWindow('miscarriage-or-abortion', e, d('2026-01-10'))!.phase).toBe('before');
    expect(periodReturnWindow('miscarriage-or-abortion', e, d('2026-02-01'))!.phase).toBe('within');
    expect(periodReturnWindow('miscarriage-or-abortion', e, d('2026-03-01'))!.phase).toBe('after');
  });
  it('an event date in the future gives no result', () => {
    expect(periodReturnWindow('stop-combined-pill', d('2026-02-01'), d('2026-01-01'))).toBeNull();
  });
  it('every scenario is internally consistent and mentions that pregnancy can happen before the first period or to seek care', () => {
    for (const s of Object.keys(SCENARIOS) as Scenario[]) {
      const x = SCENARIOS[s];
      expect(x.endDays).toBeGreaterThan(x.startDays);
      if (x.askAfterDays !== null) expect(x.askAfterDays).toBeGreaterThanOrEqual(x.endDays);
      if (x.typicalDays) { expect(x.typicalDays).toBeGreaterThanOrEqual(x.startDays); expect(x.typicalDays).toBeLessThanOrEqual(x.endDays); }
      expect(x.notes.length).toBeGreaterThan(1);
    }
  });
});
