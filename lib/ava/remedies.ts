export interface Remedy {
  id: string;
  name: string;
  condition: string;
  conditionLabel: string;
  description: string;
  instructions: string;
  timing: string; // when in cycle to use
  trackingNote: string; // what to watch for
  evidence: string; // why it works
  caution?: string;
}

export const REMEDIES: Remedy[] = [
  // ── 1. Period Cramps ───────────────────────────────────────────────────────
  {
    id: 'ginger_tea_cramps',
    name: 'Ginger Tea',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'Ginger is a natural anti-inflammatory that blocks prostaglandins — the same chemicals ibuprofen targets. Studies show 250mg of ginger is as effective as ibuprofen for period pain.',
    instructions: 'Slice 1 inch of fresh ginger. Boil in 2 cups of water for 10 minutes. Add honey and lemon. Drink 2-3 cups daily during the first 3 days of your period.',
    timing: 'Start 2 days before your period and continue through day 3.',
    trackingNote: 'Notice if cramp intensity or duration reduces after 2-3 cycles.',
    evidence: 'Prostaglandin inhibitor — same mechanism as NSAIDs, gentler on the stomach.',
    caution: 'Avoid in excess if on blood thinners.',
  },
  {
    id: 'heat_therapy_cramps',
    name: 'Heat Therapy',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'A hot water bottle applied to the lower abdomen has been shown in clinical trials to be as effective as ibuprofen for period cramps. It works by relaxing the uterine muscle.',
    instructions: 'Fill a hot water bottle (not scalding). Place on your lower abdomen for 20-30 minutes at a time. You can also use a warm towel or heat patch.',
    timing: 'Use on days 1-3 of your period when cramps are worst.',
    trackingNote: 'Log how quickly the cramps ease after applying heat.',
    evidence: 'Heat relaxes smooth muscle and increases blood flow, directly reducing uterine spasms.',
  },
  {
    id: 'magnesium_cramps',
    name: 'Magnesium (Food or Supplement)',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'Magnesium deficiency is strongly linked to painful periods. It relaxes uterine muscle contractions and has anti-inflammatory effects.',
    instructions: 'Take 250-350mg magnesium glycinate daily (gentlest form, least laxative). Or eat magnesium-rich foods: dark chocolate, almonds, spinach, pumpkin seeds, avocado.',
    timing: 'Start in the second half of your cycle (luteal phase) and continue through your period.',
    trackingNote: 'Track cramp intensity and duration each cycle.',
    evidence: 'Uterine muscle relaxant. Magnesium blocks calcium uptake, reducing muscle contractions.',
  },

  // ── 2. PMS & Mood Swings ───────────────────────────────────────────────────
  {
    id: 'b6_pms_mood',
    name: 'Vitamin B6-Rich Foods',
    condition: 'pms_mood',
    conditionLabel: 'PMS & Mood',
    description: 'Vitamin B6 is involved in serotonin and dopamine production. Low B6 is associated with depression, irritability, and mood swings in the luteal phase.',
    instructions: 'Eat B6-rich foods daily: bananas, chickpeas, salmon, potatoes, sunflower seeds, pistachio nuts. Alternatively, take a B-complex supplement with 50mg B6.',
    timing: 'Increase intake in the 2 weeks before your period.',
    trackingNote: 'Log mood scores each day. Look for reduced irritability and low mood after 2 cycles.',
    evidence: 'B6 is a cofactor in serotonin synthesis. Studies show 50-100mg/day significantly reduces PMS mood symptoms.',
    caution: 'Do not exceed 100mg/day from supplements long-term — high doses can cause nerve issues.',
  },
  {
    id: 'reduce_caffeine_pms',
    name: 'Cut Caffeine Before Period',
    condition: 'pms_mood',
    conditionLabel: 'PMS & Mood',
    description: 'Caffeine increases cortisol and adrenaline, which worsens PMS anxiety, irritability, and breast tenderness. Many women find this single change dramatically reduces PMS severity.',
    instructions: 'In the 7-10 days before your period, reduce coffee and tea to one cup daily or switch to decaf. Avoid energy drinks entirely. Try chamomile or spearmint tea instead.',
    timing: 'Luteal phase (roughly 14 days before your period).',
    trackingNote: 'Note anxiety levels, irritability, and breast tenderness each day.',
    evidence: 'Caffeine stimulates the adrenal glands and blocks adenosine receptors — both worsen PMS symptoms.',
  },

  // ── 3. Bloating ────────────────────────────────────────────────────────────
  {
    id: 'peppermint_tea_bloating',
    name: 'Peppermint Tea',
    condition: 'bloating',
    conditionLabel: 'Bloating',
    description: 'Menthol in peppermint relaxes the smooth muscle of the gut, reducing gas, cramping, and bloating. It works within 30-60 minutes.',
    instructions: 'Brew 1-2 peppermint tea bags in hot water for 5 minutes. Drink 2-3 cups daily in the days before and during your period. Can also take enteric-coated peppermint oil capsules.',
    timing: 'Start 3-5 days before your period when bloating usually begins.',
    trackingNote: 'Rate bloating on a scale of 1-10 each morning.',
    evidence: 'Antispasmodic effect on intestinal smooth muscle, well-documented in IBS and functional bloating research.',
    caution: 'Avoid if you have acid reflux — peppermint relaxes the lower oesophageal sphincter.',
  },
  {
    id: 'reduce_sodium_bloating',
    name: 'Low-Sodium Days Before Period',
    condition: 'bloating',
    conditionLabel: 'Bloating',
    description: 'Oestrogen and progesterone fluctuations cause the body to retain sodium and water before your period. Cutting salt for 3-5 days before your period noticeably reduces water retention and bloating.',
    instructions: 'Avoid processed foods, canned foods, soy sauce, and added salt in the 5 days before your period. Cook fresh food at home. Drink more water — counterintuitively, this helps flush sodium out.',
    timing: '5 days before your expected period start.',
    trackingNote: 'Compare how your clothes fit and note abdominal fullness in the days before your period.',
    evidence: 'Progesterone activates aldosterone receptors, causing sodium retention. Reducing dietary sodium directly offsets this.',
  },

  // ── 4. Cycle-Related Acne ──────────────────────────────────────────────────
  {
    id: 'spearmint_tea_acne',
    name: 'Spearmint Tea',
    condition: 'acne',
    conditionLabel: 'Cycle Acne',
    description: 'Spearmint has clinically proven anti-androgenic properties — it lowers free testosterone, which drives hormonal acne. Two cups a day for 30 days shows significant reduction in acne.',
    instructions: 'Brew 1 tsp dried spearmint (or 1 tea bag) in hot water for 5-7 minutes. Drink 2 cups daily — morning and evening. Use consistently for at least 30 days before assessing.',
    timing: 'Daily, ongoing. Effects compound over time.',
    trackingNote: 'Count and photograph breakouts at the same time each month. Expect 4-6 weeks before visible improvement.',
    evidence: 'Randomised controlled trials show spearmint reduces free testosterone and LH. Anti-androgenic effect reduces sebum production.',
    caution: 'Not recommended if trying to conceive — may affect LH levels.',
  },
  {
    id: 'zinc_acne',
    name: 'Zinc (Food or Supplement)',
    condition: 'acne',
    conditionLabel: 'Cycle Acne',
    description: 'Zinc is one of the most studied natural treatments for acne. It reduces inflammation, inhibits the bacteria that causes acne, and regulates oil production.',
    instructions: 'Take 25-30mg zinc picolinate or zinc bisglycinate daily with food (these forms are best absorbed). Zinc-rich foods: pumpkin seeds, oysters, beef, lentils, hemp seeds.',
    timing: 'Daily. Take with food to avoid nausea.',
    trackingNote: 'Track breakout frequency and severity each week.',
    evidence: 'Multiple RCTs show zinc is effective for acne, comparable to low-dose antibiotics in some studies.',
    caution: 'Long-term supplementation above 40mg/day can deplete copper. Take a copper supplement if using long-term.',
  },

  // ── 5. Heavy Flow ──────────────────────────────────────────────────────────
  {
    id: 'shepherd_purse_heavy_flow',
    name: "Shepherd's Purse Tea",
    condition: 'heavy_flow',
    conditionLabel: 'Heavy Flow',
    description: "Shepherd's purse is a traditional herb used for centuries to reduce heavy uterine bleeding. It contains compounds that cause uterine contractions and has natural astringent properties.",
    instructions: "Steep 1-2 tsp dried shepherd's purse herb in hot water for 10 minutes. Drink 1-2 cups on heavy flow days. Available from health food stores and online.",
    timing: 'Use on heavy flow days only (typically days 1-2).',
    trackingNote: 'Count pads/tampons used per day. Log if flow feels lighter after 2-3 cycles.',
    evidence: "Contains flavonoids and tyramine that stimulate uterine muscle tone and reduce bleeding. Used in European herbal medicine.",
    caution: 'Avoid in pregnancy. Consult a doctor if heavy flow is new or worsening.',
  },

  // ── 6. Breast Tenderness ───────────────────────────────────────────────────
  {
    id: 'evening_primrose_breast',
    name: 'Evening Primrose Oil',
    condition: 'breast_tenderness',
    conditionLabel: 'Breast Tenderness',
    description: 'Evening primrose oil contains GLA (gamma-linolenic acid), which modulates the inflammatory pathways that cause cyclical breast pain. Studies show it significantly reduces cyclical mastalgia.',
    instructions: 'Take 1000-3000mg evening primrose oil daily. Capsules available at pharmacies. Needs 3 months of consistent use to see full benefit.',
    timing: 'Daily throughout the cycle. Can double the dose in the luteal phase.',
    trackingNote: 'Rate breast tenderness on a scale of 1-10 in the week before each period.',
    evidence: "Multiple clinical trials show EPO reduces cyclical breast pain. It corrects an abnormal fatty acid profile found in women with mastalgia.",
    caution: 'May slightly increase bleeding risk. Avoid before surgery.',
  },

  // ── 7. Fatigue ─────────────────────────────────────────────────────────────
  {
    id: 'iron_foods_fatigue',
    name: 'Iron-Rich Foods During Period',
    condition: 'fatigue',
    conditionLabel: 'Period Fatigue',
    description: 'Blood loss during menstruation depletes iron, causing fatigue and brain fog. Eating iron-rich foods during and after your period helps restore levels without needing supplements.',
    instructions: 'During and after your period, eat: spinach, lentils, red meat, tofu, pumpkin seeds, fortified cereals. Always pair with vitamin C (orange juice, bell peppers) to double absorption. Avoid tea/coffee with iron-rich meals — tannins block absorption.',
    timing: 'Days 1-7 of your cycle (during and just after period).',
    trackingNote: 'Note energy levels on a scale of 1-10 during your period vs. the previous cycle.',
    evidence: "Menstrual blood loss is the most common cause of iron deficiency in women. Restoring dietary iron directly improves energy, focus, and mood.",
  },

  // ── 8. Irregular Cycles / PCOS ─────────────────────────────────────────────
  {
    id: 'cinnamon_irregular',
    name: 'Ceylon Cinnamon',
    condition: 'irregular_cycles',
    conditionLabel: 'Irregular Cycles',
    description: 'Ceylon cinnamon improves insulin sensitivity, which is a key driver of irregular cycles, especially in PCOS. It can help restore more regular ovulation over time.',
    instructions: 'Add 1/2 tsp Ceylon cinnamon (not Cassia — check the label) to oatmeal, yogurt, or smoothies daily. Or stir into warm water. Use consistently for at least 2-3 months.',
    timing: 'Daily, with food.',
    trackingNote: 'Track cycle length each month. Expect improvement after 2-3 months of consistent use.',
    evidence: 'Randomised studies show cinnamon extract improves menstrual regularity in PCOS. It sensitises insulin receptors and lowers fasting insulin.',
    caution: 'Use Ceylon cinnamon (true cinnamon), not Cassia — high Cassia intake long-term can affect the liver.',
  },

  // ── 9. PMS / Sleep ────────────────────────────────────────────────────────
  {
    id: 'magnesium_sleep',
    name: 'Magnesium Glycinate for Sleep',
    condition: 'sleep',
    conditionLabel: 'Sleep Disruption',
    description: 'Magnesium glycinate is the most bioavailable and sleep-friendly form of magnesium. It activates GABA receptors, calming the nervous system. Sleep disruption in the luteal phase is very common and magnesium directly addresses it.',
    instructions: 'Take 200-400mg magnesium glycinate 30-60 minutes before bed. Available at pharmacies. Start with 200mg and increase if needed. May cause vivid dreams initially — this is normal and passes.',
    timing: 'Nightly, especially in the 2 weeks before your period.',
    trackingNote: 'Rate sleep quality each morning (1-10). Track how long it takes to fall asleep.',
    evidence: 'Magnesium activates the parasympathetic nervous system and GABA receptors. Multiple studies confirm it improves sleep onset, duration, and quality.',
  },

  // ── 10. Discharge / Vaginal Health ────────────────────────────────────────
  {
    id: 'probiotic_vaginal_health',
    name: 'Probiotic Foods for Vaginal Health',
    condition: 'vaginal_health',
    conditionLabel: 'Vaginal Health',
    description: 'Lactobacillus bacteria maintain a healthy vaginal microbiome and normal discharge patterns. Eating probiotic-rich foods supports this naturally.',
    instructions: 'Eat daily: plain yogurt with live cultures, kefir, kimchi, or sauerkraut. Avoid douching and heavily fragranced soaps. Wear breathable cotton underwear. If discharge changes are persistent or concerning, see a doctor.',
    timing: 'Daily ongoing.',
    trackingNote: 'Note if discharge texture/colour changes over the cycle. Track any improvement in comfort or unusual symptoms.',
    evidence: 'Lactobacillus-dominant vaginal microbiome associated with lower rates of BV, yeast infections, and UTIs. Oral probiotics colonise the vaginal tract.',
    caution: 'Unusual discharge, odour, or colour changes warrant a doctor visit — not just home remedies.',
  },
];

