// A short, non-diagnostic perimenopause / menopause transition checklist.
// It describes how closely a self-reported pattern resembles the usual picture
// and, just as importantly, what this picture does NOT explain. It never
// diagnoses. Age and period-pattern information follow NHS, NICE, Mayo Clinic
// and FSRH summaries: menopause is confirmed after 12 months without a period,
// the average age in the UK is about 51 (usual range 45 to 55), and
// perimenopause usually starts in the 40s.

export type PeriodStatus =
  | 'regular'          // still regular, much as usual
  | 'changed'          // timing or flow has changed
  | 'skipping'         // skipping periods, gaps of about 2 months or more
  | 'stopped-under-12' // no period for 3 to 11 months
  | 'stopped-12-plus'  // no period for 12 months or more
  | 'not-applicable';  // hormonal contraception, hormonal coil, hysterectomy, pregnancy, breastfeeding

export type SymptomId =
  | 'hot-flushes' | 'night-sweats' | 'vaginal-dryness'
  | 'sleep' | 'mood' | 'brain-fog' | 'joints' | 'urinary' | 'libido' | 'headaches';

export type FlagId =
  | 'very-heavy-bleeding' | 'long-periods' | 'short-cycles' | 'bleeding-between' | 'bleeding-after-12-months'
  | 'thyroid-overactive' | 'thyroid-underactive' | 'pelvic-pain' | 'could-be-pregnant'
  | 'chest-pain' | 'self-harm';

export interface SymptomDef { id: SymptomId; label: string; weight: 1 | 2 }
export interface FlagDef { id: FlagId; label: string; level: 'urgent' | 'soon'; why: string }

/** Weight 2 = more typical of falling oestrogen; weight 1 = common but non-specific. */
export const SYMPTOMS: SymptomDef[] = [
  { id: 'hot-flushes', label: 'Hot flushes (sudden waves of heat, flushed face or neck)', weight: 2 },
  { id: 'night-sweats', label: 'Night sweats that wake you or soak the bedding', weight: 2 },
  { id: 'vaginal-dryness', label: 'Vaginal dryness, itching or discomfort during sex', weight: 2 },
  { id: 'sleep', label: 'Trouble falling or staying asleep', weight: 1 },
  { id: 'mood', label: 'Low mood, anxiety or irritability that is new for you', weight: 1 },
  { id: 'brain-fog', label: 'Brain fog or poor memory', weight: 1 },
  { id: 'joints', label: 'Aching joints or muscles', weight: 1 },
  { id: 'urinary', label: 'More urinary urgency, leaking or urine infections', weight: 1 },
  { id: 'libido', label: 'Lower sex drive', weight: 1 },
  { id: 'headaches', label: 'More frequent headaches or migraines', weight: 1 },
];

export const FLAGS: FlagDef[] = [
  { id: 'self-harm', level: 'urgent', label: 'Feeling hopeless, or having thoughts of harming yourself',
    why: 'Mood changes can be linked to hormone changes, but these feelings need support today whatever the cause.' },
  { id: 'chest-pain', level: 'urgent', label: 'Chest pain, fainting, or a heartbeat that is racing with breathlessness',
    why: 'Palpitations can happen in perimenopause, but chest pain, fainting or breathlessness need urgent checking.' },
  { id: 'bleeding-after-12-months', level: 'soon', label: 'Any vaginal bleeding after 12 months or more with no period',
    why: 'Bleeding after menopause is not explained by perimenopause. It is usually not serious, but it must always be checked.' },
  { id: 'very-heavy-bleeding', level: 'soon', label: 'Very heavy bleeding (soaking a pad or tampon every hour or two, or passing large clots)',
    why: 'Periods can become heavier in perimenopause, but very heavy bleeding can cause anaemia and has other causes such as fibroids or polyps.' },
  { id: 'bleeding-between', level: 'soon', label: 'Bleeding between periods or after sex',
    why: 'Spotting between periods or after sex is not a normal part of the change and needs a check.' },
  { id: 'long-periods', level: 'soon', label: 'Periods lasting longer than 7 days',
    why: 'Longer bleeds are worth checking, because fibroids, polyps and thyroid problems can cause them.' },
  { id: 'short-cycles', level: 'soon', label: 'Periods less than 21 days apart',
    why: 'Cycles that keep coming closer than 3 weeks apart are worth checking, even though shorter cycles can be an early change.' },
  { id: 'thyroid-overactive', level: 'soon', label: 'A racing or pounding heartbeat, trembling, feeling too hot all the time, or unplanned weight loss',
    why: 'An overactive thyroid can look very like perimenopause, and a simple blood test can tell the difference.' },
  { id: 'thyroid-underactive', level: 'soon', label: 'Constant tiredness with feeling cold, constipation, dry skin or hair thinning',
    why: 'An underactive thyroid is common in midlife and can cause tiredness, mood changes and period changes.' },
  { id: 'pelvic-pain', level: 'soon', label: 'Pelvic pain or bloating that does not settle',
    why: 'Persistent bloating or pelvic pain is not explained by perimenopause and should be checked.' },
  { id: 'could-be-pregnant', level: 'soon', label: 'Late or missed period and you could be pregnant',
    why: 'You can still get pregnant while periods are irregular. A pregnancy test is the first step.' },
];

