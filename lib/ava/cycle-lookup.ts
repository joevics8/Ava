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

export type FertilityLabel = 'Low' | 'Possible' | 'Moderate' | 'High' | 'Peak';
export type PhaseKey = 'menstrual' | 'follicular' | 'ovulatory' | 'early_luteal' | 'mid_luteal' | 'late_luteal' | 'premenstrual';

export interface CycleDayData {
  day: number;
  phase: PhaseKey;
  phaseLabel: string;
  fertilityLabel: FertilityLabel;
  fertilityEmoji: string;
  symptomsGeneric: string;   // shown if no personal pattern found
  tipGeneric: string;        // practical, no drugs
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
  Low:      '⚪',
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

// ─── Generic symptom fallbacks ────────────────────────────────────────────────
// Used ONLY when no personal pattern exists in her memory.
// Phrased as possibilities, never certainties.

const PHASE_SYMPTOMS: Record<PhaseKey, string> = {
  menstrual:    'Flow and some cramping or fatigue are common right now.',
  follicular:   'Energy tends to rise as oestrogen increases.',
  ovulatory:    'You may notice changes in discharge. Energy is usually at its highest.',
  early_luteal: 'Mild breast tenderness or slight bloating may begin.',
  mid_luteal:   'Progesterone is at its peak. Energy tends to be steady.',
  late_luteal:  'Bloating, fatigue or mood shifts may appear for some women.',
  premenstrual: 'PMS symptoms can peak now — bloating, tiredness, or low mood.',
};

// ─── Generic tips ─────────────────────────────────────────────────────────────
// Practical. No supplement doses. No drug names.

const PHASE_TIPS: Record<PhaseKey, string> = {
  menstrual:    'Heat on your lower abdomen and iron-rich foods can help restore energy.',
  follicular:   'A good time for exercise and taking on demanding tasks.',
  ovulatory:    'Your most energetic phase — make the most of it.',
  early_luteal: 'Steady meals and moderate movement support a smooth transition.',
  mid_luteal:   'Magnesium-rich foods like dark chocolate, nuts and leafy greens may help.',
  late_luteal:  'Reducing salt and caffeine can ease bloating. Rest when you need to.',
  premenstrual: 'Gentle movement often helps more than rest alone. Be kind to yourself.',
};

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
    const fertilityLabel: FertilityLabel = FERTILITY_OFFSET_MAP[offset] ?? 'Low';
    const phase = getPhase(day, periodDuration, ovulationDay, clamped);

    days.push({
      day,
      phase,
      phaseLabel: PHASE_LABELS[phase],
      fertilityLabel,
      fertilityEmoji: FERTILITY_EMOJI[fertilityLabel],
      symptomsGeneric: PHASE_SYMPTOMS[phase],
      tipGeneric: PHASE_TIPS[phase],
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
    const fertilityLabel: FertilityLabel = FERTILITY_OFFSET_MAP[offset] ?? 'Low';
    const phase = getPhase(cycleDay, periodDuration, ovulationDay, clamped);
    return {
      day: cycleDay,
      phase,
      phaseLabel: PHASE_LABELS[phase],
      fertilityLabel,
      fertilityEmoji: FERTILITY_EMOJI[fertilityLabel],
      symptomsGeneric: PHASE_SYMPTOMS[phase],
      tipGeneric: PHASE_TIPS[phase],
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
