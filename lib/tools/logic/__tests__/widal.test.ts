import { describe, expect, it } from 'vitest';
import { interpretWidal, parseFeverDays, widalBand } from '../widal';

describe('widal bands', () => {
  it('low when both titres are low', () => {
    expect(widalBand(20, 20)).toBe('low');
    expect(widalBand(40, 80)).toBe('low');
  });
  it('borderline for O 1:80 or an H titre of 1:160+ with a low O', () => {
    expect(widalBand(80, 40)).toBe('borderline');
    expect(widalBand(40, 160)).toBe('borderline');
    expect(widalBand(20, 640)).toBe('borderline');
  });
  it('raised when O is 1:160 or higher', () => {
    expect(widalBand(160, 20)).toBe('raised');
    expect(widalBand(640, 640)).toBe('raised');
  });
});

describe('interpretWidal', () => {
  it('never states a diagnosis and always mentions culture', () => {
    for (const o of [20, 80, 160, 640]) for (const h of [20, 160]) {
      const r = interpretWidal(o, h, 5);
      const text = r.points.join(' ') + r.headline;
      expect(text).not.toMatch(/you have typhoid|diagnos(is|ed) (of )?typhoid/i);
      expect(text).toMatch(/culture/i);
      expect(text).not.toMatch(/antibiotic.*(take|mg)/i);
    }
  });
  it('adds an early-illness note under 7 days of fever, and flags long fever over 3 days', () => {
    expect(interpretWidal(20, 20, 2).early).toBe(true);
    expect(interpretWidal(20, 20, 2).longFever).toBe(false);
    expect(interpretWidal(20, 20, 5).longFever).toBe(true);
    expect(interpretWidal(20, 20, 9).early).toBe(false);
    expect(interpretWidal(20, 20, null)).toMatchObject({ early: false, longFever: false });
    expect(interpretWidal(20, 20, 2).points.join(' ')).toMatch(/first week/);
  });
  it('headline matches the band', () => {
    expect(interpretWidal(160, 20, null).headline).toMatch(/^Raised/);
    expect(interpretWidal(80, 20, null).headline).toMatch(/^Borderline/);
    expect(interpretWidal(20, 20, null).headline).toMatch(/^Low/);
  });
});

describe('parseFeverDays', () => {
  it('blank is allowed', () => expect(parseFeverDays('  ')).toEqual({ value: null }));
  it('parses whole days', () => expect(parseFeverDays('4').value).toBe(4));
  it('rejects text, decimals and huge numbers', () => {
    expect(parseFeverDays('abc').error).toBeTruthy();
    expect(parseFeverDays('2.5').error).toBeTruthy();
    expect(parseFeverDays('400').error).toBeTruthy();
  });
});
