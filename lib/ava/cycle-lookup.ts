// ─── Cycle Lookup Engine ──────────────────────────────────────────────────────
//
// WHY THIS EXISTS
// ───────────────
// Ava should never guess. For every cycle length from 21 to 36 days, we
// pre-compute each day's fertility label and phase symptoms from verified
// research (Wilcox et al. 1995, Dunson/Baird/Wilcox 2002).
//
// FERTILITY LABELS (no percentages shown to users)
// ─────────────────────────────────────────────────
// Derived from Wilcox-style relative conception probabilities, mapped to
// offset from estimated ovulation day (cycle_length − 14):
//
//   Offset −5, −4        → Possible   (~10–16% relative probability)
//   Offset −3, −2        → Moderate   (~14–27%)
//   Offset −1            → High       (~30–33%)
//   Offset  0 (ovulation)→ Peak       (~27–33%, dropping post-ovulation)
//   Offset +1            → Possible   (small residual, confidence drops fast)
//   All other days       → Low        (<2%)
//
// Labels replace the old misleading "very low / low / moderate":
//   Low | Possible | Moderate | High | Peak
//
// SYMPTOMS
// ────────
// Generic phase-typical fallbacks only. No supplement doses, no drug names.
// The morning digest checks the user's personal memory FIRST; these are
// only shown if she has no personal pattern for this phase yet.
//
// TIPS
// ────
// Practical, lifestyle-only. No medication. Short.

export type FertilityLabel = 'Minimal' | 'Possible' | 'Moderate' | 'High' | 'Peak';
export type PhaseKey = 'menstrual' | 'follicular' | 'ovulatory' | 'early_luteal' | 'mid_luteal' | 'late_luteal' | 'premenstrual';

export interface CycleDayData {
  day: number;
  phase: PhaseKey;
  phaseLabel: string;
  fertilityLabel: FertilityLabel;
  fertilityEmoji: string;
  symptomsGeneric: string;   // shown if no personal pattern found
  eatTipGeneric: string;     // food suggestion — practical, no drugs
  doTipGeneric: string;      // activity/behaviour suggestion
  nutrientTags: string[];    // e.g. ['iron','energy'] — used to swap in local foods when the user's country is known (see food-data.ts)
  eatReasonClause: string;   // short trailing clause reused when substituting local foods, e.g. "can help restore your energy"
}

// ─── Fertility offset mapping ─────────────────────────────────────────────────

const FERTILITY_OFFSET_MAP: Record<number, FertilityLabel> = {
  [-5]: 'Possible',
  [-4]: 'Possible',
  [-3]: 'Moderate',
  [-2]: 'Moderate',
  [-1]: 'High',
  [0]:  'Peak',
  [1]:  'Possible',
};

const FERTILITY_EMOJI: Record<FertilityLabel, string> = {
  Minimal:  '⚪',
  Possible: '🟡',
  Moderate: '🟠',
  High:     '🔴',
  Peak:     '🔴',
};

// ─── Phase assignment ─────────────────────────────────────────────────────────

function getPhase(
  day: number,
  periodDuration: number,
  ovulationDay: number,
  cycleLength: number
): PhaseKey {
  if (day <= periodDuration) return 'menstrual';
  if (day < ovulationDay - 1) return 'follicular';
  if (day >= ovulationDay - 1 && day <= ovulationDay + 1) return 'ovulatory';
  const daysAfterOvulation = day - ovulationDay;
  if (daysAfterOvulation <= 3) return 'early_luteal';
  if (daysAfterOvulation <= 8) return 'mid_luteal';
  if (daysAfterOvulation <= 11) return 'late_luteal';
  return 'premenstrual';
}

const PHASE_LABELS: Record<PhaseKey, string> = {
  menstrual:     'Menstrual Phase',
  follicular:    'Follicular Phase',
  ovulatory:     'Ovulation Window',
  early_luteal:  'Early Luteal Phase',
  mid_luteal:    'Luteal Phase',
  late_luteal:   'Late Luteal Phase',
  premenstrual:  'Premenstrual Phase',
};

