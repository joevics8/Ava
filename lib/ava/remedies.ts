// Remedy type — data now lives in Supabase remedies table
// To add new remedies: INSERT into the remedies table directly
// No code deployment needed

export type { Remedy } from './remedy-engine';

// Condition keyword detector — still used by webhook
export function detectCondition(message: string): string | null {
  const lower = message.toLowerCase();
  const map: Record<string, string> = {
    'leg cramp': 'leg_cramps', 'calf cramp': 'leg_cramps',
    cramp: 'cramps', 'period pain': 'cramps', dysmenorrhea: 'cramps', 'stomach pain': 'cramps',
    bloat: 'bloating', 'water retention': 'water_retention', swollen: 'water_retention', puffy: 'water_retention',
    'back acne': 'acne_body', 'chest acne': 'acne_body', 'body acne': 'acne_body', 'back breakout': 'acne_body',
    acne: 'acne', breakout: 'acne', pimple: 'acne', spot: 'acne', blemish: 'acne',
    mood: 'pms_mood', irritable: 'pms_mood', pms: 'pms_mood', 'mood swing': 'pms_mood',
    'heavy flow': 'heavy_flow', 'heavy period': 'heavy_flow', 'bleeding a lot': 'heavy_flow',
    'breast tender': 'breast_tenderness', 'sore breast': 'breast_tenderness', boob: 'breast_tenderness',
    tired: 'fatigue', fatigue: 'fatigue', exhausted: 'fatigue', 'no energy': 'fatigue',
    'low iron': 'low_iron_fatigue', anemic: 'low_iron_fatigue', anaemia: 'low_iron_fatigue',
    irregular: 'irregular_cycles', pcos: 'irregular_cycles', 'missed period': 'irregular_cycles',
    'short cycle': 'short_cycles', 'cycle is short': 'short_cycles',
    'long cycle': 'long_cycles', 'delayed period': 'long_cycles', 'late period': 'long_cycles',
    sleep: 'sleep', insomnia: 'sleep', "can't sleep": 'sleep',
    'restless leg': 'restless_legs', 'legs won\u2019t stop moving': 'restless_legs',
    'vaginal itch': 'vaginal_itching', itchy: 'vaginal_itching',
    'vaginal dry': 'vaginal_dryness', 'dry down there': 'vaginal_dryness',
    discharge: 'vaginal_health', vaginal: 'vaginal_health',
    'yeast infection': 'yeast_infection_prone', thrush: 'yeast_infection_prone',
    'uti': 'uti_prone', 'urinary tract': 'uti_prone', 'burning when i pee': 'uti_prone',
    'painful sex': 'painful_sex', 'sex hurts': 'painful_sex', 'hurts during sex': 'painful_sex',
    'ovulation pain': 'ovulation_pain', mittelschmerz: 'ovulation_pain',
    headache: 'headaches', migraine: 'migraines',
    'back pain': 'back_pain', 'lower back': 'back_pain',
    nausea: 'nausea', nauseous: 'nausea', 'feel sick': 'nausea',
    diarrhea: 'digestive_changes', diarrhoea: 'digestive_changes', constipated: 'digestive_changes', constipation: 'digestive_changes',
    craving: 'food_cravings', 'want chocolate': 'food_cravings', 'want sugar': 'food_cravings',
    libido: 'low_libido', 'sex drive': 'low_libido',
    anxious: 'anxiety', anxiety: 'anxiety', panicky: 'anxiety',
    'brain fog': 'brain_fog', 'can\u2019t focus': 'brain_fog', 'cant focus': 'brain_fog', 'can\u2019t concentrate': 'brain_fog',
    'joint pain': 'joint_muscle_pain', 'muscle ache': 'joint_muscle_pain', achy: 'joint_muscle_pain',
    'hot flash': 'hot_flashes', 'hot flush': 'hot_flashes',
    dizzy: 'dizziness', lightheaded: 'dizziness',
    'hair loss': 'hair_thinning', 'hair thinning': 'hair_thinning', 'losing hair': 'hair_thinning', shedding: 'hair_thinning',
    'dry skin': 'dry_skin',
    'oily skin': 'oily_skin', greasy: 'oily_skin',
    'blood clot': 'period_clots', clot: 'period_clots',
    spotting: 'spotting', 'spotting between periods': 'spotting',
    'binge eat': 'emotional_eating', 'emotional eating': 'emotional_eating', 'stress eat': 'emotional_eating',
    overwhelmed: 'stress_overwhelm', stressed: 'stress_overwhelm', 'so much pressure': 'stress_overwhelm',
    'really low': 'severe_mood_dips', pmdd: 'severe_mood_dips', 'mood crash': 'severe_mood_dips',
    'period smell': 'period_odor', 'period odor': 'period_odor', 'smell bad': 'period_odor',
    'sensitive skin': 'sensitive_skin', 'skin flare': 'sensitive_skin', rash: 'sensitive_skin',
    'cold hands': 'cold_hands_feet', 'cold feet': 'cold_hands_feet',
    thirsty: 'increased_thirst', 'so thirsty': 'increased_thirst',
    'period flu': 'period_flu', 'body aches and chills': 'period_flu', chills: 'period_flu',
    'pelvic pressure': 'pelvic_pressure', 'pelvic heaviness': 'pelvic_pressure', heaviness: 'pelvic_pressure',
    'everything hurts more': 'increased_pain_sensitivity', 'more sensitive to pain': 'increased_pain_sensitivity',
  };

  for (const [keyword, cond] of Object.entries(map)) {
    if (lower.includes(keyword)) return cond;
  }
  return null;
}
