import { describe, it, expect } from 'vitest';
import {
  latestPeriodStartStr, mergePeriodStart, periodCheckFor, periodCheckMessage, periodCheckNoReply, sortedPeriodDates,
} from '../period';

// 08:00 UTC = 09:00 in Lagos, so the local date equals the UTC date.
const at = (iso: string) => new Date(`${iso}T08:00:00Z`);

describe('latest period date (single source of truth)', () => {
  it('uses the newest date whatever the stored order', () => {
    expect(latestPeriodStartStr({ period_start_dates: ['2026-10-30', '2026-10-02'] })).toBe('2026-10-30');
    expect(latestPeriodStartStr({ period_start_dates: ['2026-10-02', '2026-10-30'] })).toBe('2026-10-30');
  });
  it('is null with no usable dates', () => {
    expect(latestPeriodStartStr(null)).toBeNull();
    expect(latestPeriodStartStr({ period_start_dates: [] })).toBeNull();
    expect(sortedPeriodDates(['garbage', '2026-10-02', '2026-10-02'])).toEqual(['2026-10-02']);
  });
});

describe('mergePeriodStart', () => {
  it('adds a genuinely new period', () => {
    expect(mergePeriodStart(['2026-09-04'], '2026-10-02')).toEqual(['2026-09-04', '2026-10-02']);
  });
  it('treats a date close to an existing one as a correction, not a second period', () => {
    expect(mergePeriodStart(['2026-09-04', '2026-10-05'], '2026-10-02')).toEqual(['2026-09-04', '2026-10-02']);
    expect(mergePeriodStart(['2026-10-02'], '2026-10-05')).toEqual(['2026-10-05']);
  });
});

describe('periodCheckFor: ask up to 3 mornings, then lapse', () => {
  const cycle = { next_period_start: '2026-11-10', period_start_dates: ['2026-10-12'] };
  it('does nothing before the expected day', () => {
    expect(periodCheckFor(cycle, at('2026-11-09'))).toBeNull();
  });
  it('asks on the day, then the next two mornings', () => {
    expect(periodCheckFor(cycle, at('2026-11-10'))).toEqual({ date: '2026-11-10', askNumber: 1, isLastAsk: false });
    expect(periodCheckFor(cycle, at('2026-11-11'))).toMatchObject({ askNumber: 2, isLastAsk: false });
    expect(periodCheckFor(cycle, at('2026-11-12'))).toMatchObject({ askNumber: 3, isLastAsk: true });
  });
  it('lapses after 3 mornings so the old date stays in use and the digest resumes', () => {
    expect(periodCheckFor(cycle, at('2026-11-13'))).toBeNull();
  });
  it('stops once a period is logged for that date', () => {
    expect(periodCheckFor({ next_period_start: '2026-11-10', period_start_dates: ['2026-10-12', '2026-11-11'] }, at('2026-11-11'))).toBeNull();
  });
  it('is not confused by stored date order', () => {
    expect(periodCheckFor({ next_period_start: '2026-11-10', period_start_dates: ['2026-11-11', '2026-10-12'] }, at('2026-11-11'))).toBeNull();
  });
  it('needs a prediction and a history', () => {
    expect(periodCheckFor(null, at('2026-11-10'))).toBeNull();
    expect(periodCheckFor({ next_period_start: null, period_start_dates: ['2026-10-12'] }, at('2026-11-10'))).toBeNull();
    expect(periodCheckFor({ next_period_start: '2026-11-10', period_start_dates: [] }, at('2026-11-10'))).toBeNull();
  });
  it('uses the Lagos date: 23:30 UTC on the 9th is already the 10th', () => {
    expect(periodCheckFor(cycle, new Date('2026-11-09T23:30:00Z'))).toMatchObject({ askNumber: 1 });
  });
});

describe('copy', () => {
  it('asks "out today" on day 1 and names the date afterwards', () => {
    const c = { date: '2026-11-10', askNumber: 1, isLastAsk: false };
    expect(periodCheckMessage('Ada', c, 'Good morning')).toContain('Is your period out today?');
    expect(periodCheckMessage('Ada', { ...c, askNumber: 2 }, 'Good morning')).toContain('Did your period come out on *10 Nov*?');
  });
  it('a "No" keeps asking until the last morning, then stops', () => {
    expect(periodCheckNoReply('Ada', { date: '2026-11-10', askNumber: 1, isLastAsk: false })).toContain('check again tomorrow');
    expect(periodCheckNoReply('Ada', { date: '2026-11-10', askNumber: 3, isLastAsk: true })).toContain('stop asking');
  });
});
