import { describe, it, expect } from 'vitest';
import { detectCondition } from '../remedies';

describe('detectCondition — body-location acne (word-order independent)', () => {
  it('routes a real reported message to acne_body, not plain acne', () => {
    // Actual reported case: "breakouts" and "neck" aren't adjacent, so the
    // old fixed-phrase 'neck breakout' entry would have missed this.
    expect(detectCondition('They are painful breakouts coming out from my neck and face')).toBe('acne_body');
  });

  it('matches regardless of word order for back/chest/body too', () => {
    expect(detectCondition('I have spots on my back')).toBe('acne_body');
    expect(detectCondition('breakout on my chest')).toBe('acne_body');
    expect(detectCondition('body acne is so bad this week')).toBe('acne_body');
  });

  it('still falls back to plain facial acne when no body location is mentioned', () => {
    expect(detectCondition('I have a breakout on my chin')).toBe('acne');
    expect(detectCondition('so many pimples today')).toBe('acne');
  });
});

describe('detectCondition — general sanity', () => {
  it('returns null when nothing matches', () => {
    expect(detectCondition('what a lovely day')).toBeNull();
  });

  it('still matches unrelated existing conditions correctly', () => {
    expect(detectCondition('I have really bad cramps today')).toBe('cramps');
    expect(detectCondition('feeling so tired lately')).toBe('fatigue');
  });
});

describe('detectCondition — batch 1 new conditions (collision-prone ones)', () => {
  it('routes scalp itchiness to itchy_scalp, not the existing vaginal itchy keyword', () => {
    expect(detectCondition('my scalp is so itchy today')).toBe('itchy_scalp');
    expect(detectCondition('itchy scalp all week')).toBe('itchy_scalp');
  });

  it('routes scalp flaking to dandruff even when "itchy" is also present', () => {
    expect(detectCondition('my scalp is flaky and itchy')).toBe('dandruff');
  });

  it('still routes plain vaginal itching correctly (unaffected by the scalp fix)', () => {
    expect(detectCondition('I feel itchy down there')).toBe('vaginal_itching');
  });

  it('routes eye puffiness to puffy_eyes, not the existing water_retention keyword', () => {
    expect(detectCondition('my eyes are so puffy this morning')).toBe('puffy_eyes');
    expect(detectCondition('puffy eyes today')).toBe('puffy_eyes');
  });

  it('still routes plain puffiness/swelling to water_retention (unaffected by the eye fix)', () => {
    expect(detectCondition('feeling so puffy all over')).toBe('water_retention');
  });

  it('routes oversleeping to oversleeping, not the existing sleep keyword', () => {
    expect(detectCondition('I keep oversleeping every day')).toBe('oversleeping');
    expect(detectCondition('I overslept again this morning')).toBe('oversleeping');
    expect(detectCondition('sleeping way too much lately')).toBe('oversleeping');
  });

  it('still routes plain sleep trouble to sleep (unaffected by the oversleeping fix)', () => {
    expect(detectCondition("I can't sleep at all")).toBe('sleep');
  });

  it('does not treat "crash" as a skin rash, but still catches a real rash', () => {
    expect(detectCondition('hit an energy crash this afternoon')).toBe('afternoon_energy_crash');
    expect(detectCondition('I have a rash on my arm')).toBe('sensitive_skin');
  });

  it('routes a sample of the other 22 new conditions correctly', () => {
    expect(detectCondition('I have really bad heartburn after dinner')).toBe('acid_reflux');
    expect(detectCondition('so much gas today, I feel gassy')).toBe('gas_flatulence');
    expect(detectCondition('I think I have bad breath')).toBe('bad_breath');
    expect(detectCondition('I have no appetite lately')).toBe('loss_of_appetite');
    expect(detectCondition('I am always hungry these days')).toBe('increased_appetite');
    expect(detectCondition('hit an energy crash this afternoon')).toBe('afternoon_energy_crash');
    expect(detectCondition('bad neck tension today')).toBe('neck_shoulder_tension');
    expect(detectCondition('my jaw pain is back')).toBe('jaw_clenching');
    expect(detectCondition('my wrist pain is worse today')).toBe('wrist_hand_pain');
    expect(detectCondition('hip pain when I walk')).toBe('hip_pain');
    expect(detectCondition('tailbone pain when sitting')).toBe('tailbone_pain');
    expect(detectCondition('sharp rib pain today')).toBe('rib_pain');
    expect(detectCondition('my heels are so cracked')).toBe('cracked_heels');
    expect(detectCondition('my lips are so chapped')).toBe('chapped_lips');
    expect(detectCondition('so much dandruff this week')).toBe('dandruff');
    expect(detectCondition('bad split ends lately')).toBe('split_ends');
    expect(detectCondition('my nails are so brittle')).toBe('brittle_nails');
    expect(detectCondition('noticing nail ridges lately')).toBe('nail_ridges');
    expect(detectCondition('bad dark circles today')).toBe('dark_circles');
    expect(detectCondition('ingrown hair on my leg')).toBe('ingrown_hairs');
    expect(detectCondition('dark underarms bothering me')).toBe('dark_underarms');
    expect(detectCondition('dark inner thigh area')).toBe('dark_inner_thighs');
  });
});

