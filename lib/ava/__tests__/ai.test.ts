import { describe, it, expect } from 'vitest';
import { isDuplicateInsight } from '../ai';

describe('isDuplicateInsight', () => {
  it('flags a new insight that repeats the same distinctive term as a recent one', () => {
    // Real production example from this session: "malaria" recurring
    // verbatim across separately-generated insight summaries.
    const recent = ['Prioritize hydration and rest while recovering from malaria'];
    expect(isDuplicateInsight('Malaria and its medication can disrupt your menstrual cycle', recent)).toBe(true);
  });

  it('does not flag insights that are merely thematically similar without a shared distinctive word', () => {
    // This heuristic is a coarse, cheap backstop (literal word overlap) —
    // it can't catch full paraphrase-level repetition ("illness affected
    // your cycle" vs "malaria affected your cycle" share no literal
    // distinctive word). The prompt-level fixes (limited recent-context
    // window, explicit anti-repetition instruction) are the real defense
    // for that; this only catches a term recurring verbatim.
    const recent = ['Malaria and its medication can disrupt your menstrual cycle'];
    expect(isDuplicateInsight('Illness and antibiotics can cause early menstrual changes', recent)).toBe(false);
  });

  it('does not flag on domain-generic words alone (cycle, period, menstrual)', () => {
    const recent = ['User is tracking their menstrual cycle closely this month'];
    expect(isDuplicateInsight('User asked a general question about their cycle', recent)).toBe(false);
  });

  it('does not flag genuinely unrelated insights', () => {
    const recent = ['Malaria and its medication can disrupt your menstrual cycle'];
    expect(isDuplicateInsight('User prefers gentle yoga over running for cramps', recent)).toBe(false);
  });

  it('returns false when there is no recent history', () => {
    expect(isDuplicateInsight('Any new insight here', [])).toBe(false);
  });
});
