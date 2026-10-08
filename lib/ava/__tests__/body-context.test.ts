import { describe, it, expect } from 'vitest';
import {
  describeCycleContext,
  describeRecentLogs,
  selectPriorMatch,
  patternKeywords,
  notYetReply,
  periodStartedReply,
} from '../body-context';
import { getCycleStatus, learnCycleLength, predictionConfidence } from '../cycle';
import type { CycleData, MemoryLog } from '@/types';

function cycle(overrides: Partial<CycleData> = {}): CycleData {
  return {
    id: 'c1',
    user_id: 'u1',
    period_start_dates: ['2026-09-10'],
    avg_cycle_length: 30,
    period_duration: 5,
    next_period_start: '2026-10-08',
    next_period_end: '2026-10-12',
    next_ovulation_start: '2026-09-22',
    next_ovulation_end: '2026-09-25',
    confidence_pct: 70,
    updated_at: '2026-09-11T00:00:00Z',
    ...overrides,
  };
}

function log(category: string, summary: string, loggedAt: string): MemoryLog {
  return { id: `${category}-${summary}-${loggedAt}`, user_id: 'u1', category: category as any, summary, logged_at: loggedAt };
}

describe('getCycleStatus', () => {
  // Real scenario: last period 10 Sep, 30-day cycle => most likely 10 Oct, window 8–12 Oct.
  const lastStart = new Date('2026-09-10');

  it('is NOT late on 8 Oct, the first day of the expected window', () => {
    const s = getCycleStatus(lastStart, 30, 5, new Date('2026-10-08T11:18:00Z'));
    expect(s.day).toBe(29);
    expect(s.daysPastExpected).toBe(-2);
    expect(s.isLate).toBe(false);
    expect(s.stale).toBe(false);
  });

  it('is still not late 1 day past the most likely date (inside the window)', () => {
    const s = getCycleStatus(lastStart, 30, 5, new Date('2026-10-11T10:00:00Z'));
    expect(s.daysPastExpected).toBe(1);
    expect(s.isLate).toBe(false);
  });

  it('is late once past the end of the window, and never wraps the day count', () => {
    const s = getCycleStatus(lastStart, 30, 5, new Date('2026-10-14T10:00:00Z'));
    expect(s.day).toBe(35); // NOT 5 / "menstrual phase"
    expect(s.isLate).toBe(true);
    expect(s.stale).toBe(false);
    expect(s.phase).toBe('luteal');
  });

  it('flags a very old last period as stale instead of calling it late', () => {
    const s = getCycleStatus(lastStart, 30, 5, new Date('2026-10-30T10:00:00Z'));
    expect(s.stale).toBe(true);
    expect(s.isLate).toBe(true);
    expect(s.day).toBe(21); // wrapped projection only when stale
  });

  it('rolls the day over at local (UTC+1) midnight, not UTC midnight', () => {
    // 23:30 UTC on 7 Oct is already 00:30 on 8 Oct in Lagos.
    const s = getCycleStatus(lastStart, 30, 5, new Date('2026-10-07T23:30:00Z'));
    expect(s.day).toBe(29);
  });
});

describe('learnCycleLength', () => {
  it('keeps the stated length when there are not enough valid gaps', () => {
    // 57-day gap is a missed log / one-off, not her cycle length.
    const r = learnCycleLength(['2026-07-15', '2026-09-10'], 30);
    expect(r.avg).toBe(30);
    expect(r.samples).toBe(0);
  });

  it('learns the average from real gaps once there are at least two', () => {
    const r = learnCycleLength(['2026-01-01', '2026-01-29', '2026-02-28', '2026-03-29'], 35);
    expect(r.samples).toBe(3);
    expect(r.avg).toBe(29); // gaps 28, 30, 29
  });

  it('ignores implausible gaps but still uses the valid ones', () => {
    const r = learnCycleLength(['2026-01-01', '2026-01-30', '2026-03-30', '2026-04-28', '2026-05-27'], 28);
    // gaps: 29, 59 (ignored), 29, 29
    expect(r.samples).toBe(3);
    expect(r.avg).toBe(29);
  });

  it('lowers confidence for irregular cycles', () => {
    expect(predictionConfidence(3, 0)).toBeGreaterThan(predictionConfidence(3, 6));
    expect(predictionConfidence(0, 0)).toBe(60);
  });
});