// ─── Get remedies for a condition ─────────────────────────────────────────────

export function getRemediesForCondition(condition: string): Remedy[] {
  return getAllRemedies().filter(r => r.condition === condition);
}

// ─── Detect condition from message ────────────────────────────────────────────

export function detectCondition(message: string): string | null {
  const lower = message.toLowerCase();
  const map: Record<string, string> = {
    cramp: 'cramps', 'period pain': 'cramps', dysmenorrhea: 'cramps',
    bloat: 'bloating', 'water retention': 'bloating', swollen: 'bloating',
    acne: 'acne', breakout: 'acne', pimple: 'acne', spot: 'acne',
    mood: 'pms_mood', irritable: 'pms_mood', pms: 'pms_mood', 'mood swing': 'pms_mood', anxious: 'pms_mood',
    'heavy flow': 'heavy_flow', 'heavy period': 'heavy_flow', 'heavy bleed': 'heavy_flow',
    'breast tender': 'breast_tenderness', 'sore breast': 'breast_tenderness', 'boob': 'breast_tenderness',
    tired: 'fatigue', fatigue: 'fatigue', exhausted: 'fatigue', 'no energy': 'fatigue',
    irregular: 'irregular_cycles', pcos: 'irregular_cycles', 'missed period': 'irregular_cycles',
    sleep: 'sleep', insomnia: 'sleep', "can't sleep": 'sleep',
    discharge: 'vaginal_health', 'vaginal': 'vaginal_health',
  };

  for (const [keyword, condition] of Object.entries(map)) {
    if (lower.includes(keyword)) return condition;
  }
  return null;
}

