import { describe, expect, it } from 'vitest';
import { addMonths, discardBy, formatDuration, hoursLeft, parseDateTime, ruleFor, type MilkPlace, type MilkState } from '../milk-storage';

const t = (s: string) => parseDateTime(s)!;

describe('ruleFor (conservative figures)', () => {
  it('fresh milk', () => {
    expect(ruleFor('fresh', 'room').hours).toBe(4);
    expect(ruleFor('fresh', 'cooler').hours).toBe(24);
    expect(ruleFor('fresh', 'fridge').hours).toBe(96);
    expect(ruleFor('fresh', 'freezer').months).toBe(6);
  });
  it('hot room shortens room-temperature time only', () => {
    expect(ruleFor('fresh', 'room', true).hours).toBe(2);
    expect(ruleFor('fresh', 'fridge', true).hours).toBe(96);
    expect(ruleFor('fresh', 'room', true).note).toMatch(/precaution/);
  });
  it('thawed milk: 24 hours in fridge, never refreeze', () => {
    expect(ruleFor('thawed', 'fridge').hours).toBe(24);
    const f = ruleFor('thawed', 'freezer');
    expect(f.allowed).toBe(false);
    expect(f.note).toMatch(/Never refreeze/);
  });
  it('warmed milk: 2 hours, not back into fridge or freezer', () => {
    expect(ruleFor('warmed', 'room').hours).toBe(2);
    expect(ruleFor('warmed', 'fridge').allowed).toBe(false);
    expect(ruleFor('warmed', 'freezer').allowed).toBe(false);
  });
  it('leftover milk: 1 hour and never stored', () => {
    expect(ruleFor('leftover', 'room').hours).toBe(1);
    expect(ruleFor('leftover', 'fridge').allowed).toBe(false);
  });
  it('every combination returns a rule with a range', () => {
    for (const s of ['fresh', 'thawed', 'warmed', 'leftover'] as MilkState[])
      for (const p of ['room', 'cooler', 'fridge', 'freezer'] as MilkPlace[]) {
        const r = ruleFor(s, p);
        expect(r.range.length).toBeGreaterThan(0);
        if (r.allowed) expect(r.hours !== null || r.months !== null).toBe(true);
      }
  });
});

describe('discardBy', () => {
  it('adds hours across midnight', () => {
    const r = discardBy('fresh', 'room', t('2026-11-01T22:30'));
    expect(r.discardBy!.toISOString().slice(0, 16)).toBe('2026-11-02T02:30');
  });
  it('fridge: 4 days', () => {
    expect(discardBy('fresh', 'fridge', t('2026-11-01T08:00')).discardBy!.toISOString().slice(0, 16)).toBe('2026-11-05T08:00');
  });
  it('freezer: 6 calendar months', () => {
    expect(discardBy('fresh', 'freezer', t('2026-11-01T08:00')).discardBy!.toISOString().slice(0, 16)).toBe('2027-05-01T08:00');
  });
  it('no discard time for forbidden storage', () => {
    expect(discardBy('thawed', 'freezer', t('2026-11-01T08:00')).discardBy).toBeNull();
  });
});

describe('helpers', () => {
  it('addMonths clamps to month end', () => {
    expect(addMonths(t('2026-08-31T10:00'), 6).toISOString().slice(0, 10)).toBe('2027-02-28');
  });
  it('parseDateTime rejects bad input', () => {
    expect(parseDateTime('')).toBeNull();
    expect(parseDateTime('2026-13-01T10:00')).toBeNull();
    expect(parseDateTime('2026-02-30T10:00')).toBeNull();
  });
  it('formatDuration', () => {
    expect(formatDuration(ruleFor('fresh', 'fridge'))).toBe('4 days');
    expect(formatDuration(ruleFor('leftover', 'room'))).toBe('1 hour');
    expect(formatDuration(ruleFor('fresh', 'freezer'))).toBe('6 months');
  });
  it('hoursLeft', () => {
    expect(hoursLeft(t('2026-11-01T12:00'), t('2026-11-01T10:30'))).toBe(1.5);
  });
});
