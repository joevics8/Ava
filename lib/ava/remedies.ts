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
  return REMEDIES.filter(r => r.condition === condition);
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
