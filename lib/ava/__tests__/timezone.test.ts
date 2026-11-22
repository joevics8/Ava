import { describe, it, expect } from 'vitest';
import { wallClock, localDateIn, localHour, tzForCountry, parseTimezoneInput, morningDue, greetingFor, isValidTimezone, currentTz, useUserTimezone, DEFAULT_TZ } from '../timezone';

const t = new Date(Date.UTC(2026, 10, 20, 23, 30)); // 20 Nov 23:30 UTC

describe('local time', () => {
  it('flips the date at each zone\'s own midnight', () => {
    expect(localDateIn(t, 'Africa/Lagos')).toBe('2026-11-21');   // 00:30 next day
    expect(localDateIn(t, 'America/New_York')).toBe('2026-11-20'); // 18:30
    expect(localDateIn(t, 'Asia/Kolkata')).toBe('2026-11-21');   // 05:00
    expect(localDateIn(t, 'Pacific/Auckland')).toBe('2026-11-21');
  });
  it('gives local hours and greetings', () => {
    expect(localHour(t, 'Asia/Kolkata')).toBe(5);
    expect(localHour(t, 'America/Los_Angeles')).toBe(15);
    expect(greetingFor(5)).toBe('morning'); expect(greetingFor(13)).toBe('afternoon'); expect(greetingFor(20)).toBe('evening');
  });
  it('handles daylight saving', () => {
    expect(localHour(new Date(Date.UTC(2026, 6, 1, 12)), 'Europe/London')).toBe(13);
    expect(localHour(new Date(Date.UTC(2026, 11, 1, 12)), 'Europe/London')).toBe(12);
  });
  it('wallClock exposes local fields as UTC fields', () => expect(wallClock(t, 'Africa/Lagos').toISOString()).toBe('2026-11-21T00:30:00.000Z'));
});

describe('country and input parsing', () => {
  it('maps countries, defaulting to Lagos', () => {
    expect(tzForCountry('Nigeria')).toBe('Africa/Lagos');
    expect(tzForCountry(' United Kingdom ')).toBe('Europe/London');
    expect(tzForCountry('The Philippines'.replace('The ', ''))).toBe('Asia/Manila');
    expect(tzForCountry('Narnia')).toBe(DEFAULT_TZ);
    expect(tzForCountry(null)).toBe(DEFAULT_TZ);
  });
  it('parses zones, cities and offsets', () => {
    expect(parseTimezoneInput('Europe/Paris')).toBe('Europe/Paris');
    expect(parseTimezoneInput('new york')).toBe('America/New_York');
    expect(parseTimezoneInput('UTC+2')).toBe('Etc/GMT-2');
    expect(parseTimezoneInput('GMT-5')).toBe('Etc/GMT+5');
    expect(parseTimezoneInput('utc')).toBeNull();
    expect(parseTimezoneInput('UTC+20')).toBeNull();
    expect(parseTimezoneInput('Mars/Olympus')).toBeNull();
    expect(parseTimezoneInput('Kenya')).toBe('Africa/Nairobi');
    expect(isValidTimezone(parseTimezoneInput('UTC+2')!)).toBe(true);
  });
});

describe('morningDue', () => {
  it('waits for 8am local and sends once per local day', () => {
    const lagos7 = new Date(Date.UTC(2026, 10, 20, 6, 0)), lagos9 = new Date(Date.UTC(2026, 10, 20, 8, 0));
    expect(morningDue('Africa/Lagos', null, lagos7, 8)).toBe(false);
    expect(morningDue('Africa/Lagos', null, lagos9, 8)).toBe(true);
    expect(morningDue('Africa/Lagos', '2026-11-20', lagos9, 8)).toBe(false);
    expect(morningDue('Africa/Lagos', '2026-11-19', lagos9, 8)).toBe(true);
  });
});

describe('per-request zone', () => {
  it('defaults to Lagos and can be set', () => {
    expect(currentTz()).toBe(DEFAULT_TZ);
    useUserTimezone('not/a-zone'); expect(currentTz()).toBe(DEFAULT_TZ);
    useUserTimezone('Asia/Tokyo'); expect(currentTz()).toBe('Asia/Tokyo');
  });
});