describe('describeCycleContext', () => {
  it('tells the model it is NOT late inside the expected window (the production bug)', () => {
    const text = describeCycleContext(cycle(), new Date('2026-10-08T11:18:00Z'));
    expect(text).toContain('cycle day 29 of ~30');
    expect(text).toContain('NOT late');
    expect(text).toContain('10 Oct'); // most likely date
    expect(text).not.toContain('genuinely late');
  });

  it('says genuinely late only when past the window', () => {
    const text = describeCycleContext(cycle(), new Date('2026-10-14T10:00:00Z'));
    expect(text).toContain('genuinely late');
    expect(text).toContain('cycle day 35');
  });

  it('does not claim a cycle day for a very old last period', () => {
    const text = describeCycleContext(cycle(), new Date('2026-10-30T10:00:00Z'));
    expect(text).toContain('Ask when it last started');
    expect(text).not.toContain('cycle day 21');
  });

  it('does not invent a position when there are no period dates', () => {
    const text = describeCycleContext(cycle({ period_start_dates: [] }));
    expect(text).toContain('not available yet');
  });
});

describe('describeRecentLogs', () => {
  const now = new Date('2026-10-08T12:00:00Z');

  it('gives dated, relative entries and labels Ava chat notes as topics', () => {
    const text = describeRecentLogs(
      [
        log('symptom', 'Frequent urination', '2026-10-08T10:00:00Z'),
        log('sexual', 'Unprotected sex', '2026-10-04T13:00:00Z'),
        log('chat', 'Pregnancy symptom inquiry', '2026-10-06T22:00:00Z'),
      ],
      now
    );
    expect(text).toContain('today');
    expect(text).toContain('4 days ago');
    expect(text).toContain('[topic noted] Pregnancy symptom inquiry');
    expect(text).toContain('[sexual] Unprotected sex');
  });

  it('skips Ava bookkeeping and old entries', () => {
    const text = describeRecentLogs(
      [
        log('insight', 'Suggested remedies for acne', '2026-10-08T09:00:00Z'),
        log('symptom', 'Old thing', '2026-08-01T09:00:00Z'),
      ],
      now
    );
    expect(text).toContain('nothing logged');
  });
});

describe('selectPriorMatch (no more fabricated "you logged this before")', () => {
  const now = new Date('2026-10-08T12:00:00Z');

  it('ignores filler words that appear in unrelated summaries', () => {
    expect(patternKeywords('Increased frequency')).toEqual([]);
    expect(selectPriorMatch([log('symptom', 'Frequent urination', '2026-09-08T10:00:00Z')], [], now)).toBeNull();
  });

  it("never treats Ava's own chat/insight rows as something the user reported", () => {
    const logs = [
      log('chat', 'Cramps and dizziness', '2026-10-03T10:00:00Z'),
      log('insight', 'Suggested remedies for cramps', '2026-10-02T10:00:00Z'),
    ];
    expect(selectPriorMatch(logs, patternKeywords('Heavy cramps'), now)).toBeNull();
  });

  it('returns the real prior entry the user logged, with the true day count', () => {
    const logs = [
      log('chat', 'Cramps and dizziness', '2026-10-03T10:00:00Z'),
      log('symptom', 'Cramps and dizziness', '2026-09-28T10:00:00Z'),
    ];
    const m = selectPriorMatch(logs, patternKeywords('Heavy cramps'), now);
    expect(m?.prior.category).toBe('symptom');
    expect(m?.daysSince).toBe(10);
  });

  it('skips the entry written in the last couple of hours (the current message)', () => {
    const logs = [log('symptom', 'Heavy cramps', '2026-10-08T11:30:00Z')];
    expect(selectPriorMatch(logs, patternKeywords('Heavy cramps'), now)).toBeNull();
  });
});

describe('period confirmation replies', () => {
  it('"not yet" inside the window reassures with the real window end', () => {
    const t = notYetReply('Boss', cycle(), new Date('2026-10-08T11:18:00Z'));
    expect(t).toContain("isn't late yet");
    expect(t).toContain('12 Oct');
  });

  it('"not yet" when genuinely late explains the test timing', () => {
    const t = notYetReply('Boss', cycle(), new Date('2026-10-14T10:00:00Z'));
    expect(t).toContain('past your most likely date');
    expect(t).toContain('first day of a missed period');
  });

  it('"not yet" with a very old last period asks for the date instead', () => {
    const t = notYetReply('Boss', cycle(), new Date('2026-10-30T10:00:00Z'));
    expect(t).toContain('when did your last period start');
  });

  it('"yes" confirmation shows the next window and invites a correction', () => {
    const t = periodStartedReply('Boss', '2026-11-07', '2026-11-11');
    expect(t).toContain('7 Nov');
    expect(t).toContain('11 Nov');
    expect(t).toContain('how many days ago');
  });
});
