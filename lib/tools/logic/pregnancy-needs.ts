// Daily needs in pregnancy: extra energy, fluids, key nutrients, foods to avoid.
// Energy: the commonly quoted US figures (about 0 / +340 / +450 kcal a day in the
// 1st / 2nd / 3rd trimester, from the IOM energy requirements used by ACOG and the
// Academy of Nutrition and Dietetics). UK guidance is lower (none until the last
// trimester, then about 200), so the tool shows a range, not a single target.
// Fluids: EFSA total water 2.3 L (drinks plus food), IOM total water 3.0 L, with
// roughly 70-80% from drinks; NHS-style advice is 6 to 8 glasses, about 1.6 L.
// No exact nutrition numbers are given for individual foods (they vary by recipe).

export type Trimester = 1 | 2 | 3;
export type Fetuses = 'single' | 'twins';

export interface NeedsInput {
  week: number;
  fetuses: Fetuses;
  /** Vomiting, hot weather or lots of activity: fluid needs go up. */
  extraFluidFactors: boolean;
}

export function trimesterOf(week: number): Trimester {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

/** Extra kcal per day: [low, high] across UK and US guidance, plus the US figure. */
export const EXTRA_KCAL: Record<Trimester, { low: number; high: number; us: number }> = {
  1: { low: 0, high: 0, us: 0 },
  2: { low: 0, high: 340, us: 340 },
  3: { low: 200, high: 450, us: 450 },
};

export const FLUID = {
  /** Drinks per day, litres: lower bound NHS-style 6 to 8 glasses; upper bound about 2.3 L from drinks. */
  drinksLowL: 1.6,
  drinksHighL: 2.3,
  /** Total water including food: EFSA and IOM adequate intakes. */
  totalEfsaL: 2.3,
  totalIomL: 3.0,
  cupMl: 250,
} as const;

export interface Nutrient { name: string; amount: string; why: string; sources: string; note?: string }

export const NUTRIENTS: Nutrient[] = [
  {
    name: 'Folic acid (folate)', amount: '400 micrograms a day, from before conception until 12 weeks',
    why: 'Lowers the chance of neural tube defects such as spina bifida.',
    sources: 'Supplement, plus green leafy vegetables, beans and fortified foods.',
    note: 'A higher dose (5 mg) is prescribed if you are at higher risk, for example with diabetes, epilepsy medicines, a BMI of 30 or more, or a previous affected pregnancy.',
  },
  {
    name: 'Vitamin D', amount: '10 micrograms (400 IU) a day in UK advice; do not exceed 100 micrograms (4,000 IU) a day',
    why: 'Supports your baby\'s bones and your own.',
    sources: 'Sunlight on skin, oily fish, eggs, fortified foods, or a supplement.',
    note: 'Darker skin, covering clothes and little time outdoors lower your own vitamin D production, so a supplement is often advised.',
  },
  {
    name: 'Iron', amount: 'WHO advises daily iron with folic acid in antenatal care (30 to 60 mg of elemental iron); take only the dose you are given',
    why: 'Your blood volume rises, and iron helps prevent anaemia.',
    sources: 'Lean meat, fish, beans, dark green leaves, groundnuts and dried fruit. Vitamin C foods (oranges, tomatoes, peppers) help you absorb it.',
    note: 'Tea and coffee with meals can reduce absorption. Your clinic will check your haemoglobin.',
  },
  {
    name: 'Iodine', amount: 'Needs rise in pregnancy (WHO suggests about 250 micrograms a day in total)',
    why: 'Needed for your baby\'s brain development and your thyroid.',
    sources: 'Iodised salt, fish, eggs and dairy.',
    note: 'Check the label for iodised salt. Seaweed products can contain too much, so do not rely on them.',
  },
  {
    name: 'Protein', amount: 'Roughly 1.1 g per kg of body weight a day in the second half of pregnancy (US guidance)',
    why: 'Builds your baby\'s tissues, and your own.',
    sources: 'Beans, eggs, fish, well-cooked meat and poultry, dairy, groundnuts, soya and moi moi.',
    note: 'Most women who eat a normal mixed diet reach this without trying.',
  },
];

export const AVOID: { title: string; detail: string }[] = [
  { title: 'Alcohol', detail: 'No safe amount has been shown, so avoiding it completely is advised.' },
  { title: 'Raw or undercooked meat, poultry and eggs', detail: 'Cook until steaming hot with no pink. In many countries only eggs with a safety stamp are safe lightly cooked; if unsure, cook them hard.' },
  { title: 'Unpasteurised milk and soft cheese', detail: 'Includes raw milk and traditional fresh milk products that have not been boiled or pasteurised, such as unboiled nono or fresh farm cheese.' },
  { title: 'Liver and liver products, and vitamin A (retinol) supplements', detail: 'Too much preformed vitamin A can harm your baby. Check multivitamins and avoid cod liver oil.' },
  { title: 'Raw fish and shellfish', detail: 'Including sushi made with raw fish. Cook fish and shellfish thoroughly.' },
  { title: 'High-mercury fish', detail: 'Avoid shark, swordfish and marlin. Limit tuna, and limit oily fish to 2 portions a week.' },
  { title: 'Too much caffeine', detail: 'Keep to 200 mg a day or less: about 2 mugs of instant coffee, or 2 to 3 cups of tea, counting cola and energy drinks too.' },
  { title: 'Unlabelled herbal mixtures and tonics', detail: 'Herbal teas with liquorice root and home-made or market herbal preparations (such as agbo) have not been shown safe in pregnancy. Check with your midwife or doctor first.' },
  { title: 'Unwashed fruit, vegetables and salads', detail: 'Wash well. Peel fruit you cannot wash properly, and avoid pre-cut salads that have been sitting out.' },
  { title: 'Leftover rice and cooked foods left at room temperature', detail: 'Cool and refrigerate quickly, and reheat until steaming hot.' },
];

export type FoodGroup = 'starch' | 'protein' | 'veg-fruit' | 'dairy-fats';

export interface FoodIdea { group: FoodGroup; label: string; examples: string }

/** Qualitative food ideas. Energy varies with portion, oil and recipe, so none are given as exact numbers. */
export const FOOD_IDEAS: FoodIdea[] = [
  { group: 'starch', label: 'Starchy foods', examples: 'An extra handful of brown or parboiled rice, a slice of wholegrain bread, a medium boiled yam, sweet potato or plantain portion, a small bowl of oats, pap (ogi) or a portion of millet or maize swallow.' },
  { group: 'protein', label: 'Protein foods', examples: 'A boiled egg, a portion of beans (ewa, moi moi or akara baked or lightly fried), a piece of grilled fish or chicken, a handful of groundnuts or a spoon of groundnut butter.' },
  { group: 'veg-fruit', label: 'Fruit and vegetables', examples: 'Pawpaw, banana, orange, mango, avocado, or extra efo, ugu, spinach or okra in your soup. These add little energy but plenty of vitamins and fibre.' },
  { group: 'dairy-fats', label: 'Dairy and healthy fats', examples: 'A pot of plain pasteurised yoghurt or milk, a little vegetable oil in cooking, or a piece of avocado.' },
];

export const EXTRA_MEAL_EXAMPLES: Record<Trimester, string[]> = {
  1: ['You do not need extra energy yet. Eat to appetite, and small frequent meals can help with nausea.'],
  2: [
    'About one extra small snack a day: for example a boiled egg with a slice of bread and a piece of fruit.',
    'Or a modest extra portion at a meal: for example a little more beans with your rice or yam.',
    'Or a pot of plain yoghurt with a handful of groundnuts.',
  ],
  3: [
    'About one extra snack plus a slightly bigger meal portion: for example a bowl of pap with groundnuts, and an extra scoop of beans at dinner.',
    'Or two small snacks: for example a banana with groundnut butter, and a boiled egg with bread.',
    'Or a portion of grilled fish with a small extra helping of yam or plantain and vegetables.',
  ],
};

export interface NeedsResult {
  week: number;
  trimester: Trimester;
  fetuses: Fetuses;
  extraKcal: { low: number; high: number; us: number };
  /** Twins: needs are higher but not set by guidelines. */
  twinNote: string | null;
  drinks: { lowL: number; highL: number; lowCups: number; highCups: number };
  fluidNote: string;
  totalWaterNote: string;
  nutrients: Nutrient[];
  avoid: typeof AVOID;
  mealIdeas: string[];
  foodIdeas: FoodIdea[];
  foodNote: string;
  folicAcidStillAdvised: boolean;
  notes: string[];
}

export function validateNeedsInput(i: NeedsInput): string | null {
  if (!Number.isFinite(i.week) || !Number.isInteger(i.week) || i.week < 1 || i.week > 42) return 'Please enter whole weeks of pregnancy, from 1 to 42.';
  return null;
}

const cups = (l: number) => Math.round((l * 1000) / FLUID.cupMl);

export function pregnancyNeeds(i: NeedsInput): NeedsResult | { error: string } {
  const err = validateNeedsInput(i);
  if (err) return { error: err };
  const trimester = trimesterOf(i.week);
  const extra = EXTRA_KCAL[trimester];
  const add = i.extraFluidFactors ? 0.5 : 0;

  const notes = [
    'These are averages for a healthy woman and a single baby. Your needs depend on your size, activity, health and how you feel.',
    'Eating well matters more than counting calories. Weight gain is a better guide than numbers, and your midwife can help if you are concerned.',
  ];
  if (i.extraFluidFactors) notes.push('Vomiting, hot weather and lots of activity raise your fluid needs. Sip little and often, and ask your midwife or doctor for help if you cannot keep fluids down.');

  return {
    week: i.week,
    trimester,
    fetuses: i.fetuses,
    extraKcal: extra,
    twinNote: i.fetuses === 'twins' ? 'With twins your energy needs are higher, but guidelines do not set an exact figure. Ask your midwife, doctor or a dietitian for a plan for you.' : null,
    drinks: {
      lowL: FLUID.drinksLowL, highL: FLUID.drinksHighL + add,
      lowCups: cups(FLUID.drinksLowL), highCups: cups(FLUID.drinksHighL + add),
    },
    fluidNote: 'All drinks count, including milk, tea, soups and diluted juice, but water is best. Pale yellow urine is a good sign.',
    totalWaterNote: 'Including water from food, guidelines suggest about 2.3 litres (EFSA) to 3 litres (US Institute of Medicine) in total. Roughly 70 to 80 percent comes from drinks.',
    nutrients: NUTRIENTS,
    avoid: AVOID,
    mealIdeas: EXTRA_MEAL_EXAMPLES[trimester],
    foodIdeas: FOOD_IDEAS,
    foodNote: 'Energy in home-cooked food depends on portion size, oil and recipe, so treat these as ideas, not counts. Choose variety rather than empty extras like sugary drinks and fried snacks.',
    folicAcidStillAdvised: i.week <= 12,
    notes,
  };
}

export function kcalLabel(e: { low: number; high: number }): string {
  if (e.high === 0) return 'No extra calories needed';
  if (e.low === 0) return `Up to ${e.high} extra calories a day`;
  return `About ${e.low} to ${e.high} extra calories a day`;
}