// ─── Format remedy for Telegram ───────────────────────────────────────────────

export function formatRemedy(remedy: Remedy): string {
  return (
    `🌿 *${remedy.name}* for ${remedy.conditionLabel}\n\n` +
    `${remedy.description}\n\n` +
    `*How to use:*\n${remedy.instructions}\n\n` +
    `*When:* ${remedy.timing}\n\n` +
    `*What to watch:* ${remedy.trackingNote}` +
    (remedy.caution ? `\n\n⚠️ *Note:* ${remedy.caution}` : '')
  );
}

// ─── Extended remedies (added batch 2) ───────────────────────────────────────

export const EXTENDED_REMEDIES: Remedy[] = [
  // ── More Cramp Remedies ───────────────────────────────────────────────────
  {
    id: 'raspberry_leaf_cramps',
    name: 'Raspberry Leaf Tea',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'Red raspberry leaf has been used for centuries as a uterine tonic. It contains fragarine, a compound that tones and relaxes uterine muscles, potentially reducing cramping intensity.',
    instructions: 'Steep 1-2 tsp dried raspberry leaf in hot water for 10-15 minutes. Drink 1-3 cups daily. Best started 1-2 weeks before your period.',
    timing: 'Start 1-2 weeks before your period, continue through day 3.',
    trackingNote: 'Note cramp intensity (1-10) each cycle.',
    evidence: 'Contains fragarine alkaloid that tones smooth muscle. Long traditional use with growing modern evidence.',
  },
  {
    id: 'omega3_cramps',
    name: 'Omega-3 Rich Foods',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'Omega-3 fatty acids reduce the production of prostaglandins — the inflammatory compounds that cause period pain. Studies show fish oil supplementation significantly reduces menstrual pain.',
    instructions: 'Eat fatty fish 2-3x per week: salmon, sardines, mackerel, tuna. Or take 1-2g fish oil/krill oil daily. Walnuts, chia seeds, and flaxseed also help.',
    timing: 'Daily throughout the cycle for best results.',
    trackingNote: 'Compare cramp severity over 2-3 cycles of consistent use.',
    evidence: 'RCT shows omega-3 reduces prostaglandin production, directly reducing uterine contractions and pain.',
  },
  {
    id: 'turmeric_cramps',
    name: 'Turmeric Golden Milk',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'Curcumin in turmeric is a powerful anti-inflammatory that inhibits prostaglandin synthesis, reducing cramping and inflammation.',
    instructions: 'Mix 1 tsp turmeric, 1/4 tsp black pepper (essential for absorption), 1 tsp honey into warm milk or plant milk. Drink 1-2 cups daily during your period.',
    timing: 'Start 2 days before your period.',
    trackingNote: 'Rate pain intensity on days 1-3 of your period.',
    evidence: 'Curcumin inhibits COX-2 and NF-kB pathways — same targets as ibuprofen. Black pepper increases absorption by 2000%.',
  },
  {
    id: 'castor_oil_cramps',
    name: 'Castor Oil Pack',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'Castor oil applied externally to the lower abdomen reduces inflammation and improves lymphatic circulation in the pelvic area. Traditional naturopathic remedy with growing evidence.',
    instructions: 'Soak a cloth in warm castor oil. Place on your lower abdomen. Cover with plastic wrap and apply a heat pad on top for 45-60 minutes. Do this on days 1-2 of your period.',
    timing: 'Days 1-2 of your period when pain peaks.',
    trackingNote: 'Rate pain before and after each application.',
    evidence: 'Ricinoleic acid in castor oil has anti-inflammatory properties and may improve circulation when applied topically.',
    caution: 'Do not use internally. Avoid if pregnant.',
  },
  {
    id: 'yoga_cramps',
    name: 'Period Yoga Poses',
    condition: 'cramps',
    conditionLabel: 'Period Cramps',
    description: 'Specific yoga poses relieve uterine tension, improve pelvic blood flow, and activate the parasympathetic nervous system — reducing cramp severity naturally.',
    instructions: 'Try: Child\'s pose (3 min), supine twist (2 min each side), reclined butterfly (5 min). Do these gently on crampy days. Avoid inversions during heavy flow.',
    timing: 'Any time during your period when cramps are present.',
    trackingNote: 'Rate cramp relief 15 minutes after practice.',
    evidence: 'Studies show yoga reduces menstrual pain severity and duration. Parasympathetic activation reduces smooth muscle spasms.',
  },

  // ── More PMS & Mood Remedies ──────────────────────────────────────────────
  {
    id: 'chasteberry_pms',
    name: 'Chasteberry (Vitex)',
    condition: 'pms_mood',
    conditionLabel: 'PMS & Mood',
    description: 'Chasteberry (Vitex agnus-castus) is the most researched herbal treatment for PMS. It acts on the pituitary gland to balance progesterone and oestrogen, reducing PMS symptoms over time.',
    instructions: 'Take 20-40mg standardised chasteberry extract daily. Allow 3 months for full effect — this works on the hormonal cycle. Available as capsules at health stores.',
    timing: 'Daily, consistently. Takes 2-3 cycles to notice effect.',
    trackingNote: 'Log PMS severity (mood, breast tenderness, bloating) monthly.',
    evidence: 'Multiple RCTs show chasteberry reduces PMS by 50% or more, particularly mood, breast tenderness, and irritability.',
    caution: 'Avoid if on hormonal contraception, dopamine medications, or if trying to conceive.',
  },
  {
    id: 'magnesium_pms_mood',
    name: 'Magnesium for PMS Mood',
    condition: 'pms_mood',
    conditionLabel: 'PMS & Mood',
    description: 'Low magnesium is directly linked to PMS mood symptoms. Magnesium regulates neurotransmitters and the stress response. Supplementing in the luteal phase specifically targets PMS.',
    instructions: 'Take 250-400mg magnesium glycinate or magnesium malate daily. Start on day 15 of your cycle and continue until your period arrives.',
    timing: 'Luteal phase only (day 15 to period start).',
    trackingNote: 'Rate mood, irritability, and anxiety in the week before each period.',
    evidence: 'Studies show magnesium supplementation reduces psychological PMS symptoms including anxiety, depression, and irritability.',
  },
  {
    id: 'st_johns_wort_pms',
    name: "St John's Wort",
    condition: 'pms_mood',
    conditionLabel: 'PMS & Mood',
    description: "St John's Wort has good clinical evidence for mild to moderate depression and mood disturbance. For PMS-related mood symptoms it can be effective taken consistently.",
    instructions: "Take 300mg standardised extract (0.3% hypericin) three times daily. Available at pharmacies. Takes 4-6 weeks to notice benefit.",
    timing: 'Daily throughout the month.',
    trackingNote: 'Keep a daily mood log rating 1-10. Compare weeks 1-2 vs weeks 3-4.',
    evidence: 'Cochrane review confirms efficacy for mild-moderate depression. Small RCT specifically for PMS shows significant mood improvement.',
    caution: 'Interacts with many medications including the contraceptive pill, antidepressants, and anticoagulants. Check with a pharmacist.',
  },

  // ── More Bloating Remedies ────────────────────────────────────────────────
  {
    id: 'fennel_tea_bloating',
    name: 'Fennel Seed Tea',
    condition: 'bloating',
    conditionLabel: 'Bloating',
    description: 'Fennel seeds contain anethole, a compound that relaxes intestinal smooth muscle and reduces gas and bloating. Works within 30-60 minutes.',
    instructions: 'Crush 1 tsp fennel seeds lightly. Steep in boiling water for 10 minutes. Drink after meals or when bloating is present. Can chew raw seeds directly after meals.',
    timing: 'After meals and as needed in the days before your period.',
    trackingNote: 'Rate bloating severity before and 1 hour after taking.',
    evidence: 'Antispasmodic and carminative (gas-relieving) properties well documented. Anethole relaxes gut smooth muscle.',
  },
  {
    id: 'dandelion_tea_bloating',
    name: 'Dandelion Leaf Tea',
    condition: 'bloating',
    conditionLabel: 'Bloating',
    description: 'Dandelion leaf is a natural, gentle diuretic that helps eliminate excess water without depleting potassium. Specifically useful for premenstrual water retention.',
    instructions: 'Steep 1-2 tsp dried dandelion leaf (not root) in hot water for 10 minutes. Drink 1-2 cups in the 3-4 days before your period. Available from health food stores.',
    timing: '3-5 days before your period when water retention peaks.',
    trackingNote: 'Note how puffy/swollen you feel in the mornings before vs after.',
    evidence: 'Clinical study shows dandelion leaf significantly increases urinary frequency without electrolyte imbalance. Replaces pharmaceutical diuretics safely.',
    caution: 'Avoid if allergic to ragweed family plants.',
  },
  {
    id: 'probiotics_bloating',
    name: 'Daily Probiotic',
    condition: 'bloating',
    conditionLabel: 'Bloating',
    description: 'Gut microbiome imbalance worsens bloating throughout the cycle. Hormonal changes affect gut motility — a good probiotic stabilises this.',
    instructions: 'Take a probiotic with at least 10 billion CFU daily containing Lactobacillus acidophilus and Bifidobacterium strains. Take with breakfast. Continue for at least 4 weeks.',
    timing: 'Daily, ongoing.',
    trackingNote: 'Rate daily bloating severity 1-10 for 2 months.',
    evidence: 'Studies show specific Lactobacillus and Bifidobacterium strains reduce bloating and gut discomfort. Gut bacteria directly metabolise oestrogen.',
  },

  // ── More Acne Remedies ────────────────────────────────────────────────────
  {
    id: 'green_tea_acne',
    name: 'Green Tea (Drink + Topical)',
    condition: 'acne',
    conditionLabel: 'Cycle Acne',
    description: 'Green tea contains EGCG, a powerful antioxidant that reduces sebum production and has anti-bacterial effects against acne-causing bacteria. Both drinking and applying topically work.',
    instructions: 'Drink 2-3 cups of green tea daily. For topical use: brew strong green tea, let cool, apply to face with cotton pad as a toner after cleansing. Leave on — do not rinse.',
    timing: 'Daily. Topical use morning and evening.',
    trackingNote: 'Count active breakouts weekly and photograph.',
    evidence: 'EGCG inhibits 5-alpha reductase (reduces androgen activity on skin) and has direct antibacterial effect on P. acnes.',
  },
  {
    id: 'avoid_dairy_acne',
    name: 'Dairy-Free Before Ovulation',
    condition: 'acne',
    conditionLabel: 'Cycle Acne',
    description: 'Dairy raises IGF-1 (insulin-like growth factor) which directly stimulates sebum production and acne. The effect is strongest around ovulation when androgens peak.',
    instructions: 'Cut out milk, cheese, yogurt, and whey protein for 2 weeks around ovulation (days 10-16 of your cycle). Replace with oat milk, coconut yogurt, and plant-based alternatives.',
    timing: 'Days 8-18 of your cycle.',
    trackingNote: 'Track breakout frequency in this window vs when you consume dairy.',
    evidence: 'Multiple large epidemiological studies link dairy consumption to acne. IGF-1 pathway is well-established in acne pathogenesis.',
  },
  {
    id: 'ice_acne',
    name: 'Ice Cube Spot Treatment',
    condition: 'acne',
    conditionLabel: 'Cycle Acne',
    description: 'Applying ice directly to a developing spot constricts blood vessels, reduces inflammation and swelling, and can stop a spot before it fully forms.',
    instructions: 'Wrap an ice cube in a clean cloth. Hold on the spot for 1-2 minutes. Repeat 3-4 times per day on new or developing spots. Never apply ice directly to skin without a cloth.',
    timing: 'As soon as you notice a spot forming.',
    trackingNote: 'Notice if spots resolve faster or smaller with consistent icing.',
    evidence: 'Cold therapy (cryotherapy) constricts blood vessels, reduces inflammatory cytokines locally, and limits spot development.',
  },

  // ── More Fatigue Remedies ─────────────────────────────────────────────────
  {
    id: 'ashwagandha_fatigue',
    name: 'Ashwagandha',
    condition: 'fatigue',
    conditionLabel: 'Period Fatigue',
    description: 'Ashwagandha is an adaptogen that lowers cortisol, reduces stress-related fatigue, and improves stamina. Particularly helpful for fatigue that comes with PMS or throughout the cycle.',
    instructions: 'Take 300-600mg KSM-66 or Sensoril ashwagandha extract daily with food. Best taken in the morning. Takes 4-8 weeks of consistent use for full effect.',
    timing: 'Daily, ongoing.',
    trackingNote: 'Rate energy levels 1-10 each morning for 2 months.',
    evidence: 'Multiple RCTs show ashwagandha reduces cortisol by up to 30% and significantly improves energy, endurance, and quality of life.',
    caution: 'Avoid in thyroid conditions without doctor guidance. Not for use in pregnancy.',
  },
  {
    id: 'b12_fatigue',
    name: 'Vitamin B12-Rich Foods',
    condition: 'fatigue',
    conditionLabel: 'Period Fatigue',
    description: 'B12 is essential for red blood cell formation and energy metabolism. B12 deficiency is common, especially in vegetarians and vegans, and directly causes fatigue and brain fog.',
    instructions: 'Eat B12-rich foods daily: eggs, dairy, meat, fish, nutritional yeast (for vegans). If vegetarian or vegan, take a B12 supplement — 1000mcg methylcobalamin sublingually is best absorbed.',
    timing: 'Daily.',
    trackingNote: 'Note energy levels and brain fog over 4-6 weeks.',
    evidence: 'B12 is rate-limiting for red blood cell production. Deficiency causes megaloblastic anaemia and fatigue that can be severe.',
  },

  // ── More PCOS / Irregular Cycles ──────────────────────────────────────────
  {
    id: 'inositol_pcos',
    name: 'Myo-Inositol',
    condition: 'irregular_cycles',
    conditionLabel: 'Irregular Cycles',
    description: 'Myo-inositol is the most evidence-backed supplement for PCOS. It improves insulin sensitivity, reduces androgens, and restores ovulation. Often called "nature\'s metformin".',
    instructions: 'Take 2-4g myo-inositol powder daily (mix in water or juice). Best taken with 200mcg folic acid. Available online and at health stores. Takes 3 months minimum.',
    timing: 'Daily, consistently.',
    trackingNote: 'Track cycle length monthly. Also note acne, hair, and mood changes.',
    evidence: 'Multiple RCTs show myo-inositol restores regular ovulation in 70%+ of PCOS patients, reduces testosterone, and improves insulin markers.',
  },
  {
    id: 'low_gi_pcos',
    name: 'Low-Glycaemic Eating',
    condition: 'irregular_cycles',
    conditionLabel: 'Irregular Cycles',
    description: 'Insulin resistance drives PCOS and irregular cycles. Eating low-GI foods keeps insulin levels stable, directly reducing androgen production and supporting ovulation.',
    instructions: 'Replace white rice, white bread, and sugary foods with: brown rice, oats, sweet potato, lentils, beans, vegetables. Eat protein with every meal. Avoid skipping meals.',
    timing: 'Daily lifestyle change.',
    trackingNote: 'Track cycle length and note any improvements in skin, hair, or energy over 3 months.',
    evidence: 'Low-GI diet reduces fasting insulin and free testosterone in PCOS. Insulin drives ovarian androgen production — reducing it restores ovulation.',
  },

  // ── More Sleep Remedies ───────────────────────────────────────────────────
  {
    id: 'chamomile_sleep',
    name: 'Chamomile Tea',
    condition: 'sleep',
    conditionLabel: 'Sleep Disruption',
    description: 'Chamomile contains apigenin, a compound that binds to GABA receptors in the brain — the same receptors targeted by sleep medications, but gently and without dependency.',
    instructions: 'Brew 1-2 chamomile tea bags in hot water for 5-10 minutes. Drink 30-45 minutes before bed. Add honey if desired. Avoid caffeine after 2pm for best results.',
    timing: '30-45 minutes before bedtime, especially in the luteal phase.',
    trackingNote: 'Rate sleep quality each morning and time to fall asleep.',
    evidence: 'Clinical study shows chamomile extract significantly improves sleep quality. Apigenin is a partial benzodiazepine receptor agonist.',
  },
  {
    id: 'tart_cherry_sleep',
    name: 'Tart Cherry Juice',
    condition: 'sleep',
    conditionLabel: 'Sleep Disruption',
    description: "Tart cherries are one of the few natural food sources of melatonin. Studies show drinking tart cherry juice increases sleep time and quality, particularly useful when cycles disrupt sleep.",
    instructions: 'Drink 240ml (1 cup) of tart cherry juice in the morning and another cup 1-2 hours before bed. Use unsweetened pure tart cherry juice, not cordial.',
    timing: 'Morning and evening, during luteal phase when sleep is most disrupted.',
    trackingNote: 'Track total sleep time and how refreshed you feel each morning.',
    evidence: 'RCT shows tart cherry juice increases sleep time by 84 minutes and improves sleep efficiency. Contains melatonin and tryptophan.',
  },

  // ── More Heavy Flow Remedies ──────────────────────────────────────────────
  {
    id: 'vitamin_c_heavy_flow',
    name: 'Vitamin C',
    condition: 'heavy_flow',
    conditionLabel: 'Heavy Flow',
    description: 'Vitamin C helps strengthen capillary walls and reduces oestrogen levels slightly, which can reduce heavy menstrual bleeding over time. Also aids iron absorption.',
    instructions: 'Take 1000-2000mg vitamin C daily, split into two doses. Eat vitamin C rich foods: bell peppers, citrus fruit, kiwi, strawberries. Start 5 days before your period.',
    timing: 'Start 5 days before your period and continue through your period.',
    trackingNote: 'Count number of pads/tampons used per day across cycles.',
    evidence: 'Vitamin C reduces capillary fragility and supports collagen in blood vessel walls. Also helps reduce oestrogen dominance which drives heavy flow.',
    caution: 'High doses may cause loose stools. Reduce dose if this occurs.',
  },
  {
    id: 'yarrow_tea_heavy_flow',
    name: 'Yarrow Tea',
    condition: 'heavy_flow',
    conditionLabel: 'Heavy Flow',
    description: 'Yarrow (Achillea millefolium) is a traditional astringent herb used to reduce heavy bleeding. It contains flavonoids that promote blood clotting and reduce flow.',
    instructions: 'Steep 1-2 tsp dried yarrow in hot water for 10-15 minutes. Drink 1-2 cups daily on heavy flow days. Available from herbalists and health stores.',
    timing: 'Days 1-3 of your period when flow is heaviest.',
    trackingNote: 'Log number of pads/tampons per day.',
    evidence: 'Traditional European and Native American medicine for heavy bleeding. Contains achilleine which promotes haemostasis.',
    caution: 'Avoid in pregnancy. May cause allergic reaction in those sensitive to the Asteraceae family.',
  },

  // ── More Breast Tenderness Remedies ──────────────────────────────────────
  {
    id: 'vitamin_e_breast',
    name: 'Vitamin E',
    condition: 'breast_tenderness',
    conditionLabel: 'Breast Tenderness',
    description: 'Vitamin E has anti-inflammatory and antioxidant properties that reduce cyclical breast pain. Studies specifically show benefit for premenstrual breast tenderness.',
    instructions: 'Take 400 IU vitamin E (d-alpha tocopherol, natural form) daily. Food sources: sunflower seeds, almonds, avocado, olive oil. Start supplementing 2 weeks before your period.',
    timing: 'Daily, increasing to twice daily in luteal phase.',
    trackingNote: 'Rate breast tenderness on days 22-28 of your cycle.',
    evidence: 'Controlled study shows 400 IU vitamin E significantly reduces cyclical mastalgia. Antioxidant effect on breast tissue lipids.',
  },
  {
    id: 'cold_cabbage_breast',
    name: 'Cold Cabbage Leaf Compress',
    condition: 'breast_tenderness',
    conditionLabel: 'Breast Tenderness',
    description: 'Cold cabbage leaves have been used for centuries for breast engorgement and tenderness. Cabbage contains sinigrin and rapine, compounds with natural anti-inflammatory properties absorbed through the skin.',
    instructions: 'Take a cabbage leaf from the fridge. Remove the thick vein so it lies flat. Place on each breast for 20-30 minutes, 2-3 times a day. Replace when it warms up.',
    timing: 'In the week before your period when tenderness is worst.',
    trackingNote: 'Rate breast tenderness before and after each application.',
    evidence: 'Studies on breastfeeding engorgement show significant pain reduction. Anti-inflammatory glucosinolates absorbed transdermally.',
  },
];

// Merge into main REMEDIES array at runtime
export function getAllRemedies(): Remedy[] {
  return [...REMEDIES, ...EXTENDED_REMEDIES];
}
