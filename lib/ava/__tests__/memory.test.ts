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

import { compactLogs, approxTokens, shortenSummary, recallKeywords, recallOrFilter, formatRecall } from '../memory';

describe('shortenSummary', () => {
  it('drops filler and abbreviates but keeps every fact', () => {
    expect(shortenSummary('Experiencing menstrual cramps and feeling irritable')).toBe('mens cramps & irritable');
    expect(shortenSummary('Persistent abdominal cramps')).toBe('persist abd cramps');
    expect(shortenSummary('Morning mood: good')).toBe('good');
    expect(shortenSummary('Headache')).toBe('Headache');
    expect(shortenSummary('the')).toBe('the'); // never returns nothing
  });
});

describe('compactLogs', () => {
  const now = new Date('2026-11-18T10:00:00Z');
  const day = (offset: number) => new Date(now.getTime() - offset * 86400000).toISOString();
  const row = (category: string, summary: string, offset: number, cycle_day: number | null = null, source: 'user' | 'ava' = 'user') =>
    ({ category, summary, logged_at: day(offset), event_date: day(offset).slice(0, 10), cycle_day, source });

  it('drops Ava notes, groups a day on one line, uses codes and no year or clock time', () => {
    const out = compactLogs([
      row('symptom', 'Persistent cramps', 1, 2), row('mood', 'Morning mood: ok', 1, 2), row('chat', 'Cramp pattern, monthly', 1, null, 'ava'),
    ], { now });
    expect(out).toContain('11/17 d2 s:persist cramps; m:ok');
    expect(out).not.toContain('Cramp pattern');
    expect(out).not.toMatch(/2026|:\d\d:\d\d/);
  });

  it('keeps EVERY entry, however old or repeated: two weeks ago and today both show', () => {
    const out = compactLogs([row('symptom', 'Cramps', 0, 3), row('symptom', 'Cramps', 14, 2), row('symptom', 'Cramps', 95, 1), row('symptom', 'Cramps', 125, 3)], { now });
    expect(out.match(/s:Cramps/g)).toHaveLength(4);
  });

  it('a day with the same thing logged twice keeps both', () => {
    const out = compactLogs([row('symptom', 'Cramps', 0), row('symptom', 'Cramps', 0)], { now });
    expect(out.match(/s:Cramps/g)).toHaveLength(2);
  });

  it('is much shorter per entry than the old format and has no cap', () => {
    const logs: any[] = [];
    for (let d = 0; d < 150; d++) {
      logs.push(row('symptom', 'Experiencing persistent abdominal cramps', d, (d % 30) + 1));
      logs.push(row('mood', 'Morning mood: good', d, (d % 30) + 1));
    }
    const verbose = logs.map(l => `[${l.category}] ${l.summary} — ${new Date(l.logged_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`).join('\n');
    const compact = compactLogs(logs, { now });
    expect(compact.split('\n')).toHaveLength(151); // header + one line per day, all 150 days
    expect(approxTokens(compact)).toBeLessThan(approxTokens(verbose) / 2);
  });

  it('says so when there is nothing', () => { expect(compactLogs([], { now })).toBe('MEM: nothing logged.'); });
});

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
  it('lists every match, hers only, shortened, with year only when over a year old', () => {
    const now = new Date('2026-11-19T08:00:00Z');
    const r = (summary: string, d: string, cycle_day: number | null, source: 'user' | 'ava' = 'user', category = 'symptom') =>
      ({ category, summary, logged_at: `${d}T08:00:00Z`, event_date: d, cycle_day, source });
    const many = Array.from({ length: 40 }, (_, i) => r('Heavy cramps', `2026-09-${String((i % 28) + 1).padStart(2, '0')}`, 1));
    const out = formatRecall([r('Experiencing menstrual cramps', '2026-09-14', 26), r('Cramp pattern, monthly', '2026-09-01', null, 'ava', 'chat'), r('Cramps', '2025-06-02', 2), ...many], { now });
    expect(out).toContain('9/14 d26 s:mens cramps');
    expect(out).toContain('6/2/25 d2 s:Cramps');
    expect(out).not.toContain('pattern');
    expect(out.split('\n')).toHaveLength(1 + 2 + 40); // nothing dropped
    expect(formatRecall([], { now })).toBe('');
  });
});
