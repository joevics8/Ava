// ─── Standard fertility rates by day relative to ovulation ───────────────────
// Based on Wilcox et al. (2000) and Dunson et al. (2002)
// Ovulation day = avgCycleLength - 14

const FERTILITY_BY_OFFSET: Record<number, number> = {
  [-6]: 5,
  [-5]: 10,
  [-4]: 14,
  [-3]: 20,
  [-2]: 26,
  [-1]: 30, // peak — day before ovulation
  [0]: 25,  // ovulation day
  [1]: 8,
  [2]: 3,
  [3]: 1,
};

export function getFertilityRate(cycleDay: number, avgCycleLength: number): number {
  const ovulationDay = avgCycleLength - 14;
  const offset = cycleDay - ovulationDay;
  return FERTILITY_BY_OFFSET[offset] ?? 2; // background ~2% on all other days
}

export function getFertilityLabel(
  rate: number,
  goal: string
): { emoji: string; label: string } {
  const wantsToConceive = goal === 'conceive';
  const wantsToAvoid = goal === 'prevent';

  if (rate >= 28) {
    return wantsToConceive
      ? { emoji: '🟢', label: `Peak fertility — best time to try (${rate}%)` }
      : wantsToAvoid
      ? { emoji: '🔴', label: `Peak fertility — be extra careful today (${rate}%)` }
      : { emoji: '✨', label: `Peak fertility window (${rate}%)` };
  }
  if (rate >= 18) {
    return wantsToConceive
      ? { emoji: '🟡', label: `High fertility — good window to try (${rate}%)` }
      : wantsToAvoid
      ? { emoji: '🟠', label: `Higher fertility — take precautions (${rate}%)` }
      : { emoji: '🟡', label: `High fertility (${rate}%)` };
  }
  if (rate >= 8) {
    return wantsToConceive
      ? { emoji: '⚪', label: `Moderate fertility (${rate}%)` }
      : wantsToAvoid
      ? { emoji: '⚪', label: `Lower risk, but not zero (${rate}%)` }
      : { emoji: '⚪', label: `Moderate fertility (${rate}%)` };
  }
  return wantsToConceive
    ? { emoji: '⚪', label: `Low fertility today (${rate}%)` }
    : wantsToAvoid
    ? { emoji: '🟢', label: `Low fertility — relatively safe (${rate}%)` }
    : { emoji: '⚪', label: `Low fertility today (${rate}%)` };
}

// ─── Pre-calculated phase symptoms by cycle day ───────────────────────────────
// Returns what to expect today based on phase + approximate day within phase

export interface DayInsight {
  symptoms: string;
  tip: string;
  energy: 'low' | 'medium' | 'high';
}

export function getDayInsight(phase: string, dayOfPhase: number): DayInsight {
  switch (phase) {
    case 'menstrual':
      if (dayOfPhase <= 2) return {
        symptoms: 'Flow is typically heaviest now. Cramping, fatigue, and lower back pain are common.',
        tip: 'Rest when you can. A hot water bottle and ginger tea can help with cramps.',
        energy: 'low',
      };
      return {
        symptoms: 'Flow is easing. You may still feel some fatigue and mild cramping.',
        tip: 'Iron-rich foods like spinach and lentils help restore energy as your period winds down.',
        energy: 'low',
      };

    case 'follicular':
      if (dayOfPhase <= 3) return {
        symptoms: 'Oestrogen is rising. Energy is returning and mood tends to lift.',
        tip: 'A good time to restart exercise routines — your body is rebuilding.',
        energy: 'medium',
      };
      return {
        symptoms: 'Energy and confidence are typically at their highest this week.',
        tip: 'Take on demanding tasks and social plans — oestrogen is working in your favour.',
        energy: 'high',
      };

    case 'ovulation':
      return {
        symptoms: 'You may notice egg-white discharge, a slight temperature rise, or mild pelvic twinges.',
        tip: 'Hydrate well and note any mid-cycle pain — it is usually normal and passes quickly.',
        energy: 'high',
      };

    case 'luteal':
      if (dayOfPhase <= 5) return {
        symptoms: 'Progesterone is rising. Slight bloating and breast tenderness may begin.',
        tip: 'Reduce salt and caffeine to ease water retention. Magnesium helps with mood.',
        energy: 'medium',
      };
      if (dayOfPhase <= 10) return {
        symptoms: 'PMS symptoms often peak now — irritability, bloating, cravings, and fatigue are common.',
        tip: 'Be gentle with yourself. B6-rich foods like bananas and chickpeas support mood.',
        energy: 'low',
      };
      return {
        symptoms: 'Your period is approaching. Cramping, bloating, and low energy are typical.',
        tip: 'Stock up on period supplies and prepare your heat pack. Your period is close.',
        energy: 'low',
      };

    default:
      return {
        symptoms: 'Every day of your cycle brings something different.',
        tip: 'Log how you feel today and Ava will spot your patterns over time.',
        energy: 'medium',
      };
  }
}

// ─── Calculate day within current phase ──────────────────────────────────────

export function getDayOfPhase(
  cycleDay: number,
  phase: string,
  avgCycleLength: number,
  periodDuration: number
): number {
  switch (phase) {
    case 'menstrual':
      return cycleDay;
    case 'follicular':
      return cycleDay - periodDuration;
    case 'ovulation':
      return cycleDay - (avgCycleLength - 16);
    case 'luteal':
      return cycleDay - (avgCycleLength - 14);
    default:
      return 1;
  }
}
