import { describe, it, expect } from 'vitest';
import { mightStatePeriodDate, recordPeriodDateFromChat } from '../period-chat';

describe('mightStatePeriodDate', () => {
  it('passes period statements and a bare date answering Ava', () => {
    expect(mightStatePeriodDate('my last period was November 9')).toBe(true);
    expect(mightStatePeriodDate('it came yesterday')).toBe(true);
    expect(mightStatePeriodDate('9 Nov', 'When did it last start? Send me the date.')).toBe(true);
  });
  it('ignores unrelated chat and bare dates nobody asked for', () => {
    expect(mightStatePeriodDate('why is my skin so dry')).toBe(false);
    expect(mightStatePeriodDate('9 Nov', 'Here are three remedies for acne')).toBe(false);
    expect(mightStatePeriodDate('x'.repeat(400))).toBe(false);
  });
});

describe('recordPeriodDateFromChat', () => {
  it('records once with the days-ago the extractor found', async () => {
    const calls: [string, number][] = [];
    const ok = await recordPeriodDateFromChat('u1', 'my last period was Nov 9', '', { extract: async () => 9, record: async (u, d) => { calls.push([u, d]); } });
    expect(ok).toBe(true);
    expect(calls).toEqual([['u1', 9]]);
  });
  it('records nothing when no date is stated, or the gate says no', async () => {
    let recorded = false, extracted = false;
    const deps = { extract: async () => { extracted = true; return null; }, record: async () => { recorded = true; } };
    expect(await recordPeriodDateFromChat('u1', 'my last period was long', '', deps)).toBe(false);
    expect(await recordPeriodDateFromChat('u1', 'hello there', '', deps)).toBe(false);
    expect(recorded).toBe(false);
    expect(extracted).toBe(true); // only the first message reached the extractor
  });
});
