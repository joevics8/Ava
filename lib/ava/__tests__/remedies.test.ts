import { describe, it, expect } from 'vitest';
import { detectCondition } from '../remedies';

describe('detectCondition — body-location acne (word-order independent)', () => {
  it('routes a real reported message to acne_body, not plain acne', () => {
    // Actual reported case: "breakouts" and "neck" aren't adjacent, so the
    // old fixed-phrase 'neck breakout' entry would have missed this.
    expect(detectCondition('They are painful breakouts coming out from my neck and face')).toBe('acne_body');
  });

  it('matches regardless of word order for back/chest/body too', () => {
    expect(detectCondition('I have spots on my back')).toBe('acne_body');
    expect(detectCondition('breakout on my chest')).toBe('acne_body');
    expect(detectCondition('body acne is so bad this week')).toBe('acne_body');
  });

  it('still falls back to plain facial acne when no body location is mentioned', () => {
    expect(detectCondition('I have a breakout on my chin')).toBe('acne');
    expect(detectCondition('so many pimples today')).toBe('acne');
  });
});

describe('detectCondition — general sanity', () => {
  it('returns null when nothing matches', () => {
    expect(detectCondition('what a lovely day')).toBeNull();
  });

  it('still matches unrelated existing conditions correctly', () => {
    expect(detectCondition('I have really bad cramps today')).toBe('cramps');
    expect(detectCondition('feeling so tired lately')).toBe('fatigue');
  });
});
