// Testing window periods: how long after a possible exposure a test can be
// reliable. Figures follow CDC / NHS guidance. Dates only; nothing is stored.
import { addDays } from '../calculators';

export type Infection = 'hiv' | 'chlamydia' | 'gonorrhoea' | 'syphilis';
export type HivTest = 'nat' | 'lab-ag-ab' | 'rapid-ag-ab' | 'self-test-ab';

export const HIV_TESTS: Record<HivTest, { label: string; earliest: number; conclusive: number }> = {
  nat: { label: 'NAT (RNA) blood test', earliest: 10, conclusive: 33 },
  'lab-ag-ab': { label: 'Lab antigen/antibody blood test', earliest: 18, conclusive: 45 },
  'rapid-ag-ab': { label: 'Rapid antigen/antibody finger-prick test', earliest: 18, conclusive: 90 },
  'self-test-ab': { label: 'Antibody-only home self-test', earliest: 23, conclusive: 90 },
};

export type WindowStatus = 'invalid' | 'too-early' | 'testable' | 'conclusive';

export interface WindowInput { exposure: Date; infection: Infection; hivTest: HivTest; today: Date }

export interface WindowResult {
  status: WindowStatus;
  label: string;
  daysSince: number;
  /** Earliest day a test can pick the infection up reliably (null when no firm earliest figure). */
  earliestDays: number | null;
  conclusiveDays: number;
  earliest: Date | null;
  conclusive: Date;
  /** HIV only, within roughly 3 days of exposure: post-exposure prophylaxis may still work. */
  pepUrgent: boolean;
  notes: string[];
}

const DAY = 86_400_000;
const utcMidnight = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

export function windowFor(infection: Infection, hivTest: HivTest): { label: string; earliest: number | null; conclusive: number } {
  switch (infection) {
    case 'hiv': { const t = HIV_TESTS[hivTest]; return { label: `HIV: ${t.label}`, earliest: t.earliest, conclusive: t.conclusive }; }
    case 'chlamydia': return { label: 'Chlamydia (swab or urine test)', earliest: 14, conclusive: 14 };
    case 'gonorrhoea': return { label: 'Gonorrhoea (swab or urine test)', earliest: 14, conclusive: 14 };
    case 'syphilis': return { label: 'Syphilis (blood test)', earliest: null, conclusive: 90 };
  }
}

export function assessWindow(input: WindowInput): WindowResult {
  const w = windowFor(input.infection, input.hivTest);
  const daysSince = Math.floor((utcMidnight(input.today) - utcMidnight(input.exposure)) / DAY);
  const earliest = w.earliest === null ? null : addDays(input.exposure, w.earliest);
  const conclusive = addDays(input.exposure, w.conclusive);
  let status: WindowStatus;
  if (daysSince < 0) status = 'invalid';
  else if (daysSince >= w.conclusive) status = 'conclusive';
  else if (w.earliest !== null && daysSince >= w.earliest) status = 'testable';
  else status = 'too-early';

  const pepUrgent = input.infection === 'hiv' && daysSince >= 0 && daysSince <= 3;
  const notes = [
    'If you have symptoms, get tested whatever the dates say.',
    'If you have had other exposures since, count from the most recent one.',
  ];
  if (input.infection === 'hiv') notes.push('A negative result before the conclusive date should be repeated on or after it.');
  if (input.infection === 'chlamydia' || input.infection === 'gonorrhoea') notes.push('These infections often cause no symptoms. A test before 14 days may miss them, so repeat it if you test early.');
  if (input.infection === 'syphilis') notes.push('Antibodies can take up to 3 months to show. Testing sooner can help if you have a sore or rash, but a negative result before 90 days should be repeated.');

  return { status, label: w.label, daysSince, earliestDays: w.earliest, conclusiveDays: w.conclusive, earliest, conclusive, pepUrgent, notes };
}
