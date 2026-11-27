// Food list contract. Each list lives in lib/ava/food/data/<slug>.ts as compact tuples:
//   export const foods: FoodTuple[] = [ ['jollof rice', 'energy carbs'], ... ];
// Tags are space-separated and come from FOOD_TAGS (shared with cycle-lookup's nutrientTags).

export const FOOD_TAGS = ['iron', 'energy', 'protein', 'magnesium', 'mood', 'hydration', 'fiber', 'comfort', 'carbs', 'strength', 'digestion'] as const;
export type FoodTag = typeof FOOD_TAGS[number];

export type FoodTuple = [name: string, tags: string];

export interface Food { name: string; tags: FoodTag[] }

export function expand(tuples: FoodTuple[]): Food[] {
  return tuples.map(([name, tags]) => ({ name, tags: tags.split(/\s+/).filter(Boolean) as FoodTag[] }));
}
