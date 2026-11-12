// What to do after a missed contraceptive pill. Follows the mainstream
// FSRH / NHS / CDC guidance. Deliberately conservative: when in doubt the advice
// is "use condoms and ask a pharmacist or clinician".
import { addDays } from '../calculators';

export type PillType = 'combined' | 'pop-3h' | 'pop-12h' | 'pop-24h';
export type Lateness = 'within-window' | 'one-missed' | 'two-plus-missed';
export type PackWeek = 1 | 2 | 3;

export interface MissedPillInput {
  pill: PillType;
  lateness: Lateness;
  /** Combined pill only: which week of the pack the missed pills fell in. */
  week: PackWeek;
  /** Combined pill only. A 28-day pack has 7 inactive pills; a 21-day pack has a 7-day break. */
  packDays: 21 | 28;
  /** Sex without a condom in the last 5 days (or, for the combined pill, in the pill-free break). */
  unprotectedSex: boolean;
  /** The day the missed pill is taken (today when taking it now). Optional. */
  takeDate: Date | null;
}

export interface MissedPillAdvice {
  level: 'ok' | 'caution';
  headline: string;
  steps: string[];
  /** Days of condoms (or no sex) needed after taking the missed pill. */
  backupDays: number;
  /** First day she can rely on the pill again, when a date was given. */
  protectedFrom: Date | null;
  emergency: 'not-needed' | 'ask';
  emergencyText: string;
  skipBreak: boolean;
  pregnancyTestNote: string | null;
}

export const POP_WINDOW_HOURS: Record<Exclude<PillType, 'combined'>, number> = { 'pop-3h': 3, 'pop-12h': 12, 'pop-24h': 24 };

const TEST_NOTE = 'Take a pregnancy test about 3 weeks after the sex without a condom, or sooner if your period is late or unusually light.';

export function adviseMissedPill(input: MissedPillInput): MissedPillAdvice {
  return input.pill === 'combined' ? adviseCombined(input) : advisePop(input);
}

const withDate = (take: Date | null, days: number): Date | null => (take && days > 0 ? addDays(take, days) : null);

function adviseCombined(i: MissedPillInput): MissedPillAdvice {
  if (i.lateness === 'within-window') {
    return {
      level: 'ok', headline: 'You are still protected.',
      steps: [
        'Take the late pill as soon as you remember, even if that means taking two pills on the same day.',
        'Take the rest of the pack as usual, at your normal time.',
      ],
      backupDays: 0, protectedFrom: null, emergency: 'not-needed', emergencyText: 'Emergency contraception is not needed.',
      skipBreak: false, pregnancyTestNote: null,
    };
  }
  if (i.lateness === 'one-missed') {
    return {
      level: 'ok', headline: 'Take the missed pill now. You are still protected.',
      steps: [
        'Take the pill you missed as soon as you remember, even if that means two pills on the same day.',
        'Keep taking the rest of the pack at your usual time, including the usual pill-free break or inactive pills.',
        'You do not need condoms or emergency contraception for a single missed pill.',
      ],
      backupDays: 0, protectedFrom: null, emergency: 'not-needed', emergencyText: 'Emergency contraception is not usually needed for one missed pill.',
      skipBreak: false, pregnancyTestNote: null,
    };
  }

  // Two or more missed pills (48 hours or more late).
  const steps = [
    'Take the most recent pill you missed now, even if that means two pills on the same day. Leave any earlier missed pills.',
    'Keep taking the rest of the pack at your usual time.',
    'Use condoms, or avoid sex, until you have taken pills for 7 days in a row.',
  ];
  let skipBreak = false;
  let emergency: MissedPillAdvice['emergency'] = 'not-needed';
  let emergencyText = '';
  if (i.week === 1) {
    if (i.unprotectedSex) {
      emergency = 'ask';
      emergencyText = 'You missed pills in the first week and had sex without a condom (in the pill-free break or since). You may need emergency contraception. Ask a pharmacist or clinic today: it works best the sooner it is taken, and the copper IUD or a pill can work for up to 5 days.';
    } else {
      emergencyText = 'Emergency contraception is not needed if you have not had sex without a condom since your last pill-free break.';
    }
  } else if (i.week === 2) {
    emergencyText = 'Emergency contraception is not usually needed if you took all your pills correctly for the 7 days before the missed ones. If you also missed pills earlier in the pack, choose week 1 above and ask a pharmacist.';
  } else {
    skipBreak = true;
    steps.push(
      i.packDays === 28
        ? 'Finish the active pills in this pack, then skip the inactive (reminder) pills and start the next pack straight away.'
        : 'Finish this pack, then start the next pack straight away with no 7-day break.',
    );
    emergencyText = 'Emergency contraception is not usually needed if you took all your pills correctly for the 7 days before the missed ones. If you also missed pills earlier in the pack, ask a pharmacist.';
  }
  if (skipBreak) steps.push('You may not have a period until the end of the next pack. Light spotting is common. If you have no bleed after finishing the next pack, take a pregnancy test.');

  return {
    level: 'caution',
    headline: 'Take the missed pill now and use condoms for 7 days.',
    steps, backupDays: 7, protectedFrom: withDate(i.takeDate, 7), emergency, emergencyText, skipBreak,
    pregnancyTestNote: emergency === 'ask' ? TEST_NOTE : null,
  };
}

function advisePop(i: MissedPillInput): MissedPillAdvice {
  const hours = POP_WINDOW_HOURS[i.pill as Exclude<PillType, 'combined'>];
  if (i.lateness === 'within-window') {
    return {
      level: 'ok', headline: 'You are still protected.',
      steps: [
        `Take the pill as soon as you remember. Being less than ${hours} hours late is within this pill's window.`,
        'Take the next pill at your usual time, even if that means two pills on the same day.',
      ],
      backupDays: 0, protectedFrom: null, emergency: 'not-needed', emergencyText: 'Emergency contraception is not needed.',
      skipBreak: false, pregnancyTestNote: null,
    };
  }
  const backup = i.pill === 'pop-24h' ? 7 : 2;
  const steps = [
    'Take one missed pill now. If you missed several, take just one and skip the rest.',
    'Take the next pill at your usual time, even if that means two pills on the same day.',
    `Use condoms, or avoid sex, for the next ${backup} days.`,
  ];
  const emergency: MissedPillAdvice['emergency'] = i.unprotectedSex ? 'ask' : 'not-needed';
  return {
    level: 'caution',
    headline: `Take the missed pill now and use condoms for ${backup} days.`,
    steps, backupDays: backup, protectedFrom: withDate(i.takeDate, backup), emergency,
    emergencyText: i.unprotectedSex
      ? 'You had sex without a condom after missing a pill. You may need emergency contraception. Ask a pharmacist or clinic today: it works best the sooner it is taken, and the copper IUD or a pill can work for up to 5 days.'
      : 'Emergency contraception is not needed if you have not had sex without a condom since the missed pill.',
    skipBreak: false, pregnancyTestNote: i.unprotectedSex ? TEST_NOTE : null,
  };
}
