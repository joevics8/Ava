import { describe, expect, it } from 'vitest';
import { ageContext, assessPerimenopause, validAge, type PerimenopauseInput } from '../perimenopause';

const base: PerimenopauseInput = { age: 48, periods: 'regular', symptoms: [], flags: [] };
const run = (o: Partial<PerimenopauseInput>) => assessPerimenopause({ ...base, ...o });

describe('validAge', () => {
  it('accepts whole ages 18 to 80 only', () => {
    expect(validAge(18)).toBe(true);
    expect(validAge(80)).toBe(true);
    expect(validAge(17)).toBe(false);
    expect(validAge(81)).toBe(false);
    expect(validAge(45.5)).toBe(false);
    expect(validAge(NaN)).toBe(false);
  });
});

describe('pattern', () => {
  it('is low with no symptoms and regular periods', () => {
    expect(run({}).pattern).toBe('low');
  });
  it('is close with changed periods and typical symptoms in the late 40s', () => {
    const r = run({ periods: 'changed', symptoms: ['hot-flushes', 'night-sweats', 'sleep'] });
    expect(r.pattern).toBe('close');
    expect(r.fits.length).toBeGreaterThan(3);
  });
  it('is partial with a few symptoms only', () => {
    expect(run({ symptoms: ['hot-flushes', 'mood'] }).pattern).toBe('partial');
  });
  it('never says "close" under 40, and flags skipped periods for a check', () => {
    const r = run({ age: 36, periods: 'skipping', symptoms: ['hot-flushes', 'night-sweats', 'sleep', 'mood'] });
    expect(r.pattern).toBe('partial');
    expect(r.urgency).toBe('soon');
    expect(r.agePoints).toMatch(/premature/);
  });
  it('is modest when periods are not a guide (contraception, hysterectomy)', () => {
    const r = run({ periods: 'not-applicable', symptoms: ['hot-flushes', 'night-sweats', 'vaginal-dryness', 'sleep', 'mood'] });
    expect(r.pattern).toBe('partial');
    expect(r.caveats.join(' ')).toMatch(/contraception/);
  });
  it('recognises 12 months without a period as the menopause definition, not a diagnosis', () => {
    const r = run({ age: 53, periods: 'stopped-12-plus' });
    expect(r.pattern).toBe('menopause-reached');
    expect(r.summary).toMatch(/12 months/);
    expect(r.summary).toMatch(/Any bleeding/);
  });
  it('does not call it menopause under 40 and asks for a check', () => {
    const r = run({ age: 35, periods: 'stopped-12-plus' });
    expect(r.pattern).not.toBe('menopause-reached');
    expect(r.urgency).toBe('soon');
  });
});

describe('what it does not explain and doctor advice', () => {
  it('very heavy bleeding is listed as not explained and advises seeing a doctor soon', () => {
    const r = run({ periods: 'changed', symptoms: ['hot-flushes'], flags: ['very-heavy-bleeding'] });
    expect(r.notExplained.map(n => n.id)).toEqual(['very-heavy-bleeding']);
    expect(r.urgency).toBe('soon');
  });
  it('bleeding after 12 months without a period is flagged', () => {
    const r = run({ age: 55, periods: 'stopped-12-plus', flags: ['bleeding-after-12-months'] });
    expect(r.urgency).toBe('soon');
    expect(r.notExplained[0].why).toMatch(/must always be checked/);
  });
  it('thyroid-like symptoms are listed', () => {
    expect(run({ flags: ['thyroid-overactive', 'thyroid-underactive'] }).notExplained.length).toBe(2);
  });
  it('self-harm or chest pain is urgent and wins over everything', () => {
    expect(run({ flags: ['self-harm', 'very-heavy-bleeding'] }).urgency).toBe('urgent');
    expect(run({ flags: ['chest-pain'] }).urgency).toBe('urgent');
  });
  it('routine advice for a fitting pattern, none when nothing applies', () => {
    expect(run({ periods: 'changed', symptoms: ['hot-flushes'] }).urgency).toBe('routine');
    expect(run({ age: 30 }).urgency).toBe('none');
  });
  it('pregnancy flag adds a test caveat', () => {
    expect(run({ flags: ['could-be-pregnant'] }).caveats.join(' ')).toMatch(/pregnancy test/);
  });
  it('never uses diagnostic language', () => {
    const r = run({ periods: 'changed', symptoms: ['hot-flushes', 'night-sweats', 'sleep'] });
    expect(`${r.headline} ${r.summary}`).not.toMatch(/you have perimenopause|you are perimenopausal|diagnos(ed|is) (of|with)/i);
    expect(r.summary).toMatch(/not a diagnosis/);
  });
});

describe('ageContext', () => {
  it('gives the right band', () => {
    expect(ageContext(38)).toMatch(/premature/);
    expect(ageContext(42)).toMatch(/early menopause/);
    expect(ageContext(50)).toMatch(/about 51/);
    expect(ageContext(60)).toMatch(/mid-50s/);
  });
});
