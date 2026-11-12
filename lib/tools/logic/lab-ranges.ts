// Plain-language reading of four common blood results, using mainstream
// thresholds (WHO anaemia thresholds; ADA glucose and HbA1c criteria). Ranges
// vary by laboratory, age and method, and one result is never a diagnosis.

export type TestId = 'hb' | 'pcv' | 'glucose' | 'hba1c';
export type Unit = 'g/dL' | 'g/L' | '%' | 'L/L' | 'mg/dL' | 'mmol/L' | 'mmol/mol';
export type Sex = 'female' | 'male';
export type Pregnancy = 'no' | 'first-third' | 'second';

export const TESTS: { id: TestId; label: string; units: Unit[] }[] = [
  { id: 'hb', label: 'Haemoglobin (Hb)', units: ['g/dL', 'g/L'] },
  { id: 'pcv', label: 'Packed cell volume (PCV) / haematocrit', units: ['%', 'L/L'] },
  { id: 'glucose', label: 'Fasting blood glucose', units: ['mg/dL', 'mmol/L'] },
  { id: 'hba1c', label: 'HbA1c', units: ['%', 'mmol/mol'] },
];

// ---- unit conversions ----
export const hbToGdl = (v: number, u: Unit) => (u === 'g/L' ? v / 10 : v);
export const gdlToGl = (v: number) => v * 10;
export const pcvToPercent = (v: number, u: Unit) => (u === 'L/L' ? v * 100 : v);
export const percentToFraction = (v: number) => v / 100;
export const MGDL_PER_MMOL = 18.016;
export const glucoseToMgdl = (v: number, u: Unit) => (u === 'mmol/L' ? v * MGDL_PER_MMOL : v);
export const mgdlToMmol = (v: number) => v / MGDL_PER_MMOL;
// NGSP (%) <-> IFCC (mmol/mol): IFCC = (NGSP - 2.15) x 10.929
export const hba1cToPercent = (v: number, u: Unit) => (u === 'mmol/mol' ? v / 10.929 + 2.15 : v);
export const percentToMmolMol = (v: number) => (v - 2.15) * 10.929;

// ---- results ----
export type Category = 'normal' | 'info' | 'attention' | 'concern' | 'urgent';

export interface LabResult {
  category: Category;
  headline: string;
  details: string[];
  /** The same value in the other unit, for readers comparing labs. */
  alsoShown: string;
  /** The range the value was compared against, as text. */
  rangeText: string;
}
export type LabOutcome = LabResult | { error: string };

const r1 = (n: number) => (Math.round(n * 10) / 10).toString();
const r2 = (n: number) => (Math.round(n * 100) / 100).toString();

export interface LabInput { test: TestId; value: number; unit: Unit; sex: Sex; pregnancy: Pregnancy }

export function assessLab(i: LabInput): LabOutcome {
  const { test, value } = i;
  if (!Number.isFinite(value) || value <= 0) return { error: 'Enter your result as a number above zero.' };
  if (!TESTS.find(t => t.id === test)?.units.includes(i.unit)) return { error: 'That unit does not match the test.' };
  switch (test) {
    case 'hb': return assessHb(i);
    case 'pcv': return assessPcv(i);
    case 'glucose': return assessGlucose(i);
    case 'hba1c': return assessHba1c(i);
  }
}

