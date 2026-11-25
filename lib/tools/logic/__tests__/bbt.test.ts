import { describe, expect, it } from 'vitest';
import { analyseBbt, fromC, parseReadings, toC, type BbtReading } from '../bbt';

const mk = (temps: (number | null | string)[]): BbtReading[] =>
  temps.map((t, i) => ({ day: i + 1, temp: typeof t === 'string' ? Number(t.replace('*', '')) : t, disturbed: typeof t === 'string' && t.endsWith('*') }));

// 13 low days around 36.4, then a clear rise from day 15.
const low = [36.4, 36.45, 36.35, 36.5, 36.4, 36.42, 36.38, 36.45, 36.4, 36.43, 36.5, 36.41, 36.44, 36.4];
const clear = [...low, 36.7, 36.75, 36.8, 36.78, 36.77, 36.8, 36.75, 36.72, 36.7, 36.75];

describe('parseReadings', () => {
  it('parses lines, commas and spaces, dashes and disturbed marks', () => {
    const r = parseReadings('36.4\n36.5, 36.6 - 36.7* x', 'C');
    expect(r.errors).toEqual([]);
    expect(r.readings.map(x => x.temp)).toEqual([36.4, 36.5, 36.6, null, 36.7, null]);
    expect(r.readings[4].disturbed).toBe(true);
  });
  it('rejects text, impossible values and over-long input', () => {
    expect(parseReadings('', 'C').errors.length).toBe(1);
    expect(parseReadings('36.4 abc', 'C').errors[0]).toMatch(/Day 2/);
    expect(parseReadings('97.6', 'C').errors[0]).toMatch(/outside/);
    expect(parseReadings('36.5', 'F').errors[0]).toMatch(/outside/);
    expect(parseReadings(Array(46).fill('36.5').join(' '), 'C').errors[0]).toMatch(/45/);
  });
  it('accepts Fahrenheit', () => {
    expect(parseReadings('97.6 98.2', 'F').errors).toEqual([]);
  });
});

describe('unit conversion', () => {
  it('converts both ways', () => {
    expect(toC(98.6, 'F')).toBeCloseTo(37, 5);
    expect(fromC(36.5, 'F')).toBeCloseTo(97.7, 5);
  });
});

describe('analyseBbt', () => {
  it('finds a clear shift and estimates ovulation the day before the rise', () => {
    const r = analyseBbt(mk(clear), 'C');
    expect(r.status).toBe('shift');
    expect(r.shift!.firstHighDay).toBe(15);
    expect(r.shift!.likelyOvulationDay).toBe(14);
    expect(r.shift!.earliestOvulationDay).toBe(13);
    expect(r.shift!.latestOvulationDay).toBe(15);
    expect(r.shift!.coverline).toBe(36.5);
    expect(r.shift!.confirmedOnDay).toBe(17);
    expect(r.shift!.usedFourthReading).toBe(false);
    expect(r.shift!.rise).toBeGreaterThanOrEqual(0.2);
    expect(r.shift!.highRunEnded).toBe(false);
  });
  it('requires the third high reading to be 0.2 C over the coverline, otherwise a fourth above it', () => {
    const t = [...low, 36.55, 36.6, 36.65, 36.6, 36.6]; // third is 0.15 over 36.5
    const r = analyseBbt(mk(t), 'C');
    expect(r.status).toBe('shift');
    expect(r.shift!.usedFourthReading).toBe(true);
    expect(r.shift!.confirmedOnDay).toBe(18);
    const noFourth = analyseBbt(mk([...low, 36.55, 36.6, 36.65]), 'C');
    expect(noFourth.status).toBe('no-shift');
    const fourthDrops = analyseBbt(mk([...low, 36.55, 36.6, 36.65, 36.45, 36.4]), 'C');
    expect(fourthDrops.status).toBe('no-shift');
  });
  it('does not count readings that only equal the coverline', () => {
    const r = analyseBbt(mk([...low, 36.5, 36.7, 36.8, 36.8]), 'C');
    expect(r.shift!.firstHighDay).toBe(16);
  });
  it('reports no shift on a flat chart, without claiming anovulation', () => {
    const flat = Array.from({ length: 28 }, (_, i) => (i % 2 ? 36.4 : 36.45));
    const r = analyseBbt(mk(flat), 'C');
    expect(r.status).toBe('no-shift');
    expect(r.notes.join(' ')).toMatch(/does not mean you did not ovulate/);
  });
  it('is insufficient with too few days or readings', () => {
    expect(analyseBbt(mk([36.4, 36.5, 36.4]), 'C').status).toBe('insufficient');
    expect(analyseBbt(mk([36.4, null, null, null, 36.4, null, null, 36.5, 36.4, 36.4, null, 36.5]), 'C').status).toBe('insufficient');
  });
  it('works in Fahrenheit (0.4 F passes, 0.3 F does not)', () => {
    const lowF = low.map(v => Math.round(fromC(v, 'F') * 10) / 10);
    const cover = Math.max(...lowF);
    const pass = analyseBbt(mk([...lowF, cover + 0.5, cover + 0.6, cover + 0.5]), 'F');
    expect(pass.status).toBe('shift');
    expect(pass.shift!.coverline).toBeCloseTo(cover, 1);
    const weak = analyseBbt(mk([...lowF, cover + 0.2, cover + 0.2, cover + 0.3]), 'F');
    expect(weak.status).toBe('no-shift');
  });
  it('tolerates one missing day before the rise but not a missing day inside the rise', () => {
    const gap: (number | null)[] = [...clear]; gap[3] = null;
    expect(analyseBbt(mk(gap), 'C').status).toBe('shift');
    const inside: (number | null)[] = [...clear]; inside[15] = null;
    const r = analyseBbt(mk(inside), 'C');
    expect(r.shift?.firstHighDay).not.toBe(15);
    const manyGaps: (number | null)[] = [...clear]; manyGaps[8] = null; manyGaps[9] = null; manyGaps[10] = null;
    const g = analyseBbt(mk(manyGaps), 'C');
    expect(g.status).toBe('no-shift');
    expect(g.notes.join(' ')).toMatch(/too many readings before it are missing/);
  });
  it('ignores disturbed readings and says so', () => {
    const t: (number | string)[] = [...clear];
    t[4] = '37.2*'; // a fever spike before the rise must not set the coverline
    const r = analyseBbt(mk(t), 'C');
    expect(r.status).toBe('shift');
    expect(r.shift!.coverline).toBe(36.5);
    expect(r.disturbedDays).toBe(1);
    expect(r.notes.join(' ')).toMatch(/disturbed/);
    const hot: (number | string)[] = [...clear]; hot[15] = '36.3*';
    expect(analyseBbt(mk(hot), 'C').shift?.firstHighDay).not.toBe(15);
  });
  it('flags the end of the high run and a long run as a possible pregnancy sign', () => {
    const ended = analyseBbt(mk([...clear, 36.4, 36.4]), 'C');
    expect(ended.shift!.highRunEnded).toBe(true);
    expect(ended.suggestPregnancyTest).toBe(false);
    const long = analyseBbt(mk([...low, ...Array(20).fill(36.8)]), 'C');
    expect(long.shift!.highDays).toBe(20);
    expect(long.suggestPregnancyTest).toBe(true);
  });
  it('always notes that BBT is retrospective', () => {
    expect(analyseBbt(mk(clear), 'C').notes[0]).toMatch(/after it has happened/);
  });
});
