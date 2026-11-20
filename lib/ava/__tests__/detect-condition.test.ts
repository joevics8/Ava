import { describe, it, expect } from 'vitest';
import { detectCondition } from '../remedies';

const cases: [string, string | null][] = [
  // wrong before: said it is NOT happening / over
  ['no cramps today', null], ['my cramps are gone', null], ['no more headaches this week', null], ['the bloating has stopped', null], ['I feel much better now', null], ['The acne is gradually subsiding', null], ['my cramps are easing off', null], ['the headache is clearing up', null], ['the bloating is improving', null],
  // wrong before: ordinary words
  ["I'm in a good mood today", null], ['my mood is great', null], ['tired of this', null], ["I'm sick of work", null],
  // history questions go to the memory answer
  ['when did I last have cramps?', null],
  // still matches (these were right)
  ['I have cramps', 'cramps'], ['period pain is killing me', 'cramps'], ['so tired today', 'fatigue'], ['mood swings', 'pms_mood'],
  ["I couldn't sleep last night", 'sleep'], ['bloated and gassy', 'bloating'], ['burning when I pee', 'uti_prone'], ['no energy at all', 'fatigue'],
  ['period came today with cramps', 'cramps'], ['dizzy when I stand', 'dizziness'], ['I have a cold', 'common_cold'], ['white discharge', 'vaginal_health'],
  // were missed (null)
  ['head hurts', 'headaches'], ['my head is pounding', 'headaches'], ['my stomach hurts', 'cramps'], ['lower abdominal pain', 'cramps'],
  ['painful periods', 'cramps'], ['back hurts', 'back_pain'], ['feeling sad', 'pms_mood'], ['I feel low', 'pms_mood'], ['I am so emotional', 'pms_mood'],
  ['I am bleeding heavily', 'heavy_flow'], ['it hurts to pee', 'uti_prone'], ['itching down there', 'vaginal_itching'],
  ['my skin is breaking out', 'acne'], ['hair falling out', 'hair_thinning'],
  // wrong before: sent to general vaginal health
  ['brown discharge', 'spotting'], ['light bleeding today', 'spotting'], ['bleeding between periods', 'spotting'],
  // existing special cases still win
  ['breakouts on my neck', 'acne_body'], ['I got spotting', 'spotting'], ['nails keep peeling', 'brittle_nails'],
];

describe('detectCondition', () => {
  it.each(cases)('%s -> %s', (msg, expected) => { expect(detectCondition(msg)).toBe(expected); });
});

describe('detectCondition: "gone"', () => {
  it('relief after a symptom word is not a symptom; a lost voice still is', () => {
    expect(detectCondition('my cramps are gone')).toBeNull();
    expect(detectCondition('the headache has finally gone')).toBeNull();
    expect(detectCondition('my voice is gone')).toBe('hoarse_voice');
  });
});

describe('detectCondition: getting better vs not getting better', () => {
  it('still suggests when she says it is not improving', () => {
    expect(detectCondition('my acne is not improving')).not.toBeNull();
    expect(detectCondition("the cramps aren't easing at all")).not.toBeNull();
  });
});
