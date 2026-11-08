import { describe, it, expect } from 'vitest';
import {
  latestPeriodStartStr, mergePeriodStart, periodCheckFor, periodCheckMessage, periodCheckNoReply, periodCheckNote, planPeriodCheck, sortedPeriodDates,
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

describe('periodCheckFor: which question is open', () => {
  const cycle = { next_period_start: '2026-11-10', period_start_dates: ['2026-10-12'] };
  it('does nothing before the expected day', () => {
    expect(periodCheckFor(cycle, at('2026-11-09'))).toBeNull();
  });
  it('counts mornings from the expected day', () => {
    expect(periodCheckFor(cycle, at('2026-11-10'))).toMatchObject({ date: '2026-11-10', askNumber: 1 });
    expect(periodCheckFor(cycle, at('2026-11-13'))).toMatchObject({ askNumber: 4 });
  });
  it('stops being a daily question after the ceiling', () => {
    expect(periodCheckFor(cycle, at('2026-11-23'))).toMatchObject({ askNumber: 14, isLastAsk: true });
    expect(periodCheckFor(cycle, at('2026-11-24'))).toBeNull();
  });
  it('stops once a period is logged for that date, whatever the stored order', () => {
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

describe('planPeriodCheck: keep asking while she answers, stop when she goes quiet', () => {
  const base = { next_period_start: '2026-11-10', period_start_dates: ['2026-10-12'], period_check_for: '2026-11-10' };
  it('first morning: asks, replaces the digest, counts 1', () => {
    const p = planPeriodCheck({ next_period_start: '2026-11-10', period_start_dates: ['2026-10-12'] }, at('2026-11-10'));
    expect(p).toMatchObject({ replaceDigest: true, unansweredAfter: 1 });
  });
  it('mornings 1-3 replace the digest; from 4 the digest stays', () => {
    const answered = (d: string) => ({ ...base, period_check_last_asked: d, period_check_answered_on: d, period_check_unanswered: 1 });
    expect(planPeriodCheck(answered('2026-11-11'), at('2026-11-12'))).toMatchObject({ replaceDigest: true, check: { askNumber: 3 } });
    expect(planPeriodCheck(answered('2026-11-12'), at('2026-11-13'))).toMatchObject({ replaceDigest: false, check: { askNumber: 4 } });
  });
  it('keeps asking past day 3 when every question was answered "No"', () => {
    for (let day = 11; day <= 20; day++) {
      const prev = `2026-11-${String(day - 1)}`;
      const p = planPeriodCheck({ ...base, period_check_last_asked: prev, period_check_answered_on: prev, period_check_unanswered: 1 }, at(`2026-11-${day}`));
      expect(p).not.toBeNull();
      expect(p!.unansweredAfter).toBe(1);   // a reply resets the run each time
    }
  });
  it('an unanswered morning adds to the run: 3 in a row and it stops', () => {
    const asked = (n: number, d: string) => ({ ...base, period_check_last_asked: d, period_check_unanswered: n });
    expect(planPeriodCheck(asked(1, '2026-11-10'), at('2026-11-11'))).toMatchObject({ unansweredAfter: 2 });
    expect(planPeriodCheck(asked(2, '2026-11-11'), at('2026-11-12'))).toMatchObject({ unansweredAfter: 3 });
    expect(planPeriodCheck(asked(3, '2026-11-12'), at('2026-11-13'))).toBeNull();
    expect(planPeriodCheck(asked(3, '2026-11-12'), at('2026-11-15'))).toBeNull();   // stays stopped
  });
  it('a reply after going quiet starts the run again', () => {
    const c = { ...base, period_check_last_asked: '2026-11-12', period_check_unanswered: 3, period_check_answered_on: '2026-11-13' };
    expect(planPeriodCheck(c, at('2026-11-14'))).toMatchObject({ unansweredAfter: 1 });
  });
  it('a new expected date starts fresh, ignoring old state', () => {
    const c = { next_period_start: '2026-12-08', period_start_dates: ['2026-11-12'], period_check_for: '2026-11-10', period_check_last_asked: '2026-11-12', period_check_unanswered: 3 };
    expect(planPeriodCheck(c, at('2026-12-08'))).toMatchObject({ unansweredAfter: 1 });
  });
  it('a re-run of the same morning does not add to the run, and nothing is asked once answered', () => {
    expect(planPeriodCheck({ ...base, period_check_last_asked: '2026-11-11', period_check_unanswered: 2 }, at('2026-11-11'))).toMatchObject({ unansweredAfter: 2 });
    expect(planPeriodCheck({ ...base, period_check_last_asked: '2026-11-11', period_check_answered_on: '2026-11-11', period_check_unanswered: 2 }, at('2026-11-11'))).toBeNull();
  });
});

describe('copy', () => {
  const c = { date: '2026-11-10', askNumber: 1, isLastAsk: false };
  it('asks "out today" on day 1 and names the date afterwards', () => {
    expect(periodCheckMessage('Ada', c, 'Good morning')).toContain('Is your period out today?');
    expect(periodCheckMessage('Ada', { ...c, askNumber: 2 }, 'Good morning')).toContain('Did your period come out on *10 Nov*?');
  });
  it('replies to No by when she is on', () => {
    expect(periodCheckNoReply('Ada', c)).toContain('summary is paused');
    expect(periodCheckNoReply('Ada', { ...c, askNumber: 5 })).not.toContain('paused');
    expect(periodCheckNoReply('Ada', { ...c, askNumber: 14, isLastAsk: true })).toContain('stop the daily check');
  });
  it('home-test and clinic notes appear only on a few specific days late', () => {
    expect(periodCheckNote(0)).toBe('');
    expect(periodCheckNote(1)).toContain('home test');
    expect(periodCheckNote(2)).toBe('');
    expect(periodCheckNote(3)).toContain('retest in 3 to 7 days');
    expect(periodCheckNote(7)).toContain('clinic');
    expect(periodCheckNote(8)).toBe('');
    expect(periodCheckMessage('Ada', { ...c, askNumber: 5 }, 'Hi', periodCheckNote(1), false)).toContain('home test');
  });
});