function assessHb({ value, unit, sex, pregnancy }: LabInput): LabOutcome {
  const hb = hbToGdl(value, unit);
  if (hb < 3 || hb > 25) return { error: 'That haemoglobin looks outside the possible range. Check the number and the unit (g/dL or g/L).' };
  const pregnant = sex === 'female' && pregnancy !== 'no';
  const threshold = pregnant ? (pregnancy === 'second' ? 10.5 : 11.0) : sex === 'female' ? 12.0 : 13.0;
  const rangeText = pregnant
    ? `WHO: anaemia in pregnancy is below ${r1(threshold)} g/dL (${pregnancy === 'second' ? 'second' : 'first and third'} trimester)`
    : `WHO: anaemia is below ${r1(threshold)} g/dL for ${sex === 'female' ? 'non-pregnant women' : 'men'} aged 15 and over`;
  const alsoShown = unit === 'g/dL' ? `${r1(hb)} g/dL = ${r1(gdlToGl(hb))} g/L` : `${r1(value)} g/L = ${r1(hb)} g/dL`;

  if (hb >= threshold) {
    return { category: 'normal', headline: 'At or above the WHO anaemia threshold', alsoShown, rangeText, details: ['This is not in the anaemia range. Haemoglobin that is well above the usual range for your sex is also worth mentioning to a clinician.', 'A normal haemoglobin does not rule out low iron stores, which a ferritin test can show.'] };
  }
  const severity = pregnant ? (hb < 7 ? 'severe' : hb < 10 ? 'moderate' : 'mild') : (hb < 8 ? 'severe' : hb < 11 ? 'moderate' : 'mild');
  const details = ['Anaemia means fewer or smaller red blood cells, or less haemoglobin. Common causes are low iron, blood loss (including heavy periods), and not enough vitamin B12 or folate, and the cause needs finding.'];
  if (severity === 'severe') {
    details.push('This is in the severe range. See a clinician promptly, and get urgent help if you are breathless at rest, have chest pain, feel faint, or have a racing heart.');
    return { category: 'urgent', headline: 'Severe anaemia range (WHO)', alsoShown, rangeText, details };
  }
  details.push(severity === 'moderate' ? 'This is in the moderate range. Please see a clinician to find the cause and agree treatment. Do not start high-dose iron without advice if you are pregnant or unsure of the cause.' : 'This is in the mild range. Mention it to a clinician, who may check iron and recommend food changes or a supplement.');
  return { category: severity === 'moderate' ? 'concern' : 'attention', headline: `${severity[0].toUpperCase()}${severity.slice(1)} anaemia range (WHO)`, alsoShown, rangeText, details };
}

function assessPcv({ value, unit, sex, pregnancy }: LabInput): LabOutcome {
  const pcv = pcvToPercent(value, unit);
  if (pcv < 10 || pcv > 70) return { error: 'That PCV looks outside the possible range. Check the number and the unit (% or L/L, for example 0.40).' };
  const lo = sex === 'female' ? 36 : 41;
  const hi = sex === 'female' ? 46 : 53;
  const alsoShown = unit === '%' ? `${r1(pcv)}% = ${r2(percentToFraction(pcv))} L/L` : `${r2(value)} L/L = ${r1(pcv)}%`;
  const rangeText = `Typical adult range about ${lo} to ${hi}% for ${sex === 'female' ? 'women' : 'men'} (varies by lab)`;
  if (sex === 'female' && pregnancy !== 'no') {
    return { category: 'info', headline: 'Pregnancy changes the usual range', alsoShown, rangeText: 'Typical ranges shift in pregnancy as blood volume rises', details: ['PCV normally falls a little in pregnancy, so the adult range does not apply. Ask your midwife or doctor how to read it. Haemoglobin is the test usually used to check for anaemia in pregnancy.'] };
  }
  if (pcv < lo) return { category: pcv < lo - 6 ? 'concern' : 'attention', headline: 'Below the typical range', alsoShown, rangeText, details: ['A low PCV often goes with anaemia. Haemoglobin and iron tests help find the cause, so ask a clinician to review the full blood count.'] };
  if (pcv > hi) return { category: 'attention', headline: 'Above the typical range', alsoShown, rangeText, details: ['A high PCV can come from dehydration, smoking, living at altitude, or other causes. Drink fluids, repeat the test, and ask a clinician if it stays high.'] };
  return { category: 'normal', headline: 'Within the typical range', alsoShown, rangeText, details: ['Your lab\'s own reference range is the one to use. Ranges differ slightly between labs.'] };
}

