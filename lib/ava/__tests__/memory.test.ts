import { describe, it, expect } from 'vitest';
import {
  isNearDuplicateSummary, isDuplicateEvent, mightStateFact, cleanFacts, describeFacts, cycleDayOn, shortDate, normalizeFactKey,
} from '../memory';

describe('isNearDuplicateSummary', () => {
  it('treats the same thing worded differently as one', () => {
    expect(isNearDuplicateSummary('Persistent cramps', 'Persistent abdominal cramps')).toBe(true);
    expect(isNearDuplicateSummary('Frequent urination', 'Increased urinary frequency')).toBe(false); // honest limit: not semantic
    expect(isNearDuplicateSummary('Heavy cramps', 'Sugar craving')).toBe(false);
  });
});

describe('isDuplicateEvent', () => {
  const now = new Date('2026-11-18T10:00:00Z');
  const row = (summary: string, event_date: string, hoursAgo = 1) => ({ summary, event_date, logged_at: new Date(now.getTime() - hoursAgo * 3600e3).toISOString() });

  it('skips a repeat on the same day', () => {
    expect(isDuplicateEvent('Persistent abdominal cramps', '2026-11-18', [row('Persistent cramps', '2026-11-18')], now)).toBe(true);
  });
  it('never treats a different day as a repeat, even within 36 hours', () => {
    expect(isDuplicateEvent('Heavy cramps', '2026-11-18', [row('Heavy cramps', '2026-11-17', 24)], now)).toBe(false);
  });
  it('mood: only an identical entry is a repeat', () => {
    expect(isDuplicateEvent('Morning mood: okay', '2026-11-18', [row('Morning mood: good', '2026-11-18')], now, true)).toBe(false);
    expect(isDuplicateEvent('Morning mood: good', '2026-11-18', [row('Morning mood: good', '2026-11-18')], now, true)).toBe(true);
  });
  it('two different period dates are both kept', () => {
    expect(isDuplicateEvent('Period started 9 Nov', '2026-11-09', [row('Period started 11 Oct', '2026-10-11', 600)], now)).toBe(false);
    expect(isDuplicateEvent('Period started 9 Nov', '2026-11-09', [row('Period started 9 Nov', '2026-11-09', 300)], now)).toBe(true);
  });
});

describe('facts', () => {
  it('only lasting statements about herself reach the extractor', () => {
    expect(mightStateFact("I'm allergic to peanuts")).toBe(true);
    expect(mightStateFact('I take iron tablets every morning')).toBe(true);
    expect(mightStateFact('my head hurts today')).toBe(false);
    expect(mightStateFact('hi')).toBe(false);
  });
  it('cleans extractor output: valid keys, trimmed, deduped, capped', () => {
    const out = cleanFacts([
      { key: 'Allergy!', value: ' peanuts ' }, { key: 'allergy', value: 'dust' }, { key: '', value: 'x' }, { key: 'diet', value: '' },
      { key: 'goal', value: 'conceive' }, { key: 'sleep', value: '6h' }, { key: 'extra', value: 'dropped' },
    ]);
    expect(out).toEqual([{ key: 'allergy', value: 'peanuts' }, { key: 'goal', value: 'conceive' }, { key: 'sleep', value: '6h' }]);
    expect(cleanFacts('nope')).toEqual([]);
  });
  it('normalises keys', () => { expect(normalizeFactKey('Sleep Routine!')).toBe('sleep_routine'); });
  it('shows the model only facts she stated', () => {
    const text = describeFacts([{ key: 'allergy', value: 'peanuts', source: 'user' }, { key: 'guess', value: 'anaemia', source: 'ava' }]);
    expect(text).toContain('allergy: peanuts');
    expect(text).not.toContain('anaemia');
    expect(describeFacts([])).toContain('nothing saved yet');
  });
});

describe('dates', () => {
  it('cycle day counts the first day of bleeding as day 1 and refuses old logs', () => {
    expect(cycleDayOn('2026-11-09', '2026-11-09')).toBe(1);
    expect(cycleDayOn('2026-11-09', '2026-11-18')).toBe(10);
    expect(cycleDayOn('2026-07-15', '2026-11-18')).toBeNull();
    expect(cycleDayOn(null, '2026-11-18')).toBeNull();
  });
  it('shortDate', () => { expect(shortDate('2026-11-09')).toBe('9 Nov'); });
});

import { compactLogs, approxTokens, topicOf } from '../memory';

