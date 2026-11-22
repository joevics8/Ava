import { describe, it, expect } from 'vitest';
import { classifyOutcome, orderByHistory, describeRemedyHistory, suggestedRecently } from '../remedy-outcome';

describe('classifyOutcome', () => {
  it.each([
    ['it helped', 'helped'], ['it worked great', 'helped'], ['yes it is working', 'helped'], ['feeling much better', 'helped'],
    ['it partially helped', 'partially'], ['helped a little', 'partially'], ['slightly better', 'partially'], ['it is helping a bit', 'partially'],
    ['it did not help', 'didnt_help'], ["it didn't work", 'didnt_help'], ['no difference at all', 'didnt_help'], ['nothing changed', 'didnt_help'], ['it made it worse', 'didnt_help'], ['my cramps are not better', 'didnt_help'], ['no better at all', 'didnt_help'], ["it isn't improving", 'didnt_help'],
    ["haven't started yet", 'not_started'], ['not yet', 'not_started'], ['I forgot', 'not_started'], ["I didn't try it", 'not_started'],
  ])('%s -> %s', (t, o) => expect(classifyOutcome(t)).toBe(o));
  it.each(['what should I eat today', 'my cramps are bad', 'I noticed a pattern', '', 'x'.repeat(250)])('ignores: %s', t => expect(classifyOutcome(t)).toBeNull());
});

describe('orderByHistory', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  it('puts what worked first and what failed last', () => {
    const out = orderByHistory(list, [{ remedy_id: 'a', outcome: 'didnt_help' }, { remedy_id: 'c', outcome: 'helped' }]);
    expect(out.map(r => r.id)).toEqual(['c', 'b', 'd', 'a']);
  });
  it('keeps order with no history', () => expect(orderByHistory(list, []).map(r => r.id)).toEqual(['a', 'b', 'c', 'd']));
});

describe('describeRemedyHistory', () => {
  it('is empty with no outcomes', () => expect(describeRemedyHistory([{ remedy_name: 'Tea', condition: 'acne', outcome: null }])).toBe(''));
  it('lists outcomes', () => expect(describeRemedyHistory([{ remedy_name: 'Spearmint Tea', condition: 'cycle_acne', outcome: 'helped' }])).toMatch(/Spearmint Tea for cycle acne helped/));
});

describe('suggestedRecently', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  it('honours the cooldown window', () => {
    const rows = [{ summary: 'Suggested remedies for acne', logged_at: '2026-11-18T10:00:00Z' }];
    expect(suggestedRecently(rows, 'Suggested remedies for acne', 7, now)).toBe(true);
    expect(suggestedRecently(rows, 'Suggested remedies for acne', 3, now)).toBe(false);
    expect(suggestedRecently(rows, 'Suggested remedies for cramps', 7, now)).toBe(false);
  });
});
