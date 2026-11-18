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
