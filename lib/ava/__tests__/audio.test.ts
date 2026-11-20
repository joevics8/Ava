import { describe, it, expect } from 'vitest';
import { formatDuration, trackForDay, pickRandom, buildSendAudioBody } from '../audio';

describe('audio helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(725)).toBe('12:05');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(null)).toBe('');
  });
  it('picks the same daily track for everyone and rotates by day', () => {
    const t = [{ id: 'b' }, { id: 'a' }, { id: 'c' }];
    const d1 = new Date(Date.UTC(2026, 10, 20, 3)), d1b = new Date(Date.UTC(2026, 10, 20, 22)), d2 = new Date(Date.UTC(2026, 10, 21));
    expect(trackForDay(t, d1)).toEqual(trackForDay(t, d1b));
    expect(trackForDay(t, d1)).not.toEqual(trackForDay(t, d2));
    expect(trackForDay([], d1)).toBeNull();
  });
  it('picks randomly within bounds', () => {
    expect(pickRandom(['x', 'y', 'z'], () => 0)).toBe('x');
    expect(pickRandom(['x', 'y', 'z'], () => 0.999)).toBe('z');
    expect(pickRandom([])).toBeNull();
  });
  it('builds the sendAudio body, preferring a cached file_id', () => {
    const base = { title: 'Rain', duration_seconds: 600, audio_url: 'https://x/y.mp3', telegram_file_id: null };
    expect(buildSendAudioBody(5, base)).toMatchObject({ chat_id: 5, audio: 'https://x/y.mp3', title: 'Rain', performer: 'Ava', duration: 600 });
    expect(buildSendAudioBody(5, { ...base, telegram_file_id: 'FID' })?.audio).toBe('FID');
    expect(buildSendAudioBody(5, { ...base, audio_url: null })).toBeNull();
  });
});
