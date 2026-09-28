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

describe('detectCondition — batch 1 new conditions (collision-prone ones)', () => {
  it('routes scalp itchiness to itchy_scalp, not the existing vaginal itchy keyword', () => {
    expect(detectCondition('my scalp is so itchy today')).toBe('itchy_scalp');
    expect(detectCondition('itchy scalp all week')).toBe('itchy_scalp');
  });

  it('routes scalp flaking to dandruff even when "itchy" is also present', () => {
    expect(detectCondition('my scalp is flaky and itchy')).toBe('dandruff');
  });

  it('still routes plain vaginal itching correctly (unaffected by the scalp fix)', () => {
    expect(detectCondition('I feel itchy down there')).toBe('vaginal_itching');
  });

  it('routes eye puffiness to puffy_eyes, not the existing water_retention keyword', () => {
    expect(detectCondition('my eyes are so puffy this morning')).toBe('puffy_eyes');
    expect(detectCondition('puffy eyes today')).toBe('puffy_eyes');
  });

  it('still routes plain puffiness/swelling to water_retention (unaffected by the eye fix)', () => {
    expect(detectCondition('feeling so puffy all over')).toBe('water_retention');
  });

  it('routes oversleeping to oversleeping, not the existing sleep keyword', () => {
    expect(detectCondition('I keep oversleeping every day')).toBe('oversleeping');
    expect(detectCondition('I overslept again this morning')).toBe('oversleeping');
    expect(detectCondition('sleeping way too much lately')).toBe('oversleeping');
  });

  it('still routes plain sleep trouble to sleep (unaffected by the oversleeping fix)', () => {
    expect(detectCondition("I can't sleep at all")).toBe('sleep');
  });

  it('does not treat "crash" as a skin rash, but still catches a real rash', () => {
    expect(detectCondition('hit an energy crash this afternoon')).toBe('afternoon_energy_crash');
    expect(detectCondition('I have a rash on my arm')).toBe('sensitive_skin');
  });

  it('routes a sample of the other 22 new conditions correctly', () => {
    expect(detectCondition('I have really bad heartburn after dinner')).toBe('acid_reflux');
    expect(detectCondition('so much gas today, I feel gassy')).toBe('gas_flatulence');
    expect(detectCondition('I think I have bad breath')).toBe('bad_breath');
    expect(detectCondition('I have no appetite lately')).toBe('loss_of_appetite');
    expect(detectCondition('I am always hungry these days')).toBe('increased_appetite');
    expect(detectCondition('hit an energy crash this afternoon')).toBe('afternoon_energy_crash');
    expect(detectCondition('bad neck tension today')).toBe('neck_shoulder_tension');
    expect(detectCondition('my jaw pain is back')).toBe('jaw_clenching');
    expect(detectCondition('my wrist pain is worse today')).toBe('wrist_hand_pain');
    expect(detectCondition('hip pain when I walk')).toBe('hip_pain');
    expect(detectCondition('tailbone pain when sitting')).toBe('tailbone_pain');
    expect(detectCondition('sharp rib pain today')).toBe('rib_pain');
    expect(detectCondition('my heels are so cracked')).toBe('cracked_heels');
    expect(detectCondition('my lips are so chapped')).toBe('chapped_lips');
    expect(detectCondition('so much dandruff this week')).toBe('dandruff');
    expect(detectCondition('bad split ends lately')).toBe('split_ends');
    expect(detectCondition('my nails are so brittle')).toBe('brittle_nails');
    expect(detectCondition('noticing nail ridges lately')).toBe('nail_ridges');
    expect(detectCondition('bad dark circles today')).toBe('dark_circles');
    expect(detectCondition('ingrown hair on my leg')).toBe('ingrown_hairs');
    expect(detectCondition('dark underarms bothering me')).toBe('dark_underarms');
    expect(detectCondition('dark inner thigh area')).toBe('dark_inner_thighs');
  });
});
