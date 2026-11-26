import { describe, expect, it } from 'vitest';
import { buildTimeline, colourCheck, NO_FLAGS, stageForDay, validDeliveryDate, warningLevel } from '../lochia';
import { iso, parseDate } from '../../calculators';

const d = (s: string) => parseDate(s)!;

describe('stageForDay', () => {
  it('maps boundaries', () => {
    expect(stageForDay(0)).toBe('rubra');
    expect(stageForDay(3)).toBe('rubra');
    expect(stageForDay(4)).toBe('serosa');
    expect(stageForDay(11)).toBe('serosa');
    expect(stageForDay(12)).toBe('alba');
    expect(stageForDay(42)).toBe('alba');
    expect(stageForDay(43)).toBe('tail');
    expect(stageForDay(56)).toBe('tail');
    expect(stageForDay(57)).toBe('beyond');
  });
});

describe('buildTimeline', () => {
  it('birth day is day 0 and rubra', () => {
    const t = buildTimeline(d('2026-11-01'), 'vaginal', d('2026-11-01'))!;
    expect(t.day).toBe(0);
    expect(t.stage).toBe('rubra');
  });
  it('computes date windows from the delivery date', () => {
    const t = buildTimeline(d('2026-11-01'), 'vaginal', d('2026-11-10'))!;
    expect(t.stage).toBe('serosa');
    const serosa = t.windows.find(w => w.key === 'serosa')!;
    expect(iso(serosa.start)).toBe('2026-11-05');
    expect(iso(serosa.end)).toBe('2026-11-12');
    expect(iso(t.typicalEnd)).toBe('2026-12-13');
    expect(iso(t.longestTypicalEnd)).toBe('2026-12-27');
    expect(t.weeks).toBe(1);
  });
  it('alba at 3 weeks', () => {
    const t = buildTimeline(d('2026-11-01'), 'caesarean', d('2026-11-22'))!;
    expect(t.stage).toBe('alba');
    expect(t.flowNote).toMatch(/caesarean/);
  });
  it('after day 56 there is no current window', () => {
    const t = buildTimeline(d('2026-01-01'), 'vaginal', d('2026-04-01'))!;
    expect(t.stage).toBe('beyond');
    expect(t.current).toBeNull();
  });
  it('rejects future birth and very old dates', () => {
    expect(buildTimeline(d('2026-12-01'), 'vaginal', d('2026-11-01'))).toBeNull();
    expect(validDeliveryDate(d('2026-12-01'), d('2026-11-01'))).toBe('future');
    expect(validDeliveryDate(d('2025-01-01'), d('2026-11-01'))).toBe('too-old');
    expect(validDeliveryDate(d('2026-10-01'), d('2026-11-01'))).toBe('ok');
  });
});

describe('warnings', () => {
  it('none by default', () => expect(warningLevel(NO_FLAGS)).toBe('none'));
  it('soaking a pad an hour, dizziness or fever are urgent', () => {
    expect(warningLevel({ ...NO_FLAGS, soakingPad: true })).toBe('urgent');
    expect(warningLevel({ ...NO_FLAGS, dizzy: true })).toBe('urgent');
    expect(warningLevel({ ...NO_FLAGS, fever: true })).toBe('urgent');
  });
  it('clots, smell, heavier bleeding: call today', () => {
    expect(warningLevel({ ...NO_FLAGS, bigClots: true })).toBe('call');
    expect(warningLevel({ ...NO_FLAGS, foulSmell: true })).toBe('call');
    expect(warningLevel({ ...NO_FLAGS, heavierOrRed: true })).toBe('call');
  });
  it('urgent wins over call', () => {
    expect(warningLevel({ ...NO_FLAGS, bigClots: true, dizzy: true })).toBe('urgent');
  });
});

describe('colourCheck', () => {
  it('red after a week is flagged', () => expect(colourCheck(8, 'red')).toMatch(/first week/));
  it('red on day 5 gets a gentle note', () => expect(colourCheck(5, 'red')).toMatch(/day 4/));
  it('red in the first days is normal', () => expect(colourCheck(2, 'red')).toBeNull());
  it('unsure and brown are quiet', () => {
    expect(colourCheck(10, 'unsure')).toBeNull();
    expect(colourCheck(10, 'brown')).toBeNull();
  });
});
