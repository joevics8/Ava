// Scoring for the "implantation bleeding or period?" quiz. Each answer points
// toward one pattern. This describes typical tendencies only: it cannot tell
// the two apart (only a pregnancy test or a clinician can).

export type Timing = 'days-8-to-3' | 'days-2-to-0' | 'after-due' | 'unsure';
export type Colour = 'pink-brown' | 'red';
export type Flow = 'spotting' | 'light' | 'heavy';
export type Duration = 'short' | 'long';
export type Clots = 'no' | 'yes';
export type Cramps = 'none-mild' | 'strong';

export interface QuizAnswers {
  timing: Timing; colour: Colour; flow: Flow; duration: Duration; clots: Clots; cramps: Cramps;
}
export interface RedFlags {
  soaking: boolean;        // soaking a pad or more every hour for 2+ hours
  oneSidedPain: boolean;   // severe pain, especially on one side
  faint: boolean;          // dizziness, fainting
  shoulderTip: boolean;    // pain at the tip of the shoulder
}

export type Verdict = 'implantation' | 'period' | 'mixed';

export interface Reason { side: 'implantation' | 'period'; text: string }
export interface QuizResult {
  implantationScore: number;
  periodScore: number;
  verdict: Verdict;
  reasons: Reason[];
  /** True when any urgent-care sign is ticked. Overrides everything else. */
  urgent: boolean;
}

export const NO_FLAGS: RedFlags = { soaking: false, oneSidedPain: false, faint: false, shoulderTip: false };
export const hasRedFlag = (f: RedFlags) => f.soaking || f.oneSidedPain || f.faint || f.shoulderTip;

export function scoreQuiz(a: QuizAnswers, flags: RedFlags = NO_FLAGS): QuizResult {
  let imp = 0;
  let per = 0;
  const reasons: Reason[] = [];
  const add = (side: 'implantation' | 'period', points: number, text: string) => {
    if (side === 'implantation') imp += points; else per += points;
    reasons.push({ side, text });
  };

  switch (a.timing) {
    case 'days-8-to-3': add('implantation', 2, 'It started about 3 to 8 days before your period was due, which is when implantation can happen (roughly 6 to 12 days after ovulation).'); break;
    case 'days-2-to-0': add('period', 1, 'It started within 2 days of your expected period, which is more typical of an early period.'); break;
    case 'after-due': add('period', 2, 'It started on or after the day your period was due. Implantation usually happens before that point.'); break;
    case 'unsure': break;
  }
  if (a.colour === 'pink-brown') add('implantation', 1, 'Light pink or brown blood is typical of spotting.');
  else add('period', 1, 'Bright or dark red blood is more typical of a period.');

  if (a.flow === 'spotting') add('implantation', 1, 'A few spots, not enough to fill a pad, is typical of implantation spotting.');
  else if (a.flow === 'heavy') add('period', 2, 'A flow that needs a pad or tampon is typical of a period.');

  if (a.duration === 'short') add('implantation', 1, 'Bleeding that lasts from a few hours to about two days fits implantation spotting.');
  else add('period', 1, 'Bleeding that lasts three days or more fits a period better.');

  if (a.clots === 'yes') add('period', 1, 'Clots are uncommon with implantation spotting.');

  if (a.cramps === 'none-mild') add('implantation', 1, 'No cramps, or only mild brief twinges, fits implantation.');
  else add('period', 1, 'Moderate to strong cramping that builds is more typical of a period.');

  const diff = imp - per;
  let verdict: Verdict = diff >= 3 ? 'implantation' : diff <= -3 ? 'period' : 'mixed';
  // A heavy flow is never described as implantation spotting, whatever else was ticked.
  if (a.flow === 'heavy' && verdict === 'implantation') verdict = 'mixed';

  return { implantationScore: imp, periodScore: per, verdict, reasons, urgent: hasRedFlag(flags) };
}
