// Remedy type — data now lives in Supabase remedies table
// To add new remedies: INSERT into the remedies table directly
// No code deployment needed

export type { Remedy } from './remedy-engine';

// Condition keyword detector — still used by webhook
export function detectCondition(message: string): string | null {
  const lower = message.toLowerCase();

  // Body-location + skin-symptom combos need to match regardless of word
  // order ("breakouts coming out from my neck" vs a fixed "neck breakout"
  // phrase) — a real report came in as the former and the old fixed-phrase
  // entries below missed it entirely. Checked before the generic map so a
  // mention of neck/back/chest/body alongside any skin-eruption word routes
  // to the body-acne remedies (different, real content — loose clothing,
  // tea tree oil, post-workout showering) instead of the facial-acne set.
  // 'spot' must be a whole word: as a substring it matched 'spotting' (a
  // different condition), 'Spotify', 'hotspot' etc.
  const skinWords = ['acne', 'breakout', 'pimple', 'blemish'];
  const hasSkinWord = skinWords.some(w => lower.includes(w)) || /\bspots?\b/.test(lower);
  const bodyLocations = ['neck', 'back', 'chest', 'body'];
  if (hasSkinWord && bodyLocations.some(w => lower.includes(w))) {
    return 'acne_body';
  }

  // Whole-word matches for short keywords that were previously plain
  // substrings and misfired on ordinary words: 'uti' inside 'solution',
  // 'routine', 'beautiful'; 'clot' inside 'clothes'; 'spot' inside
  // 'spotting'. Spotting is checked first so it wins over acne's 'spot'.
  if (/\bspotting\b/.test(lower)) return 'spotting';
  if (/\butis?\b/.test(lower)) return 'uti_prone';
  if (/\bspots?\b/.test(lower)) return 'acne';

  // Same word-order-independent pattern for a few new conditions that would
  // otherwise be silently swallowed by an existing, shorter generic keyword
  // ('itchy' -> vaginal_itching, 'puffy'/'swollen' -> water_retention,
  // 'sleep' -> sleep) regardless of phrase order or which is checked first.
  if (lower.includes('scalp') && (lower.includes('itch') || lower.includes('dandruff') || lower.includes('flak'))) {
    return lower.includes('dandruff') || lower.includes('flak') ? 'dandruff' : 'itchy_scalp';
  }
  if (lower.includes('eye') && (lower.includes('puffy') || lower.includes('swoll') || lower.includes('puffiness'))) {
    return 'puffy_eyes';
  }
  if (lower.includes('oversleep') || lower.includes('overslept') || (lower.includes('sleep') && lower.includes('too much'))) {
    return 'oversleeping';
  }
  if (lower.includes('sweat') && lower.includes('night')) {
    return 'night_sweats';
  }
  // 'lumpy breast' overlaps with the existing 'breast tender'/'sore breast'
  // keywords for plain breast_tenderness — checked first so the more
  // specific fibrocystic condition wins when "lumpy" is actually mentioned.
  if (lower.includes('lumpy') && lower.includes('breast')) {
    return 'fibrocystic_breasts';
  }

  // Body-part + descriptor combos where natural phrasing puts the words in
  // any order ("my heels are so cracked", "nails keep peeling"). Word
  // boundaries stop 'lip' matching 'slip', 'nail' matching 'snail', etc.
  const has = (re: RegExp) => re.test(lower);
  if (has(/\bheels?\b/) && (lower.includes('crack') || lower.includes('dry') || lower.includes('rough'))) return 'cracked_heels';
  if (has(/\blips?\b/) && (lower.includes('chap') || lower.includes('crack') || lower.includes('dry') || lower.includes('peel'))) return 'chapped_lips';
  if (has(/\bnails?\b/) && lower.includes('ridge')) return 'nail_ridges';
  if (has(/\bnails?\b/) && (lower.includes('brittle') || lower.includes('peel') || lower.includes('break') || lower.includes('snap'))) return 'brittle_nails';

  const map: Record<string, string> = {
    'leg cramp': 'leg_cramps', 'calf cramp': 'leg_cramps',
    cramp: 'cramps', 'period pain': 'cramps', dysmenorrhea: 'cramps', 'stomach pain': 'cramps',
    bloat: 'bloating', 'water retention': 'water_retention', swollen: 'water_retention', puffy: 'water_retention',
    acne: 'acne', breakout: 'acne', pimple: 'acne', blemish: 'acne',
    mood: 'pms_mood', irritable: 'pms_mood', pms: 'pms_mood', 'mood swing': 'pms_mood',
    'heavy flow': 'heavy_flow', 'heavy period': 'heavy_flow', 'bleeding a lot': 'heavy_flow',
    'breast tender': 'breast_tenderness', 'sore breast': 'breast_tenderness', boob: 'breast_tenderness',
    tired: 'fatigue', fatigue: 'fatigue', exhausted: 'fatigue', 'no energy': 'fatigue',
    'low iron': 'low_iron_fatigue', anemic: 'low_iron_fatigue', anaemia: 'low_iron_fatigue',
    irregular: 'irregular_cycles', 'missed period': 'irregular_cycles',
    'short cycle': 'short_cycles', 'cycle is short': 'short_cycles',
    'long cycle': 'long_cycles', 'delayed period': 'long_cycles', 'late period': 'long_cycles',
    sleep: 'sleep', insomnia: 'sleep', "can't sleep": 'sleep',
    'restless leg': 'restless_legs', 'legs won\u2019t stop moving': 'restless_legs',
    'vaginal itch': 'vaginal_itching', itchy: 'vaginal_itching',
    'vaginal dry': 'vaginal_dryness', 'dry down there': 'vaginal_dryness',
    discharge: 'vaginal_health', vaginal: 'vaginal_health',
    'yeast infection': 'yeast_infection_prone', thrush: 'yeast_infection_prone',
    'urinary tract': 'uti_prone', 'burning when i pee': 'uti_prone',
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
    'blood clot': 'period_clots',
    spotting: 'spotting', 'spotting between periods': 'spotting',
    'binge eat': 'emotional_eating', 'emotional eating': 'emotional_eating', 'stress eat': 'emotional_eating',
    overwhelmed: 'stress_overwhelm', stressed: 'stress_overwhelm', 'so much pressure': 'stress_overwhelm',
    'really low': 'severe_mood_dips', pmdd: 'severe_mood_dips', 'mood crash': 'severe_mood_dips',
    'period smell': 'period_odor', 'period odor': 'period_odor', 'smell bad': 'period_odor',
    'sensitive skin': 'sensitive_skin', 'skin flare': 'sensitive_skin',
    'cold hands': 'cold_hands_feet', 'cold feet': 'cold_hands_feet',
    thirsty: 'increased_thirst', 'so thirsty': 'increased_thirst',
    'period flu': 'period_flu', 'body aches and chills': 'period_flu', chills: 'period_flu',
    'pelvic pressure': 'pelvic_pressure', 'pelvic heaviness': 'pelvic_pressure', heaviness: 'pelvic_pressure',
    'everything hurts more': 'increased_pain_sensitivity', 'more sensitive to pain': 'increased_pain_sensitivity',

    // Batch 1 additions (25 new conditions) — see itchy_scalp/puffy_eyes/
    // oversleeping above for the three that needed AND-based pre-checks
    // instead of a simple entry here.
    'dark underarm': 'dark_underarms', 'underarms are dark': 'dark_underarms',
    'dark inner thigh': 'dark_inner_thighs', 'dark thigh': 'dark_inner_thighs',
    'ingrown hair': 'ingrown_hairs', 'razor bump': 'ingrown_hairs',
    'cracked heel': 'cracked_heels', 'dry heel': 'cracked_heels', 'heels are cracked': 'cracked_heels',
    'chapped lip': 'chapped_lips', 'dry lip': 'chapped_lips', 'lips are chapped': 'chapped_lips',
    dandruff: 'dandruff', 'flaky scalp': 'dandruff',
    'split end': 'split_ends', 'brittle hair': 'split_ends',
    'brittle nail': 'brittle_nails', 'peeling nail': 'brittle_nails', 'nails keep breaking': 'brittle_nails',
    'nail ridge': 'nail_ridges', 'ridged nail': 'nail_ridges', 'ridges on my nail': 'nail_ridges',
    'dark circle': 'dark_circles', 'under eye dark': 'dark_circles', 'dark under eye': 'dark_circles',
    'acid reflux': 'acid_reflux', heartburn: 'acid_reflux',
    flatulence: 'gas_flatulence', gassy: 'gas_flatulence', 'passing gas': 'gas_flatulence',
    'bad breath': 'bad_breath', 'breath smells': 'bad_breath',
    'no appetite': 'loss_of_appetite', 'not hungry': 'loss_of_appetite', 'lost my appetite': 'loss_of_appetite', "don't feel like eating": 'loss_of_appetite',
    'increased appetite': 'increased_appetite', 'always hungry': 'increased_appetite', 'extremely hungry': 'increased_appetite', "can't stop eating": 'increased_appetite',
    'energy crash': 'afternoon_energy_crash', 'afternoon slump': 'afternoon_energy_crash', 'afternoon crash': 'afternoon_energy_crash', '2pm slump': 'afternoon_energy_crash',
    'neck tension': 'neck_shoulder_tension', 'shoulder tension': 'neck_shoulder_tension', 'tight shoulders': 'neck_shoulder_tension', 'neck and shoulder': 'neck_shoulder_tension',
    'jaw clench': 'jaw_clenching', 'clenching my jaw': 'jaw_clenching', tmj: 'jaw_clenching', 'jaw pain': 'jaw_clenching',
    'wrist pain': 'wrist_hand_pain', 'hand pain': 'wrist_hand_pain', 'wrist hurts': 'wrist_hand_pain',
    'hip pain': 'hip_pain', 'hips hurt': 'hip_pain',
    tailbone: 'tailbone_pain', coccyx: 'tailbone_pain',
    'rib pain': 'rib_pain', 'ribs hurt': 'rib_pain',

    // Batch 2 additions (18 new conditions — hormonal/PCOS/common issues)
    pcos: 'pcos_symptoms', 'polycystic ovar': 'pcos_symptoms',
    'hormonal imbalance': 'hormonal_imbalance', 'hormones are off': 'hormonal_imbalance', 'hormone imbalance': 'hormonal_imbalance',
    'facial hair': 'excess_facial_hair', 'chin hair': 'excess_facial_hair', hirsutism: 'excess_facial_hair',
    'dark neck': 'dark_neck_patches', 'dark patch': 'dark_neck_patches', acanthosis: 'dark_neck_patches',
    'hormonal weight': 'hormonal_weight_gain', 'belly fat': 'hormonal_weight_gain', 'weight gain around my middle': 'hormonal_weight_gain',
    thyroid: 'thyroid_symptoms', hypothyroid: 'thyroid_symptoms', 'sluggish thyroid': 'thyroid_symptoms',
    endometriosis: 'endometriosis_pain',
    fibroid: 'fibroid_symptoms',
    perimenopause: 'perimenopause_symptoms', 'perimenopausal': 'perimenopause_symptoms',
    'night sweat': 'night_sweats', 'sweating at night': 'night_sweats', 'wake up sweating': 'night_sweats',
    'vitamin d': 'low_vitamin_d', 'low vitamin d': 'low_vitamin_d',
    'birth control side effect': 'birth_control_side_effects', 'pill side effect': 'birth_control_side_effects',
    'lumpy breast': 'fibrocystic_breasts', 'fibrocystic': 'fibrocystic_breasts',
    'ovarian cyst': 'ovarian_cyst_pain', 'cyst pain': 'ovarian_cyst_pain',
    'sweat a lot': 'excessive_sweating', 'sweating too much': 'excessive_sweating', 'excessive sweating': 'excessive_sweating',
    'period lasting': 'prolonged_periods', 'period won\'t stop': 'prolonged_periods', 'period wont stop': 'prolonged_periods', 'bleeding for too long': 'prolonged_periods',
    'light period': 'light_periods', 'barely bleeding': 'light_periods', 'very light flow': 'light_periods',
    'leak when i laugh': 'pelvic_floor_weakness', 'leak when i cough': 'pelvic_floor_weakness', 'leak when i sneeze': 'pelvic_floor_weakness', 'pelvic floor': 'pelvic_floor_weakness',
  };

  for (const [keyword, cond] of Object.entries(map)) {
    if (lower.includes(keyword)) return cond;
  }

  // 'rash' needs a word boundary — as a plain substring it matched inside
  // 'crash', 'trash', 'brash' etc. (surfaced when 'energy crash' was added).
  // Checked last to keep its old lowest-priority position in the map.
  if (/\bclots?\b/.test(lower)) return 'period_clots';
  if (/\brash(es)?\b/.test(lower)) return 'sensitive_skin';
  return null;
}
