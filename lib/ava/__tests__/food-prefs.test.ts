import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateUser = vi.fn(async () => undefined);
vi.mock('../db', () => ({ updateUser: (...a: any[]) => (updateUser as any)(...a) }));

import { detectFoodPreferences, mergePrefs, captureFoodPreferences } from '../food-prefs';

describe('detectFoodPreferences', () => {
  it('finds a way of eating', () => {
    expect(detectFoodPreferences("I'm vegetarian")?.diet).toBe('vegetarian');
    expect(detectFoodPreferences('i am now vegan so no more suya')?.diet).toBe('vegan');
    expect(detectFoodPreferences('I follow a halal diet')?.diet).toBe('halal');
  });
  it('finds foods she avoids', () => {
    expect(detectFoodPreferences("I don't eat pork")?.avoid).toEqual(['pork']);
    expect(detectFoodPreferences('I do not eat pork or beef')?.avoid).toEqual(['pork', 'beef']);
    expect(detectFoodPreferences("I can't eat dairy because it upsets my stomach")?.avoid).toEqual(['dairy']);
    expect(detectFoodPreferences('I never eat fish, eggs and rice anymore')?.avoid).toEqual(['fish', 'eggs', 'rice']);
  });
  it('finds allergies and intolerances', () => {
    expect(detectFoodPreferences("I'm allergic to peanuts")?.allergies).toEqual(['peanuts']);
    expect(detectFoodPreferences('I have a shellfish allergy')?.allergies).toEqual(['shellfish']);
    expect(detectFoodPreferences("I'm lactose intolerant")?.allergies).toEqual(['dairy (lactose)']);
    expect(detectFoodPreferences("I'm allergic to eggs and milk")?.allergies).toEqual(['eggs', 'milk']);
  });
  it('ignores statements that are not food preferences', () => {
    for (const t of [
      "I don't eat much when I'm stressed", "I can't eat anything today, I feel sick", "I don't have time to cook",
      "I'm allergic to penicillin", "I don't drink enough water", 'I never take my pill on time', "I'm vegetarian-curious?? no",
      'my sister is vegan', "I don't know what to eat", 'what should I eat', "I'm allergic to cats",
    ]) expect(detectFoodPreferences(t), t).toBeNull();
  });
});

describe('mergePrefs', () => {
  it('adds without duplicating and replaces "none"', () => {
    const r = mergePrefs({ avoid: 'None', allergies: 'eggs' }, { avoid: ['pork'], allergies: ['Eggs', 'peanuts'], diet: 'halal' });
    expect(r.profile).toEqual({ avoid: 'pork', allergies: 'eggs, peanuts', diet: 'halal' });
    expect(r.changes).toEqual(["you're halal", 'you avoid pork', "you're allergic or sensitive to peanuts"]);
  });
  it('reports nothing when it is already saved', () => {
    expect(mergePrefs({ diet: 'vegan', avoid: 'pork' }, { diet: 'vegan', avoid: ['pork'], allergies: [] }).changes).toEqual([]);
  });
});

describe('captureFoodPreferences', () => {
  beforeEach(() => updateUser.mockClear());
  it('saves, updates the user in place and confirms', async () => {
    const user: any = { telegram_id: 7, food_profile: { budget: 'Moderate' } };
    const note = await captureFoodPreferences(user, "I'm vegetarian and I don't eat eggs");
    expect(updateUser).toHaveBeenCalledWith(7, { food_profile: { budget: 'Moderate', diet: 'vegetarian', avoid: 'eggs' } });
    expect(user.food_profile.diet).toBe('vegetarian');
    expect(note).toMatch(/^📝 Noted — you're vegetarian and you avoid eggs\./);
  });
  it('does nothing for ordinary messages or repeats', async () => {
    const user: any = { telegram_id: 7, food_profile: { diet: 'vegetarian' } };
    expect(await captureFoodPreferences(user, 'what should I eat?')).toBeNull();
    expect(await captureFoodPreferences(user, "I'm vegetarian")).toBeNull();
    expect(updateUser).not.toHaveBeenCalled();
  });
  it('works for a user with no profile yet', async () => {
    const user: any = { telegram_id: 9, food_profile: null };
    expect(await captureFoodPreferences(user, "I'm allergic to peanuts")).toContain("allergic or sensitive to peanuts");
    expect(updateUser).toHaveBeenCalledWith(9, { food_profile: { allergies: 'peanuts' } });
  });
});
