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

  // Batch 5 pre-checks. Each of these would otherwise be swallowed by an
  // earlier, shorter generic keyword: 'acne'/'spot' (acne scars), 'sleep'
  // (nightmares, night waking), 'stress'/'anxious' (exam nerves), 'thigh'
  // (chafing) and 'skin' conditions (dull skin). Word boundaries stop
  // 'scar' matching 'scare'/'scarf' and 'exam' matching 'example'.
  if (/\bscars?\b/.test(lower) && (lower.includes('acne') || lower.includes('pimple') || lower.includes('breakout'))) {
    return 'acne_scars';
  }
  // Batch 6 pre-checks. 'itchy' (vaginal_itching) and 'rash'/'chaf' would
  // otherwise swallow these. Eye itch needs the word 'eye'; pad irritation
  // needs a pad/liner word so ordinary rashes and chafing are unaffected.
  if (/\beyes?\b/.test(lower) && /\bitch/.test(lower)) {
    return 'itchy_eyes';
  }
  // 'bite/chew my nails' would otherwise hit 'stressed' or other generic words.
  if (/\bnails?\b/.test(lower) && /\b(bite|bites|biting|bit|chew|chewing)\b/.test(lower)) {
    return 'nail_biting';
  }
  if (/\b(pads?|sanitary|liners?)\b/.test(lower) && (/\bitch/.test(lower) || ['rash', 'irritat', 'sore', 'chaf'].some(w => lower.includes(w)))) {
    return 'pad_irritation';
  }
  // Batch 7 pre-check: 'tired' would otherwise route to fatigue. Requires a
  // legs/feet word and steps aside for the more specific conditions
  // (swelling, cramps, restless legs, cold feet, odour, heels, nails, gym soreness).
  if (
    /\b(legs?|feet|foot)\b/.test(lower) &&
    ['tired', 'aching', 'achy', 'heavy', 'sore', 'hurt'].some(w => lower.includes(w)) &&
    !['swol', 'swell', 'cramp', 'restless', 'cold', 'odor', 'odour', 'smell', 'crack', 'heel', 'numb', 'tingl', 'athlete', 'blister', 'wart', 'ingrown', 'toenail', 'gym', 'workout', 'exercise', 'shin'].some(w => lower.includes(w))
  ) {
    return 'tired_legs_feet';
  }
  if (lower.includes('chaf')) {
    return 'chafing';
  }
  if (lower.includes('nightmare') || lower.includes('bad dream') || lower.includes('vivid dream')) {
    return 'nightmares';
  }
  if (
    /\b(exams?|interview|presentation|public speaking)\b/.test(lower) &&
    ['nervous', 'nerves', 'anxious', 'anxiety', 'stress', 'panic', 'worried', 'scared'].some(w => lower.includes(w))
  ) {
    return 'exam_nerves';
  }
  if (lower.includes('skin') && ['dull', 'lifeless', 'lackluster', 'lacklustre', 'no glow'].some(w => lower.includes(w))) {
    return 'dull_skin';
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
  // Waking in the night: 'sleep' (insomnia) would otherwise take "can't stay
  // asleep"-style messages. Excludes 'sweat' so night sweats keep priority.
  if (/\b(wake|waking|woke)( me)? up\b/.test(lower) && (lower.includes('night') || /\b[234] ?am\b/.test(lower)) && !lower.includes('sweat')) {
    return 'night_waking';
  }
  // Localized sweating needs to beat the generic excessive_sweating entries
  // further down, and 'swollen' needs to beat the existing bare
  // 'swollen'->water_retention keyword when ankles/feet are mentioned.
  if (lower.includes('sweat') && (lower.includes('palm') || lower.includes('hand'))) {
    return 'sweaty_palms';
  }
  if ((lower.includes('swoll') || lower.includes('swelling')) && (lower.includes('ankle') || lower.includes('feet') || lower.includes('foot'))) {
    return 'swollen_ankles_feet';
  }
  if (lower.includes('eye') && lower.includes('twitch')) {
    return 'eye_twitching';
  }
  if (lower.includes('eye') && (lower.includes('dry') || lower.includes('gritty'))) {
    return 'dry_eyes';
  }
  if (lower.includes('eye') && (lower.includes('strain') || lower.includes('tired') || lower.includes('screen'))) {
    return 'eye_strain';
  }
  if (lower.includes('shin') && (lower.includes('splint') || lower.includes('pain') || lower.includes('sore'))) {
    return 'shin_splints';
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

    // Batch 3 additions (25 new conditions). The collision-prone ones
    // (sweaty palms, swollen ankles/feet, eye dry/strain/twitch, shin
    // splints) are handled as AND-based pre-checks above, not here.
    'heat rash': 'heat_rash', 'prickly heat': 'heat_rash',
    'body odor': 'body_odor', 'smell different': 'body_odor', 'underarm smell': 'body_odor',
    'foot odor': 'foot_odor', 'feet smell': 'foot_odor', 'smelly feet': 'foot_odor',
    'stretch mark': 'stretch_marks',
    cellulite: 'cellulite_appearance',
    'varicose vein': 'varicose_veins', 'spider vein': 'varicose_veins',
    'keratosis pilaris': 'keratosis_pilaris', 'chicken skin': 'keratosis_pilaris', 'bumpy skin': 'keratosis_pilaris',
    'mouth ulcer': 'mouth_ulcers', 'canker sore': 'mouth_ulcers',
    'cold sore': 'cold_sores', 'fever blister': 'cold_sores',
    'bleeding gum': 'bleeding_gums', 'gums bleed': 'bleeding_gums', 'sensitive gum': 'bleeding_gums',
    'sensitive teeth': 'sensitive_teeth', 'tooth sensitivity': 'sensitive_teeth', 'teeth hurt': 'sensitive_teeth',
    stye: 'styes',
    'hay fever': 'seasonal_allergies', 'seasonal allerg': 'seasonal_allergies', 'allergies acting up': 'seasonal_allergies',
    'frequent cold': 'frequent_colds', 'catching colds': 'frequent_colds', 'keep getting sick': 'frequent_colds', 'weak immune': 'frequent_colds',
    'plantar fasciitis': 'plantar_pain', 'arch pain': 'plantar_pain', 'foot arch': 'plantar_pain',
    'corner of my mouth': 'cracked_mouth_corners', 'corners of my mouth': 'cracked_mouth_corners', 'cracked corner': 'cracked_mouth_corners',
    'restless arm': 'restless_arms',
    lonely: 'loneliness', 'feeling isolated': 'loneliness', 'feel so alone': 'loneliness',
    burnout: 'burnout', 'burnt out': 'burnout', 'burned out': 'burnout',

    // Batch 5 additions (25 new conditions). acne_scars, chafing,
    // nightmares, night_waking, exam_nerves and dull_skin are handled as
    // pre-checks above; piles, doms and ear pain are whole-word checks
    // after this map.
    hemorrhoid: 'hemorrhoids', haemorrhoid: 'hemorrhoids',
    'sore throat': 'sore_throat', 'scratchy throat': 'sore_throat',
    cough: 'cough',
    'stuffy nose': 'stuffy_nose', 'blocked nose': 'stuffy_nose', 'nasal congestion': 'stuffy_nose', congested: 'stuffy_nose', 'runny nose': 'stuffy_nose',
    sinus: 'sinus_pressure',
    sunburn: 'sunburn', sunburnt: 'sunburn',
    'mosquito bite': 'insect_bites', 'insect bite': 'insect_bites', 'bug bite': 'insect_bites', 'bitten by': 'insect_bites',
    'burned my': 'minor_burns', 'burnt my': 'minor_burns', 'minor burn': 'minor_burns', scalded: 'minor_burns',
    'small cut': 'minor_cuts_scrapes', 'minor cut': 'minor_cuts_scrapes', 'paper cut': 'minor_cuts_scrapes', 'scraped my': 'minor_cuts_scrapes', 'cut myself': 'minor_cuts_scrapes', 'cut on my': 'minor_cuts_scrapes',
    hangover: 'hangover',
    toothache: 'toothache', 'tooth ache': 'toothache', 'tooth pain': 'toothache', 'tooth hurts': 'toothache',
    earache: 'earache', 'ear ache': 'earache',
    posture: 'poor_posture', slouch: 'poor_posture', hunched: 'poor_posture',
    dehydrat: 'dehydration',
    'dry hair': 'dry_hair', 'frizzy hair': 'dry_hair', frizz: 'dry_hair',
    'clogged pore': 'clogged_pores', 'large pore': 'clogged_pores', 'open pore': 'clogged_pores', 'enlarged pore': 'clogged_pores', 'visible pore': 'clogged_pores', blackhead: 'clogged_pores', whitehead: 'clogged_pores',
    'sore muscle': 'sore_muscles', 'muscle soreness': 'sore_muscles', 'muscles are sore': 'sore_muscles', 'post-workout soreness': 'sore_muscles',
    'dry mouth': 'dry_mouth', 'mouth is dry': 'dry_mouth', 'mouth feels dry': 'dry_mouth',
    'self-esteem': 'low_self_esteem', 'self esteem': 'low_self_esteem', 'body image': 'low_self_esteem', 'hate my body': 'low_self_esteem',

    // Batch 6 additions (25 new conditions). itchy_eyes and pad_irritation
    // are pre-checks above; athlete's foot, warts and dry hands are
    // whole-word/AND checks after this map. 'razor bump' already routes to
    // ingrown_hairs, so only burn/rash wording is mapped here.
    blister: 'friction_blisters',
    'stiff neck': 'stiff_neck', 'crick in my neck': 'stiff_neck',
    jittery: 'caffeine_jitters', 'caffeine jitter': 'caffeine_jitters', 'too much caffeine': 'caffeine_jitters', 'too much coffee': 'caffeine_jitters',
    'jet lag': 'jet_lag', jetlag: 'jet_lag', 'jet-lag': 'jet_lag',
    'phone addiction': 'phone_overuse', doomscroll: 'phone_overuse', 'scrolling too much': 'phone_overuse', 'on my phone too much': 'phone_overuse', 'screen time': 'phone_overuse',
    homesick: 'homesickness',
    'no motivation': 'low_motivation', unmotivated: 'low_motivation', 'lack of motivation': 'low_motivation', 'lost motivation': 'low_motivation', 'lost my motivation': 'low_motivation',
    forgetful: 'forgetfulness', 'forgetting things': 'forgetfulness', 'keep forgetting': 'forgetfulness', 'memory lapse': 'forgetfulness',
    'crying a lot': 'crying_spells', 'cry easily': 'crying_spells', 'crying for no reason': 'crying_spells', 'crying spell': 'crying_spells', 'crying all the time': 'crying_spells', 'keep crying': 'crying_spells',
    'racing heart': 'racing_heart', 'heart racing': 'racing_heart', 'heart is racing': 'racing_heart', 'heart beating fast': 'racing_heart', 'heart beats fast': 'racing_heart', 'heart pounding': 'racing_heart', 'heart is pounding': 'racing_heart', palpitation: 'racing_heart',
    'razor burn': 'razor_burn', 'shaving rash': 'razor_burn', 'shaving burn': 'razor_burn',
    'ingrown toenail': 'ingrown_toenail', 'ingrown toe': 'ingrown_toenail', 'ingrown nail': 'ingrown_toenail',
    'hair not growing': 'slow_hair_growth', 'hair wont grow': 'slow_hair_growth', "hair won't grow": 'slow_hair_growth', 'slow hair growth': 'slow_hair_growth', 'hair growing slowly': 'slow_hair_growth', 'grow my hair': 'slow_hair_growth',
    'fine line': 'fine_lines', wrinkle: 'fine_lines', 'aging skin': 'fine_lines', 'ageing skin': 'fine_lines',
    suntan: 'suntan', 'sun tan': 'suntan', 'tanned skin': 'suntan', 'tan removal': 'suntan', 'so tanned': 'suntan',
    'dark lips': 'dark_lips', 'lips are dark': 'dark_lips', 'lip pigmentation': 'dark_lips', 'pigmented lips': 'dark_lips',
    'dark knee': 'dark_knees_elbows', 'dark elbow': 'dark_knees_elbows', 'knees are dark': 'dark_knees_elbows', 'elbows are dark': 'dark_knees_elbows', 'dark knuckle': 'dark_knees_elbows',
    hiccup: 'hiccups',
    'bite my nails': 'nail_biting', 'biting my nails': 'nail_biting', 'bite my nail': 'nail_biting', 'nail biting': 'nail_biting', 'nail-biting': 'nail_biting',
    'yellow teeth': 'stained_teeth', 'stained teeth': 'stained_teeth', 'teeth whitening': 'stained_teeth', 'whiten my teeth': 'stained_teeth', 'teeth are yellow': 'stained_teeth',

    // Batch 7 additions (final 6 conditions). tired_legs_feet is a pre-check
    // above. 'cold' is only matched in full phrases so 'cold sore' and
    // 'cold hands' keep routing to their own conditions (and 'frequent cold'
    // / 'catching colds' still route to frequent_colds, which comes first).
    'grey hair': 'premature_grey_hair', 'gray hair': 'premature_grey_hair', greying: 'premature_grey_hair', graying: 'premature_grey_hair', 'going grey': 'premature_grey_hair', 'going gray': 'premature_grey_hair', 'white hair': 'premature_grey_hair',
    'common cold': 'common_cold', 'have a cold': 'common_cold', 'got a cold': 'common_cold', 'caught a cold': 'common_cold', 'catching a cold': 'common_cold', 'coming down with a cold': 'common_cold', 'bad cold': 'common_cold', 'head cold': 'common_cold', 'chest cold': 'common_cold',
    'dry nose': 'dry_nose', 'nose is dry': 'dry_nose', 'nasal dryness': 'dry_nose', 'crusty nose': 'dry_nose',
    sneez: 'sneezing',
    hoarse: 'hoarse_voice', 'lost my voice': 'hoarse_voice', 'losing my voice': 'hoarse_voice', 'voice is gone': 'hoarse_voice', 'voice gone': 'hoarse_voice', croaky: 'hoarse_voice', 'raspy voice': 'hoarse_voice',
  };

  for (const [keyword, cond] of Object.entries(map)) {
    if (lower.includes(keyword)) return cond;
  }

  // 'rash' needs a word boundary — as a plain substring it matched inside
  // 'crash', 'trash', 'brash' etc. (surfaced when 'energy crash' was added).
  // Checked last to keep its old lowest-priority position in the map.
  // Word-order-independent 'nose ... blocked/stuffy'. Lives after the map so
  // earlier matches (hay fever, allergies) still win.
  if (lower.includes('nose') && /blocked|stuffy|stuffed|congest/.test(lower)) return 'stuffy_nose';
  // Word-order-independent 'nose ... dry/crusty' (after the map so 'dry skin on my nose' still wins).
  if (/\bnose\b/.test(lower) && /\bdry\b|dryness|crust/.test(lower)) return 'dry_nose';
  // Batch 6 post-map checks (earlier map matches still win).
  if (/athlete.?s? ?foot/.test(lower) || (lower.includes('fungal') && lower.includes('foot'))) return 'athletes_foot';
  if (/\bwarts?\b/.test(lower) || lower.includes('verruca')) return 'warts';
  if (lower.includes('hair') && /not growing|isn.?t growing|won.?t grow|grow(ing)? slowly|slow growth|slow to grow/.test(lower)) return 'slow_hair_growth';
  if (/\bhands?\b/.test(lower) && ['dry', 'crack', 'rough', 'peel', 'chap'].some(w => lower.includes(w))) return 'dry_hands';
  if (/\bpiles\b/.test(lower)) return 'hemorrhoids';
  if (/\bdoms\b/.test(lower)) return 'sore_muscles';
  if (/\bear ?(pain|ache)s?\b/.test(lower)) return 'earache';
  if (/\bclots?\b/.test(lower)) return 'period_clots';
  if (/\brash(es)?\b/.test(lower)) return 'sensitive_skin';
  return null;
}
