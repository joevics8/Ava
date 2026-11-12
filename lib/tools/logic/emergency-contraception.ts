// Which emergency contraception options are still possible, by time since sex.
// Windows follow the product licences used by NHS / FSRH guidance.

export type EcId = 'copper-iud' | 'ulipristal' | 'levonorgestrel';

export interface EcInput {
  hoursSince: number;
  weightKg?: number | null;
  bmi?: number | null;
}

export interface EcOption {
  id: EcId;
  name: string;
  windowHours: number;
  available: boolean;
  /** Hours left in the licensed window (0 when it has passed). */
  hoursLeft: number;
  effectiveness: string;
  notes: string[];
}

export interface EcResult {
  valid: boolean;
  hoursSince: number;
  /** True if any option is still within its window. */
  anyAvailable: boolean;
  /** True when weight above 70 kg or BMI above 26 was entered. */
  higherWeight: boolean;
  headline: string;
  options: EcOption[];
  general: string[];
}

export const EC_WINDOWS: Record<EcId, number> = { 'copper-iud': 120, ulipristal: 120, levonorgestrel: 72 };
export const HIGHER_WEIGHT_KG = 70;
export const HIGHER_BMI = 26;

export const hoursBetween = (thenMs: number, nowMs: number) => (nowMs - thenMs) / 3_600_000;

export function assessEmergencyContraception(input: EcInput): EcResult {
  const h = input.hoursSince;
  const valid = Number.isFinite(h) && h >= 0;
  const higherWeight = (Number(input.weightKg) > HIGHER_WEIGHT_KG) || (Number(input.bmi) > HIGHER_BMI);
  const left = (id: EcId) => Math.max(0, Math.round((EC_WINDOWS[id] - h) * 10) / 10);
  const ok = (id: EcId) => valid && h <= EC_WINDOWS[id];

  const iudNotes = ['Fitted by a trained clinician, so call a sexual health clinic, GP or family planning service now.', 'Can also be kept as ongoing contraception for years.'];
  const upaNotes = [
    'Taken as one tablet. It can be less affected by body weight than levonorgestrel.',
    'It can make hormonal contraception less effective: wait 5 days before starting or restarting it, and use condoms in that time and as advised after.',
    'If you are breastfeeding, the usual advice is to pause for about a week. Ask the pharmacist.',
  ];
  const lngNotes = ['Taken as one tablet. Works best the sooner it is taken.', 'Safe to use while breastfeeding.'];
  if (higherWeight) lngNotes.push('Levonorgestrel may work less well at a weight above 70 kg or a BMI above 26. Ulipristal or the copper IUD is usually preferred. If levonorgestrel is the only option, a pharmacist or clinician can advise whether it suits you.');

  const options: EcOption[] = [
    { id: 'copper-iud', name: 'Copper IUD (coil)', windowHours: 120, available: ok('copper-iud'), hoursLeft: left('copper-iud'), effectiveness: 'Most effective option', notes: iudNotes },
    { id: 'ulipristal', name: 'Ulipristal acetate pill', windowHours: 120, available: ok('ulipristal'), hoursLeft: left('ulipristal'), effectiveness: 'Effective pill, often preferred over levonorgestrel', notes: upaNotes },
    { id: 'levonorgestrel', name: 'Levonorgestrel pill', windowHours: 72, available: ok('levonorgestrel'), hoursLeft: left('levonorgestrel'), effectiveness: higherWeight ? 'May be less effective at higher body weight' : 'Effective pill, works best taken early', notes: lngNotes },
  ];

  const anyAvailable = options.some(o => o.available);
  let headline: string;
  if (!valid) headline = 'Enter how many hours ago it happened.';
  else if (h <= 72) headline = 'All three options are possible. Get one as soon as you can.';
  else if (h <= 120) headline = 'The copper IUD and ulipristal are still possible. Levonorgestrel is past its usual 72-hour window.';
  else headline = 'This is past the usual 5-day window, but speak to a clinic today. A copper IUD can sometimes still be fitted, and you may need a pregnancy test.';

  const general = [
    'Sooner is better. Each hour matters most for the pills.',
    'Emergency pills do not protect you if you have sex again in the same cycle. Use condoms or another method until your next period.',
    'Take a pregnancy test about 3 weeks after the sex, or sooner if your period is more than 7 days late, unusually light or short, or you have lower abdominal pain.',
    'Some medicines make the pills less effective: rifampicin and some epilepsy medicines, and the herbal remedy St John\'s wort. Tell the pharmacist what you take.',
    'If you vomit within 3 hours of taking a pill, ask a pharmacist or clinic whether you need another.',
    'If you are worried about infections, a sexual health check is also a good idea.',
  ];
  return { valid, hoursSince: h, anyAvailable, higherWeight, headline, options, general };
}