describe('detectCondition — batch 2 (hormonal/PCOS/common issues)', () => {
  it('routes pcos to the dedicated pcos_symptoms condition, not the old generic irregular_cycles', () => {
    expect(detectCondition('I think I have PCOS')).toBe('pcos_symptoms');
  });

  it('still routes plain irregular cycle mentions correctly', () => {
    expect(detectCondition('my cycle is so irregular lately')).toBe('irregular_cycles');
  });

  it('does not false-match "endo" inside unrelated words like endorphins', () => {
    expect(detectCondition('feeling good, endorphins are pumping')).toBeNull();
    expect(detectCondition('my doctor thinks it could be endometriosis')).toBe('endometriosis_pain');
  });

  it('routes the rest of batch 2 correctly', () => {
    expect(detectCondition('hormonal imbalance is rough')).toBe('hormonal_imbalance');
    expect(detectCondition('dealing with facial hair growth')).toBe('excess_facial_hair');
    expect(detectCondition('noticed a dark patch on my neck')).toBe('dark_neck_patches');
    expect(detectCondition('so much belly fat lately')).toBe('hormonal_weight_gain');
    expect(detectCondition('my thyroid feels off')).toBe('thyroid_symptoms');
    expect(detectCondition('fibroid pain again')).toBe('fibroid_symptoms');
    expect(detectCondition('think I am in perimenopause')).toBe('perimenopause_symptoms');
    expect(detectCondition('waking up sweating every night')).toBe('night_sweats');
    expect(detectCondition('low vitamin d probably')).toBe('low_vitamin_d');
    expect(detectCondition('bad pill side effects')).toBe('birth_control_side_effects');
    expect(detectCondition('lumpy breast tenderness')).toBe('fibrocystic_breasts');
    expect(detectCondition('sharp ovarian cyst pain')).toBe('ovarian_cyst_pain');
    expect(detectCondition('sweating too much lately')).toBe('excessive_sweating');
    expect(detectCondition('my period won\'t stop')).toBe('prolonged_periods');
    expect(detectCondition('such a light period this month')).toBe('light_periods');
    expect(detectCondition('I leak when I laugh')).toBe('pelvic_floor_weakness');
  });
});