export interface PerimenopauseInput {
  age: number;
  periods: PeriodStatus;
  symptoms: SymptomId[];
  flags: FlagId[];
}

export type Pattern = 'low' | 'partial' | 'close' | 'menopause-reached';
export type Urgency = 'urgent' | 'soon' | 'routine' | 'none';

export interface PerimenopauseResult {
  pattern: Pattern;
  headline: string;
  summary: string;
  agePoints: string;
  /** Short list of the features that fit, for the user to bring to an appointment. */
  fits: string[];
  /** Reasons the pattern is NOT explained by perimenopause (from the flags she ticked). */
  notExplained: { id: FlagId; label: string; why: string }[];
  urgency: Urgency;
  doctorAdvice: string;
  /** Extra caveats (contraception, pregnancy, age). */
  caveats: string[];
}

export const MIN_AGE = 18;
export const MAX_AGE = 80;

export function validAge(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_AGE && n <= MAX_AGE;
}

const PERIOD_POINTS: Record<PeriodStatus, number> = {
  regular: 0, changed: 3, skipping: 4, 'stopped-under-12': 4, 'stopped-12-plus': 4, 'not-applicable': 0,
};

function agePoints(age: number): number {
  if (age < 40) return 0;
  if (age < 45) return 1;
  if (age <= 55) return 2;
  if (age <= 60) return 1;
  return 0;
}

export function ageContext(age: number): string {
  if (age < 40) return 'Menopause before 40 is called premature menopause or premature ovarian insufficiency. It is uncommon, and symptoms like these at your age are more often caused by something else, so they are worth checking.';
  if (age < 45) return 'Menopause between 40 and 45 is called early menopause. Perimenopause this early is less common but does happen, and it is worth discussing with a doctor.';
  if (age <= 55) return 'Menopause usually happens between 45 and 55, and the average age in the UK is about 51. Perimenopause usually starts in the 40s and lasts several years, on average 4 years, though for some women it is much longer.';
  return 'Most women reach menopause by their mid-50s. Ongoing period changes after that are less typical and worth mentioning to a doctor.';
}

