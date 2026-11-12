import { describe, expect, it } from 'vitest';
import { assess, childOutcomes } from '../genotype';

describe('genotype compatibility', () => {
  it('AA x AA: every child AA', () => {
    expect(childOutcomes('AA', 'AA')).toMatchObject({ AA: 100, AS: 0, SS: 0 });
    expect(assess('AA', 'AA').level).toBe('none');
  });
  it('AA x AS: half the children carry the trait, none have disease', () => {
    const r = assess('AA', 'AS');
    expect(r.outcomes).toMatchObject({ AA: 50, AS: 50 });
    expect(r.sickleDisease).toBe(0);
    expect(r.level).toBe('trait');
  });
  it('AS x AS: 25% SS, 50% AS, 25% AA', () => {
    const r = assess('AS', 'AS');
    expect(r.outcomes).toMatchObject({ AA: 25, AS: 50, SS: 25 });
    expect(r.sickleDisease).toBe(25);
    expect(r.level).toBe('disease-risk');
  });
  it('AS x AC: 25% SC disease', () => {
    const r = assess('AS', 'AC');
    expect(r.outcomes).toMatchObject({ AA: 25, AS: 25, AC: 25, SC: 25 });
    expect(r.sickleDisease).toBe(25);
  });
  it('SS x AA: all children carriers, no disease', () => {
    const r = assess('SS', 'AA');
    expect(r.outcomes.AS).toBe(100);
    expect(r.sickleDisease).toBe(0);
  });
  it('SS x SS: all SS. SS x AS: half SS', () => {
    expect(assess('SS', 'SS').sickleDisease).toBe(100);
    expect(assess('SS', 'AS').sickleDisease).toBe(50);
  });
  it('is symmetric and the percentages add to 100', () => {
    const all = ['AA', 'AS', 'AC', 'SS', 'SC', 'CC'] as const;
    for (const a of all) for (const b of all) {
      expect(childOutcomes(a, b)).toEqual(childOutcomes(b, a));
      expect(Object.values(childOutcomes(a, b)).reduce((x, y) => x + y, 0)).toBe(100);
    }
  });
  it('CC x SS: all SC', () => {
    expect(assess('CC', 'SS').outcomes.SC).toBe(100);
  });
});
