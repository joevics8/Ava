import { describe, it, expect } from 'vitest';
import { detectCrisis, crisisReply } from '../safety';

describe('detectCrisis', () => {
  it.each([
    'I want to kill myself', 'I just want to die', "I don't want to live anymore", 'thinking about suicide', 'I keep wanting to hurt myself',
    "I can't go on like this", 'everyone would be better off without me', 'there is no point in living', 'I feel hopeless about my life', 'I have been self-harming',
    'i dont want to be here anymore'.replace('dont', "don't"),
  ])('flags: %s', t => expect(detectCrisis(t)).toBe(true));

  it.each([
    'these cramps are killing me', "I'm dying of embarrassment", 'my period is a killer this month', 'I feel sad today', 'I am so tired of this acne',
    "I'm not suicidal, just really low", 'no thoughts of self-harm, I just feel flat', 'I can do this, I will go on a run', 'the movie killed me lol',
  ])('does not flag: %s', t => expect(detectCrisis(t)).toBe(false));
});

describe('crisisReply', () => {
  it('has care, a person to reach, and no remedies', () => {
    const r = crisisReply('Ada', 'Nigeria');
    expect(r).toMatch(/Ada/);
    expect(r).toMatch(/112/);
    expect(r.toLowerCase()).not.toMatch(/remed|meditat|tea\b/);
  });
  it('picks the line by country', () => {
    expect(crisisReply(null, 'United States')).toMatch(/988/);
    expect(crisisReply(null, 'United Kingdom')).toMatch(/116 123/);
    expect(crisisReply(null, 'Peru')).toMatch(/findahelpline/);
  });
});