describe('compactLogs', () => {
  const now = new Date('2026-11-18T10:00:00Z');
  const day = (offset: number) => new Date(now.getTime() - offset * 86400000).toISOString();
  const row = (category: string, summary: string, offset: number, cycle_day: number | null = null, source: 'user' | 'ava' = 'user') =>
    ({ category, summary, logged_at: day(offset), event_date: day(offset).slice(0, 10), cycle_day, source });

  it('drops Ava notes, groups a day on one line, uses codes and no year or clock time', () => {
    const out = compactLogs([
      row('symptom', 'Persistent cramps', 1, 2), row('mood', 'Morning mood: ok', 1, 2), row('chat', 'Cramp pattern, monthly', 1, null, 'ava'),
    ], { now });
    expect(out).toContain('11/17 d2 s:Persistent cramps; m:ok');
    expect(out).not.toContain('Cramp pattern');
    expect(out).not.toMatch(/2026|:\d\d:\d\d/);
  });

  it('collapses history older than 30 days into counts with cycle days', () => {
    const logs = [
      ...[35, 65, 95, 125].map((o, i) => row('symptom', 'Heavy cramps', o, [1, 2, 1, 3][i])),
      row('symptom', 'Headache', 70, 25),
    ];
    const out = compactLogs(logs, { now });
    expect(out).toContain('s:cramps x4 (d1-3)');
    expect(out).toContain('s:headache x1 (d25)');
    expect(out.split('\n').length).toBeLessThan(6);
  });

  it('five months of heavy logging stays inside the budget and far below the old verbose format', () => {
    const logs: any[] = [];
    for (let d = 0; d < 150; d++) {
      logs.push(row('symptom', d % 3 ? 'Persistent abdominal cramps' : 'Dull lower back ache', d, (d % 30) + 1));
      logs.push(row('mood', 'Morning mood: good', d, (d % 30) + 1));
      logs.push(row('chat', 'Cramp pattern, monthly', d, null, 'ava'));
      logs.push(row('insight', 'Suggested remedies for acne', d, null, 'ava'));
    }
    const verbose = logs.slice(0, 120).map(l => `[${l.category}] ${l.summary} — ${new Date(l.logged_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`).join('\n');
    const compact = compactLogs(logs, { now });
    expect(compact.length).toBeLessThanOrEqual(1400);
    expect(approxTokens(compact)).toBeLessThan(approxTokens(verbose) / 4);
  });

  it('says so when there is nothing', () => { expect(compactLogs([], { now })).toBe('MEM: nothing logged.'); });
  it('topicOf names what a tag is about', () => {
    expect(topicOf('Persistent abdominal cramps')).toBe('cramps');
    expect(topicOf('Frequent urination')).toBe('urination');
  });
});

import { recallKeywords, recallOrFilter, formatRecall } from '../memory';

describe('recall', () => {
  it('keeps the topic words of a message, as safe stems', () => {
    expect(recallKeywords('when did I last have cramps like this?')).toEqual(['cramp']);
    expect(recallKeywords('is my headache and nausea normal again')).toEqual(['headache', 'nausea']);
    expect(recallKeywords('hi')).toEqual([]);
    expect(recallKeywords("x'; drop table memory_log; --")).not.toContain("'");
  });
  it('builds a letters-only filter', () => {
    expect(recallOrFilter(['cramp'])).toBe('summary.ilike.%cramp%,detail.ilike.%cramp%');
    expect(recallOrFilter(['a,b', 'ok1', 'headache'])).toBe('summary.ilike.%headache%,detail.ilike.%headache%');
    expect(recallOrFilter([])).toBe('');
  });
  it('formats matches compactly, hers only, inside the budget, with year only when over a year old', () => {
    const now = new Date('2026-11-19T08:00:00Z');
    const r = (summary: string, d: string, cycle_day: number | null, source: 'user' | 'ava' = 'user', category = 'symptom') =>
      ({ category, summary, logged_at: `${d}T08:00:00Z`, event_date: d, cycle_day, source });
    const out = formatRecall([r('Heavy cramps', '2026-09-14', 26), r('Cramp pattern, monthly', '2026-09-01', null, 'ava', 'chat'), r('Cramps', '2025-06-02', 2)], { now });
    expect(out).toContain('9/14 d26 s:Heavy cramps');
    expect(out).toContain('6/2/25 d2 s:Cramps');
    expect(out).not.toContain('pattern');
    expect(formatRecall([], { now })).toBe('');
    expect(formatRecall(Array.from({ length: 30 }, (_, i) => r(`Cramps number ${i} with a long description`, '2026-09-14', 1)), { now, budgetChars: 300 }).length).toBeLessThanOrEqual(300);
  });
});