describe('detectCondition — batch 3 (skin/hygiene/dental/eye/emotional)', () => {
  it('routes sweaty palms to sweaty_palms, not the existing excessive_sweating keywords', () => {
    expect(detectCondition('my palms are so sweaty')).toBe('sweaty_palms');
  });

  it('still routes plain excessive sweating correctly', () => {
    expect(detectCondition('sweating too much lately')).toBe('excessive_sweating');
  });

  it('routes ankle/feet swelling to swollen_ankles_feet, not plain water_retention', () => {
    expect(detectCondition('my ankles are so swollen today')).toBe('swollen_ankles_feet');
    expect(detectCondition('feet swelling after work')).toBe('swollen_ankles_feet');
  });

  it('still routes plain swelling/puffiness to water_retention', () => {
    expect(detectCondition('feeling so swollen and puffy')).toBe('water_retention');
  });

  it('routes eye complaints to the right specific eye condition', () => {
    expect(detectCondition('my eye keeps twitching')).toBe('eye_twitching');
    expect(detectCondition('my eyes are so dry')).toBe('dry_eyes');
    expect(detectCondition('eyes are strained from the screen')).toBe('eye_strain');
  });

  it('routes shin pain to shin_splints regardless of word order', () => {
    expect(detectCondition('shin splints again')).toBe('shin_splints');
    expect(detectCondition('pain in my shin after running')).toBe('shin_splints');
  });

  it('does not confuse body_odor with the existing period_odor keyword "smell bad"', () => {
    expect(detectCondition('my period smells bad')).toBe('period_odor');
    expect(detectCondition('noticing a body odor change lately')).toBe('body_odor');
  });

  it('routes the rest of batch 3 correctly', () => {
    expect(detectCondition('bad heat rash on my back')).toBe('heat_rash');
    expect(detectCondition('my feet smell so bad')).toBe('foot_odor');
    expect(detectCondition('new stretch marks appearing')).toBe('stretch_marks');
    expect(detectCondition('cellulite bothering me')).toBe('cellulite_appearance');
    expect(detectCondition('varicose veins on my legs')).toBe('varicose_veins');
    expect(detectCondition('I think I have keratosis pilaris')).toBe('keratosis_pilaris');
    expect(detectCondition('painful mouth ulcer today')).toBe('mouth_ulcers');
    expect(detectCondition('a cold sore is forming')).toBe('cold_sores');
    expect(detectCondition('my gums bleed when I brush')).toBe('bleeding_gums');
    expect(detectCondition('my teeth hurt with cold drinks')).toBe('sensitive_teeth');
    expect(detectCondition('I think I have a stye')).toBe('styes');
    expect(detectCondition('bad hay fever this week')).toBe('seasonal_allergies');
    expect(detectCondition('I keep catching colds lately')).toBe('frequent_colds');
    expect(detectCondition('plantar fasciitis pain')).toBe('plantar_pain');
    expect(detectCondition('corners of my mouth are cracked')).toBe('cracked_mouth_corners');
    expect(detectCondition('restless arm feeling at night')).toBe('restless_arms');
    expect(detectCondition('feeling so lonely lately')).toBe('loneliness');
    expect(detectCondition('totally burnt out from work')).toBe('burnout');
  });
});

describe('detectCondition — batch 5 (everyday wellness)', () => {
  it('routes the simple map-based conditions', () => {
    expect(detectCondition('I think I have hemorrhoids')).toBe('hemorrhoids');
    expect(detectCondition('piles are so painful')).toBe('hemorrhoids');
    expect(detectCondition('sore throat all day')).toBe('sore_throat');
    expect(detectCondition('I have a dry cough')).toBe('cough');
    expect(detectCondition('feeling really congested')).toBe('stuffy_nose');
    expect(detectCondition('sinus pressure behind my eyes')).toBe('sinus_pressure');
    expect(detectCondition('got badly sunburnt')).toBe('sunburn');
    expect(detectCondition('mosquito bites everywhere')).toBe('insect_bites');
    expect(detectCondition('I burned my hand cooking')).toBe('minor_burns');
    expect(detectCondition('I cut myself chopping onions')).toBe('minor_cuts_scrapes');
    expect(detectCondition('such a hangover today')).toBe('hangover');
    expect(detectCondition('terrible toothache')).toBe('toothache');
    expect(detectCondition('I have an earache')).toBe('earache');
    expect(detectCondition('my ear pain is back')).toBe('earache');
    expect(detectCondition('my posture is awful')).toBe('poor_posture');
    expect(detectCondition('I think I am dehydrated')).toBe('dehydration');
    expect(detectCondition('my hair is so dry and frizzy')).toBe('dry_hair');
    expect(detectCondition('so many blackheads')).toBe('clogged_pores');
    expect(detectCondition('muscle soreness after the gym')).toBe('sore_muscles');
    expect(detectCondition('my mouth is dry all the time')).toBe('dry_mouth');
    expect(detectCondition('I hate my body lately')).toBe('low_self_esteem');
  });

  it('routes word-order-dependent conditions regardless of phrasing', () => {
    expect(detectCondition('my nose is so blocked')).toBe('stuffy_nose');
    expect(detectCondition('my skin looks dull')).toBe('dull_skin');
    expect(detectCondition('I keep waking up at night')).toBe('night_waking');
    expect(detectCondition('woke up at 3am again')).toBe('night_waking');
    expect(detectCondition('so nervous about my exam')).toBe('exam_nerves');
    expect(detectCondition('acne scars on my cheeks')).toBe('acne_scars');
    expect(detectCondition('thigh chafing is killing me')).toBe('chafing');
    expect(detectCondition('I keep having nightmares')).toBe('nightmares');
  });

  it('does not steal messages that belong to earlier conditions', () => {
    expect(detectCondition('I leak when I cough')).toBe('pelvic_floor_weakness');
    expect(detectCondition('I wake up sweating at night')).toBe('night_sweats');
    expect(detectCondition('corners of my mouth are dry and cracked')).toBe('cracked_mouth_corners');
    expect(detectCondition('hay fever and a stuffy nose')).toBe('seasonal_allergies');
    expect(detectCondition('pregnancy test made me anxious')).toBe('anxiety');
    expect(detectCondition('I feel burned out')).toBe('burnout');
    expect(detectCondition('I cannot sleep')).toBe('sleep');
    expect(detectCondition('painful breakouts on my neck')).toBe('acne_body');
    expect(detectCondition('my eyes are so dry')).toBe('dry_eyes');
  });

  it('uses word boundaries so ordinary words do not misroute', () => {
    expect(detectCondition('for example my cramps are bad')).toBe('cramps');
    expect(detectCondition('I scarf down food and feel bloated')).toBe('bloating');
  });
});

