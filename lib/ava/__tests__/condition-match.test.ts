import { describe, it, expect } from 'vitest';
import { pickCondition, conditionEmbeddingText } from '../condition-match';

const m = (condition: string, similarity: number) => ({ condition, label: condition, similarity });
const opts = { min: 0.72, margin: 0.02 };

describe('pickCondition', () => {
  it('accepts a clear winner', () => expect(pickCondition([m('bloating', 0.8), m('cramps', 0.7)], opts)).toBe('bloating'));
  it('rejects below the bar', () => expect(pickCondition([m('bloating', 0.65)], opts)).toBeNull());
  it('rejects a near tie', () => expect(pickCondition([m('bloating', 0.8), m('cramps', 0.79)], opts)).toBeNull());
  it('never returns a serious condition', () => expect(pickCondition([m('pcos_symptoms', 0.9), m('cramps', 0.5)], opts)).toBeNull());
  it('does not fall to a lesser one when the best is serious', () => expect(pickCondition([m('thyroid_symptoms', 0.85), m('fatigue', 0.8)], opts)).toBeNull());
  it('handles empty', () => expect(pickCondition([], opts)).toBeNull());
});
describe('conditionEmbeddingText', () => {
  it('joins label and trimmed description', () => expect(conditionEmbeddingText('Bloating', ' gas ')).toBe('Bloating. gas'));
  it('label only', () => expect(conditionEmbeddingText('Bloating', null)).toBe('Bloating'));
});