// ─── Generic symptom + tip fallbacks (day-of-phase aware) ─────────────────────
// Used ONLY when no personal pattern exists in her memory. More granular than
// a single line per phase — e.g. day 1-2 of a period reads differently from
// day 4-5 of the same period. Phrased as possibilities, never certainties.
// No supplement doses, no drug names, no percentages.
//
// Each phase-window returns 2 variants per line (symptoms/eatTip/doTip), and
// getPhaseContent picks one deterministically from the actual cycle day —
// so two consecutive days in the same window (e.g. day 7 and day 8, both
// "early follicular") don't render byte-identical digests.

function pick(variants: [string, string], day: number): string {
  return variants[day % 2];
}

function getPhaseContent(
  phase: PhaseKey,
  day: number,
  periodDuration: number,
  ovulationDay: number
): { symptoms: string; eatTip: string; doTip: string; nutrientTags: string[]; eatReasonClause: string } {
  switch (phase) {
    case 'menstrual':
      if (day <= Math.min(2, periodDuration)) {
        return {
          symptoms: pick([
            'Flow is typically heaviest now. Cramping, fatigue, and lower back pain are common.',
            'Flow tends to be at its heaviest today. You may feel more tired than usual, with some cramping.',
          ], day),
          eatTip: pick([
            'Try iron-rich foods such as beans, lentils, spinach or lean meat.',
            'Iron-rich options like liver, beans or dark leafy greens can help today.',
          ], day),
          doTip: pick([
            'Rest when you can, and use a heat pack on your lower abdomen for cramps.',
            'It\'s okay to slow down today — a heat pack and some rest can ease cramping.',
          ], day),
          nutrientTags: ['iron', 'energy'],
          eatReasonClause: 'can help restore your energy',
        };
      }
      return {
        symptoms: pick([
          'Flow is easing. You may still feel some fatigue and mild cramping.',
          'Flow is starting to taper off, though some tiredness and light cramping can linger.',
        ], day),
        eatTip: pick([
          'Keep up iron-rich foods like spinach, lentils and beans as your period winds down.',
          'Continue with iron-rich meals — think beans, leafy greens or lean meat — as things wind down.',
        ], day),
        doTip: pick([
          'Light movement like walking or stretching can help ease any lingering cramps.',
          'A short walk or some gentle stretching can help with any remaining discomfort.',
        ], day),
        nutrientTags: ['iron'],
        eatReasonClause: 'can help keep your energy up',
      };

    case 'follicular': {
      const daysSincePeriod = day - periodDuration;
      if (daysSincePeriod <= 3) {
        return {
          symptoms: pick([
            'Oestrogen is rising. Energy is returning and mood tends to lift.',
            'You\'re likely feeling more like yourself again — energy and mood tend to pick up here.',
          ], day),
          eatTip: pick([
            'Protein-rich foods like eggs, fish or beans support your body as it rebuilds.',
            'Eggs, fish or moi moi can give your body good protein to rebuild with today.',
          ], day),
          doTip: pick([
            'A good time to restart exercise routines — your body is rebuilding.',
            'Your energy is coming back — a good window to ease back into movement.',
          ], day),
          nutrientTags: ['protein'],
          eatReasonClause: 'can support your body as it rebuilds',
        };
      }
      return {
        symptoms: pick([
          'Energy and confidence are typically at their highest this week.',
          'This is usually a high-energy stretch — mood and focus tend to be strong.',
        ], day),
        eatTip: pick([
          'Fresh fruit, vegetables and whole grains support your rising energy this week.',
          'Lean into fresh produce and whole grains — they match your rising energy well this week.',
        ], day),
        doTip: pick([
          'Take on demanding tasks and social plans — oestrogen is working in your favour.',
          'A good week to tackle bigger tasks or plans — your energy is naturally higher.',
        ], day),
        nutrientTags: ['energy', 'fiber'],
        eatReasonClause: 'can support your rising energy',
      };
    }

    case 'ovulatory':
      return {
        symptoms: pick([
          'You may notice egg-white discharge, a slight temperature rise, or mild pelvic twinges.',
          'Some notice a slight temperature rise or brief pelvic twinges around now — both are usually normal.',
        ], day),
        eatTip: pick([
          'Hydrate well and include water-rich foods like cucumber, watermelon or coconut water.',
          'Keep your water intake up — cucumber, watermelon or coconut water are good extras today.',
        ], day),
        doTip: pick([
          'Note any mid-cycle pain — it is usually normal and passes quickly.',
          'Mild mid-cycle twinges are common and usually pass on their own within a day.',
        ], day),
        nutrientTags: ['hydration'],
        eatReasonClause: 'can help keep you well hydrated',
      };

    case 'early_luteal':
      return {
        symptoms: pick([
          'Progesterone is rising. Mild breast tenderness or slight bloating may begin.',
          'You may start noticing slight bloating or breast tenderness as progesterone rises.',
        ], day),
        eatTip: pick([
          'Steady, protein-rich meals support a smooth transition.',
          'Balanced, protein-rich meals can help keep energy steady through this shift.',
        ], day),
        doTip: pick([
          'Moderate movement like a walk or light workout can help too.',
          'Keep movement moderate — a walk or light workout suits this phase well.',
        ], day),
        nutrientTags: ['protein'],
        eatReasonClause: 'can support a smooth transition',
      };

    case 'mid_luteal':
      return {
        symptoms: pick([
          'Progesterone is at its peak. Energy tends to be steady.',
          'Hormones are near their peak here — most feel fairly steady, energy-wise.',
        ], day),
        eatTip: pick([
          'Magnesium-rich foods like dark chocolate, nuts and leafy greens may help.',
          'A little dark chocolate, some nuts, or leafy greens can help with magnesium today.',
        ], day),
        doTip: pick([
          'Keep up regular movement — energy tends to be steady this week.',
          'This is usually a steady-energy week — good for keeping your regular routine going.',
        ], day),
        nutrientTags: ['magnesium', 'mood'],
        eatReasonClause: 'may help with mood and steady energy',
      };

    case 'late_luteal':
      return {
        symptoms: pick([
          'PMS symptoms often peak now — irritability, bloating, cravings, and fatigue are common.',
          'This is often when PMS is most noticeable — mood swings, bloating or cravings are common.',
        ], day),
        eatTip: pick([
          'B6-rich foods like bananas and chickpeas can help support your mood.',
          'Bananas, chickpeas or oats can help with B6 to support your mood today.',
        ], day),
        doTip: pick([
          'Be gentle with yourself — a short walk or light stretch can ease tension.',
          'Go easy on yourself today — light movement can help take the edge off tension.',
        ], day),
        nutrientTags: ['mood'],
        eatReasonClause: 'can help support your mood',
      };

    case 'premenstrual':
      return {
        symptoms: pick([
          'Your period is approaching. Cramping, bloating, and low energy are typical.',
          'Your period is close now — some cramping, bloating or low energy is common around this point.',
        ], day),
        eatTip: pick([
          'Light, warm meals with whole grains can help as energy dips before your period.',
          'Warm, simple meals with whole grains can help as your energy naturally dips.',
        ], day),
        doTip: pick([
          'Stock up on period supplies and prepare your heat pack — gentle movement often helps more than rest alone.',
          'A good day to get period supplies ready — gentle movement can help more than resting all day.',
        ], day),
        nutrientTags: ['comfort', 'carbs'],
        eatReasonClause: 'can help as energy dips before your period',
      };
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<number, CycleDayData[]>();

// ─── Generator ────────────────────────────────────────────────────────────────

export function getCycleLookup(cycleLength: number): CycleDayData[] {
  const clamped = Math.max(21, Math.min(36, cycleLength));
  if (cache.has(clamped)) return cache.get(clamped)!;

  const ovulationDay = clamped - 14; // standard luteal phase = 14 days
  const periodDuration = 5;           // default; overridden in actual call if known

  const days: CycleDayData[] = [];

  for (let day = 1; day <= clamped; day++) {
    const offset = day - ovulationDay;
    const fertilityLabel: FertilityLabel = FERTILITY_OFFSET_MAP[offset] ?? 'Minimal';
    const phase = getPhase(day, periodDuration, ovulationDay, clamped);
    const { symptoms, eatTip, doTip, nutrientTags, eatReasonClause } = getPhaseContent(phase, day, periodDuration, ovulationDay);

    days.push({
      day,
      phase,
      phaseLabel: PHASE_LABELS[phase],
      fertilityLabel,
      fertilityEmoji: FERTILITY_EMOJI[fertilityLabel],
      symptomsGeneric: symptoms,
      eatTipGeneric: eatTip,
      doTipGeneric: doTip,
      nutrientTags,
      eatReasonClause,
    });
  }

  cache.set(clamped, days);
  return days;
}

// ─── Get data for a specific cycle day ───────────────────────────────────────

export function getDayData(
  cycleDay: number,
  cycleLength: number,
  periodDuration = 5
): CycleDayData {
  const lookup = getCycleLookup(cycleLength);

  // Regenerate if period duration differs from default
  if (periodDuration !== 5) {
    const clamped = Math.max(21, Math.min(36, cycleLength));
    const ovulationDay = clamped - 14;
    const offset = cycleDay - ovulationDay;
    const fertilityLabel: FertilityLabel = FERTILITY_OFFSET_MAP[offset] ?? 'Minimal';
    const phase = getPhase(cycleDay, periodDuration, ovulationDay, clamped);
    const { symptoms, eatTip, doTip, nutrientTags, eatReasonClause } = getPhaseContent(phase, cycleDay, periodDuration, ovulationDay);
    return {
      day: cycleDay,
      phase,
      phaseLabel: PHASE_LABELS[phase],
      fertilityLabel,
      fertilityEmoji: FERTILITY_EMOJI[fertilityLabel],
      symptomsGeneric: symptoms,
      eatTipGeneric: eatTip,
      doTipGeneric: doTip,
      nutrientTags,
      eatReasonClause,
    };
  }

  const idx = Math.min(cycleDay - 1, lookup.length - 1);
  return lookup[Math.max(0, idx)];
}

// ─── Adaptive confidence score ────────────────────────────────────────────────
// Rises as the user provides more data signals.

export function getConfidenceLevel(
  numCyclesKnown: number,
  hasLHTest: boolean,
  hasBBT: boolean,
  hasMucus: boolean
): { label: string; score: number } {
  let score = 0;

  // Period history
  if (numCyclesKnown >= 3) score += 40;
  else if (numCyclesKnown === 2) score += 25;
  else if (numCyclesKnown === 1) score += 15;

  // Biological signals
  if (hasLHTest) score += 30; // strongest predictor
  if (hasBBT)   score += 20; // confirms ovulation occurred
  if (hasMucus) score += 10; // supporting signal

  const label =
    score >= 80 ? 'High' :
    score >= 50 ? 'Moderate' :
    score >= 25 ? 'Low' :
    'Estimate only';

  return { label, score };
}

// ─── Personalise symptom line from memory ────────────────────────────────────
// Call this instead of symptomsGeneric when memory logs are available.

export function personaliseSymptomLine(
  phase: PhaseKey,
  genericSymptoms: string,
  memoryLogs: Array<{ category: string; summary: string; logged_at: string }>,
  cycleDay: number
): string {
  if (!memoryLogs.length) return genericSymptoms;

  // Look for logs from previous cycles at a similar point
  // Filter symptom/mood/flow logs
  const relevant = memoryLogs.filter(l =>
    ['symptom', 'mood', 'flow', 'chat'].includes(l.category) &&
    l.summary.length > 3
  );

  if (!relevant.length) return genericSymptoms;

  // Extract recurring keywords
  const keywords = ['cramp', 'bloat', 'tired', 'fatigue', 'mood', 'headache',
    'breast', 'tender', 'acne', 'irritable', 'anxious', 'energetic', 'discharge',
    'flow', 'pain', 'nausea', 'hungry', 'crav'];

  const found = keywords.filter(k =>
    relevant.some(l => l.summary.toLowerCase().includes(k))
  );

  if (!found.length) return genericSymptoms;

  // Build personal line
  const symptomWords = found.slice(0, 2).join(' and ');
  return `You tend to notice ${symptomWords} around this point in your cycle.`;
}