describe('detectCondition — batch 6', () => {
  it('routes every new batch 6 condition', () => {
    expect(detectCondition('my eyes are so itchy')).toBe('itchy_eyes');
    expect(detectCondition('itchy eyes every spring')).toBe('itchy_eyes');
    expect(detectCondition('athlete\'s foot is back')).toBe('athletes_foot');
    expect(detectCondition('I think I have athletes foot')).toBe('athletes_foot');
    expect(detectCondition('I have a wart on my finger')).toBe('warts');
    expect(detectCondition('verruca on my foot')).toBe('warts');
    expect(detectCondition('blisters on my feet from new shoes')).toBe('friction_blisters');
    expect(detectCondition('woke up with a stiff neck')).toBe('stiff_neck');
    expect(detectCondition('so jittery after coffee')).toBe('caffeine_jitters');
    expect(detectCondition('too much caffeine today')).toBe('caffeine_jitters');
    expect(detectCondition('terrible jet lag')).toBe('jet_lag');
    expect(detectCondition('I am on my phone too much')).toBe('phone_overuse');
    expect(detectCondition('I keep doomscrolling')).toBe('phone_overuse');
    expect(detectCondition('I am so homesick')).toBe('homesickness');
    expect(detectCondition('I have no motivation')).toBe('low_motivation');
    expect(detectCondition('I am so forgetful lately')).toBe('forgetfulness');
    expect(detectCondition('I keep crying for no reason')).toBe('crying_spells');
    expect(detectCondition('my heart is racing')).toBe('racing_heart');
    expect(detectCondition('I get palpitations')).toBe('racing_heart');
    expect(detectCondition('razor burn after shaving')).toBe('razor_burn');
    expect(detectCondition('my hands are dry and cracked')).toBe('dry_hands');
    expect(detectCondition('ingrown toenail hurts')).toBe('ingrown_toenail');
    expect(detectCondition('my pad is causing a rash')).toBe('pad_irritation');
    expect(detectCondition('pad irritation during my period')).toBe('pad_irritation');
    expect(detectCondition('my hair is not growing')).toBe('slow_hair_growth');
    expect(detectCondition('fine lines around my eyes')).toBe('fine_lines');
    expect(detectCondition('I got a bad suntan')).toBe('suntan');
    expect(detectCondition('my lips are dark')).toBe('dark_lips');
    expect(detectCondition('dark knees and elbows')).toBe('dark_knees_elbows');
    expect(detectCondition('I have the hiccups')).toBe('hiccups');
    expect(detectCondition('I bite my nails when stressed')).toBe('nail_biting');
    expect(detectCondition('I chew my nails all the time')).toBe('nail_biting');
    expect(detectCondition('my pad itches and I have a rash')).toBe('pad_irritation');
    expect(detectCondition('twitching eyelid')).toBe('eye_twitching');
    expect(detectCondition('my teeth are yellow')).toBe('stained_teeth');
  });

  it('does not steal messages that belong to earlier conditions', () => {
    expect(detectCondition('I have an itchy scalp')).toBe('itchy_scalp');
    expect(detectCondition('vaginal itching')).toBe('vaginal_itching');
    expect(detectCondition('I feel itchy down there')).toBe('vaginal_itching');
    expect(detectCondition('eye twitching')).toBe('eye_twitching');
    expect(detectCondition('razor bumps on my bikini line')).toBe('ingrown_hairs');
    expect(detectCondition('fever blister on my lip')).toBe('cold_sores');
    expect(detectCondition('my lips are dry and cracked')).toBe('chapped_lips');
    expect(detectCondition('wrist and hand pain')).toBe('wrist_hand_pain');
    expect(detectCondition('my hands are sweaty')).toBe('sweaty_palms');
    expect(detectCondition('my teeth hurt')).toBe('sensitive_teeth');
    expect(detectCondition('I wake up feeling anxious')).toBe('anxiety');
    expect(detectCondition('burning thigh chafing')).toBe('chafing');
    expect(detectCondition('nails are brittle and peeling')).toBe('brittle_nails');
    expect(detectCondition('I feel anxious and my heart is racing')).toBe('anxiety');
    expect(detectCondition('cracked heels')).toBe('cracked_heels');
  });
});

