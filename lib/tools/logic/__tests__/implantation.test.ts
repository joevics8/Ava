import { describe, expect, it } from 'vitest';
import { NO_FLAGS, scoreQuiz, type QuizAnswers } from '../implantation';

const spotting: QuizAnswers = { timing: 'days-8-to-3', colour: 'pink-brown', flow: 'spotting', duration: 'short', clots: 'no', cramps: 'none-mild' };
const period: QuizAnswers = { timing: 'after-due', colour: 'red', flow: 'heavy', duration: 'long', clots: 'yes', cramps: 'strong' };

describe('implantation quiz', () => {
  it('classic spotting pattern leans implantation', () => {
    const r = scoreQuiz(spotting);
    expect(r.verdict).toBe('implantation');
    expect(r.implantationScore).toBe(6);
    expect(r.periodScore).toBe(0);
  });
  it('classic period pattern leans period', () => {
    const r = scoreQuiz(period);
    expect(r.verdict).toBe('period');
    expect(r.periodScore).toBe(8);
    expect(r.implantationScore).toBe(0);
  });
  it('mixed answers give "mixed"', () => {
    const r = scoreQuiz({ ...spotting, colour: 'red', duration: 'long', cramps: 'strong' });
    expect(r.verdict).toBe('mixed');
  });
  it('heavy flow can never come out as implantation', () => {
    const r = scoreQuiz({ ...spotting, flow: 'heavy' });
    expect(r.implantationScore - r.periodScore).toBeGreaterThanOrEqual(3);
    expect(r.verdict).toBe('mixed');
  });
  it('unsure timing adds no points either way', () => {
    const a = scoreQuiz({ ...spotting, timing: 'unsure' });
    expect(a.implantationScore).toBe(4);
    expect(a.periodScore).toBe(0);
  });
  it('red flags set urgent without changing the pattern', () => {
    expect(scoreQuiz(spotting, NO_FLAGS).urgent).toBe(false);
    for (const k of ['soaking', 'oneSidedPain', 'faint', 'shoulderTip'] as const) {
      const r = scoreQuiz(spotting, { ...NO_FLAGS, [k]: true });
      expect(r.urgent).toBe(true);
      expect(r.verdict).toBe('implantation');
    }
  });
  it('every answer produces a reason except unsure timing, none-clots and light flow', () => {
    expect(scoreQuiz(spotting).reasons).toHaveLength(5);
    expect(scoreQuiz({ ...spotting, flow: 'light', timing: 'unsure' }).reasons).toHaveLength(3);
  });
});
