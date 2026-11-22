import { describe, it, expect } from 'vitest';
import { cadence, daysSilentFrom, inMorningWindow, isWeeklyDay } from '../cron-gate';

describe('cadence', () => {
  it('daily while active, note on the 3rd silent day', () => {
    expect(cadence(0)).toEqual({ send: true, note: false });
    expect(cadence(2)).toEqual({ send: true, note: false });
    expect(cadence(3)).toEqual({ send: true, note: true });
  });
  it('weekly after that, and stops after six weeks', () => {
    expect(cadence(4).send).toBe(false);
    expect(cadence(7).send).toBe(true);
    expect(cadence(10).send).toBe(false);
    expect(cadence(14).send).toBe(true);
    expect(cadence(42).send).toBe(true);
    expect(cadence(43).send).toBe(false);
    expect(cadence(49).send).toBe(false);
  });
});
describe('daysSilentFrom', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  it('counts whole days', () => {
    expect(daysSilentFrom('2026-11-22T06:00:00Z', now)).toBe(0);
    expect(daysSilentFrom('2026-11-19T11:00:00Z', now)).toBe(3);
    expect(daysSilentFrom(null, now)).toBe(0);
    expect(daysSilentFrom('garbage', now)).toBe(0);
  });
});
describe('windows', () => {
  it('morning window follows her clock', () => {
    const at = (h: number) => new Date(Date.UTC(2026, 10, 22, h));
    expect(inMorningWindow('Africa/Lagos', at(6), 7, 3)).toBe(true);   // 07:00
    expect(inMorningWindow('Africa/Lagos', at(9), 7, 3)).toBe(false);  // 10:00
    expect(inMorningWindow('Asia/Tokyo', at(22), 7, 3)).toBe(true);    // 07:00 next day
  });
  it('weekly day is local', () => {
    // 22 Nov 2026 is a Sunday; 23:30 UTC Sunday is already Monday in Lagos
    expect(isWeeklyDay('America/New_York', new Date(Date.UTC(2026, 10, 22, 23, 30)))).toBe(true);
    expect(isWeeklyDay('Africa/Lagos', new Date(Date.UTC(2026, 10, 22, 23, 30)))).toBe(false);
  });
});

import { QUICK_LOGS, quickLogButtons, morningKeyboard } from '../morning';
describe('quick-log buttons', () => {
  it('every button maps to a symptom and callback data stays short', () => {
    for (const b of quickLogButtons.flat()) {
      expect(QUICK_LOGS[b.callback_data.slice(3)]).toBeTruthy();
      expect(b.callback_data.length).toBeLessThanOrEqual(64);
    }
    expect(morningKeyboard.length).toBe(3);
  });
});