describe('detectCondition — batch 7 (final 6)', () => {
  it('routes every new batch 7 condition', () => {
    expect(detectCondition('my hair is going grey so early')).toBe('premature_grey_hair');
    expect(detectCondition('I have grey hair at 22')).toBe('premature_grey_hair');
    expect(detectCondition('I think I have a cold')).toBe('common_cold');
    expect(detectCondition('I have a bad cold')).toBe('common_cold');
    expect(detectCondition('coming down with a cold')).toBe('common_cold');
    expect(detectCondition('my legs are so tired after work')).toBe('tired_legs_feet');
    expect(detectCondition('my feet are aching')).toBe('tired_legs_feet');
    expect(detectCondition('my legs feel heavy')).toBe('tired_legs_feet');
    expect(detectCondition('sore feet from standing all day')).toBe('tired_legs_feet');
    expect(detectCondition('my nose is so dry')).toBe('dry_nose');
    expect(detectCondition('dry nose at night')).toBe('dry_nose');
    expect(detectCondition('crusty nose every morning')).toBe('dry_nose');
    expect(detectCondition('I keep sneezing')).toBe('sneezing');
    expect(detectCondition('sneezing fits every morning')).toBe('sneezing');
    expect(detectCondition('I am hoarse')).toBe('hoarse_voice');
    expect(detectCondition('I lost my voice')).toBe('hoarse_voice');
    expect(detectCondition('my voice is gone')).toBe('hoarse_voice');
  });

  it('does not steal messages that belong to earlier conditions', () => {
    expect(detectCondition('I have a cold sore')).toBe('cold_sores');
    expect(detectCondition('I have cold hands and feet')).toBe('cold_hands_feet');
    expect(detectCondition('I keep catching colds')).toBe('frequent_colds');
    expect(detectCondition('swollen feet and ankles')).toBe('swollen_ankles_feet');
    expect(detectCondition('leg cramps at night')).toBe('leg_cramps');
    expect(detectCondition('restless legs at night')).toBe('restless_legs');
    expect(detectCondition('cracked heels')).toBe('cracked_heels');
    expect(detectCondition('athlete\'s foot is back')).toBe('athletes_foot');
    expect(detectCondition('I am so tired all the time')).toBe('fatigue');
    expect(detectCondition('my eyes feel tired from screens')).toBe('eye_strain');
    expect(detectCondition('I leak when I sneeze')).toBe('pelvic_floor_weakness');
    expect(detectCondition('hay fever and sneezing')).toBe('seasonal_allergies');
    expect(detectCondition('sore throat and hoarse')).toBe('sore_throat');
    expect(detectCondition('sneezing and a blocked nose')).toBe('stuffy_nose');
    expect(detectCondition('dry skin on my legs')).toBe('dry_skin');
    expect(detectCondition('legs sore after the gym')).not.toBe('tired_legs_feet');
    expect(detectCondition('dry skin on my nose')).toBe('dry_skin');
  });
});