function assessGlucose({ value, unit }: LabInput): LabOutcome {
  const mg = glucoseToMgdl(value, unit);
  if (mg < 20 || mg > 1000) return { error: 'That glucose looks outside the possible range. Check the number and the unit (mg/dL or mmol/L).' };
  const alsoShown = unit === 'mg/dL' ? `${r1(mg)} mg/dL = ${r1(mgdlToMmol(mg))} mmol/L` : `${r1(value)} mmol/L = ${Math.round(mg)} mg/dL`;
  const rangeText = 'ADA fasting criteria: normal below 100 mg/dL (5.6 mmol/L); 100 to 125 mg/dL (5.6 to 6.9 mmol/L) impaired fasting glucose; 126 mg/dL (7.0 mmol/L) or above in the diabetes range';
  const fasting = 'This applies to a fasting sample (no food or caloric drink for at least 8 hours). Random readings use different cut-offs.';
  if (mg >= 300) {
    return { category: 'urgent', headline: 'Very high', alsoShown, rangeText, details: ['A glucose this high needs medical advice today, especially with thirst, frequent urination, vomiting, drowsiness or confusion. Seek urgent care if you feel unwell.', fasting] };
  }
  if (mg >= 126) {
    return { category: 'concern', headline: 'In the diabetes range', alsoShown, rangeText, details: ['One result is not a diagnosis: it is usually confirmed with a repeat test or an HbA1c. See a clinician soon to confirm and plan next steps.', fasting] };
  }
  if (mg >= 100) {
    return { category: 'attention', headline: 'Impaired fasting glucose (prediabetes range)', alsoShown, rangeText, details: ['This is above normal but below the diabetes range. It is a common early warning, and weight, activity and food choices can bring it down. Ask a clinician about repeat testing. Note: the WHO uses 110 mg/dL (6.1 mmol/L) as its lower limit for this range.', fasting] };
  }
  if (mg < 70) {
    return { category: 'concern', headline: 'Low (below 70 mg/dL / 3.9 mmol/L)', alsoShown, rangeText, details: ['A low reading can come from long fasting or from diabetes medicines. If you feel shaky, sweaty, confused or faint, treat it as low blood sugar and get help. Ask a clinician if it happens again without a clear reason.', fasting] };
  }
  return { category: 'normal', headline: 'Normal fasting range', alsoShown, rangeText, details: ['A normal result is reassuring, but it only shows one moment. Recheck as advised by a clinician if you have risk factors.', fasting] };
}

function assessHba1c({ value, unit }: LabInput): LabOutcome {
  const pct = hba1cToPercent(value, unit);
  if (pct < 3 || pct > 20) return { error: 'That HbA1c looks outside the possible range. Check the number and the unit (% or mmol/mol).' };
  const alsoShown = unit === '%' ? `${r1(pct)}% = ${Math.round(percentToMmolMol(pct))} mmol/mol` : `${Math.round(value)} mmol/mol = ${r1(pct)}%`;
  const rangeText = 'ADA: normal below 5.7% (39 mmol/mol); prediabetes 5.7 to 6.4% (39 to 47 mmol/mol); diabetes range 6.5% (48 mmol/mol) or above';
  const note = 'HbA1c reflects the average over about 3 months. Anaemia, some inherited haemoglobin types and recent blood loss can make it unreliable.';
  if (pct >= 6.5) return { category: 'concern', headline: 'In the diabetes range', alsoShown, rangeText, details: ['One result is usually confirmed with a second test unless there are clear symptoms. See a clinician soon to confirm and plan care.', note] };
  if (pct >= 5.7) return { category: 'attention', headline: 'Prediabetes range', alsoShown, rangeText, details: ['This is above normal but below the diabetes range. Lifestyle changes can lower it and often prevent progression. Ask a clinician about follow-up testing.', note] };
  return { category: 'normal', headline: 'Normal range', alsoShown, rangeText, details: ['A normal HbA1c is reassuring. Testing again every few years is common, sooner if you have risk factors.', note] };
}