export function assessPerimenopause(input: PerimenopauseInput): PerimenopauseResult {
  const { age, periods } = input;
  const symptoms = SYMPTOMS.filter(s => input.symptoms.includes(s.id));
  const symptomPts = symptoms.reduce((n, s) => n + s.weight, 0);
  const flagged = FLAGS.filter(f => input.flags.includes(f.id));
  const total = agePoints(age) + PERIOD_POINTS[periods] + symptomPts;

  let pattern: Pattern = total >= 9 ? 'close' : total >= 5 ? 'partial' : 'low';
  if (periods === 'stopped-12-plus' && age >= 40) pattern = 'menopause-reached';
  // A pattern under 40 is never described as "close": other causes come first.
  if (age < 40 && pattern === 'close') pattern = 'partial';
  // Without period information (contraception etc.) only symptoms can be judged, so be modest.
  if (periods === 'not-applicable' && pattern === 'close') pattern = 'partial';

  const fits: string[] = [];
  if (periods === 'changed') fits.push('Your periods have changed in timing or flow');
  if (periods === 'skipping') fits.push('You are skipping periods');
  if (periods === 'stopped-under-12') fits.push('Your periods have stopped for 3 to 11 months');
  if (periods === 'stopped-12-plus') fits.push('You have had no period for 12 months or more');
  if (age >= 40 && age <= 55) fits.push(`Your age (${age}) is within the usual range for the menopause transition`);
  symptoms.forEach(s => fits.push(s.label.split(' (')[0]));

  const caveats: string[] = [];
  if (periods === 'not-applicable') caveats.push('Hormonal contraception, a hormonal coil, a hysterectomy, pregnancy or breastfeeding can hide period changes or cause similar symptoms, so your periods are not a useful guide. A doctor can help work out what is going on.');
  if (age < 55 && periods !== 'not-applicable') caveats.push('You can still get pregnant while periods are irregular. Keep using contraception until a doctor tells you it is safe to stop (usually 2 years after your last period if you are under 50, or 1 year if you are over 50).');
  if (input.flags.includes('could-be-pregnant')) caveats.push('Take a pregnancy test before putting symptoms down to perimenopause.');

  const flagUrgent = flagged.some(f => f.level === 'urgent');
  const flagSoon = flagged.some(f => f.level === 'soon');
  const underFortyConcern = age < 40 && (periods === 'skipping' || periods === 'stopped-under-12' || periods === 'stopped-12-plus');
  const under45Stopped = age >= 40 && age < 45 && (periods === 'skipping' || periods === 'stopped-under-12' || periods === 'stopped-12-plus');

  let urgency: Urgency = 'none';
  let doctorAdvice = 'Nothing here suggests you need to rush. If symptoms, period changes or your mood start to worry you or affect daily life, book a routine appointment.';
  if (flagUrgent) {
    urgency = 'urgent';
    doctorAdvice = 'You ticked something that needs help today. Please contact a doctor, an urgent care service or an emergency line now, or tell someone you trust. If you are in immediate danger, call your local emergency number.';
  } else if (flagSoon || underFortyConcern) {
    urgency = 'soon';
    doctorAdvice = underFortyConcern && !flagSoon
      ? 'Periods that skip or stop before 40 need a proper check. Book an appointment in the next few days or weeks rather than waiting.'
      : 'Please book an appointment with a doctor soon, rather than waiting to see how things go. These features are not explained by perimenopause alone, and most causes are treatable.';
  } else if (under45Stopped || pattern === 'partial' || pattern === 'close' || pattern === 'menopause-reached' || symptoms.length > 0) {
    urgency = 'routine';
    doctorAdvice = 'Consider a routine appointment, especially if symptoms disturb your sleep, mood, work or relationships. Treatments exist, including hormone therapy and options without hormones, and you do not need to wait until periods stop.';
  }

  const headlines: Record<Pattern, string> = {
    close: 'Your answers closely resemble the menopause transition',
    partial: 'Your answers partly resemble the menopause transition',
    low: 'Your answers do not strongly resemble the menopause transition',
    'menopause-reached': 'No period for 12 months or more fits the definition of menopause',
  };
  const summaries: Record<Pattern, string> = {
    close: 'Several features that commonly go together in perimenopause appear in your answers. This is a pattern match, not a diagnosis, and only a doctor can say what is causing your symptoms.',
    partial: 'Some features fit, but there is not enough of a pattern to say much. Other causes of the same symptoms are common, so it is worth tracking your cycle and symptoms for a few months.',
    low: 'Few or none of the usual features appear. That is reassuring, but it does not rule anything out. Many other things can cause the symptoms you may have, and perimenopause can begin gradually.',
    'menopause-reached': 'Menopause is confirmed after 12 months in a row without a period, when there is no other reason such as pregnancy, hormonal contraception or surgery. Any bleeding from now on needs to be checked by a doctor.',
  };

  return {
    pattern, headline: headlines[pattern], summary: summaries[pattern], agePoints: ageContext(age),
    fits, notExplained: flagged.map(f => ({ id: f.id, label: f.label, why: f.why })),
    urgency, doctorAdvice, caveats,
  };
}
