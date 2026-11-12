import type { Tool } from '../types';

export const tool: Tool = {
  id: 'lab-reference-ranges',
  category: 'labs',
  related: ['widal-test-explainer', 'pregnancy-weeks-to-months', 'irregular-cycle-predictor'],
  text: {
    en: {
      slug: 'blood-test-reference-ranges-explained',
      title: 'Blood Test Ranges: Haemoglobin, PCV, Glucose, HbA1c',
      h1: 'Blood Test Reference Ranges Explained',
      description: 'Enter a haemoglobin, PCV, fasting glucose or HbA1c result in any unit to see where it falls against common reference ranges and what it may mean.',
      intro: 'Pick the test, enter your value and unit. You will see where it sits against common ranges, with unit conversion and when to follow up.',
      faqs: [
        { q: 'What is a normal haemoglobin level?', a: 'Common lab ranges are about 12 to 15.5 g/dL for adult women and 13.5 to 17.5 g/dL for adult men. The WHO defines anaemia as below 12.0 g/dL in non-pregnant women and below 13.0 g/dL in men, and below 11.0 g/dL in most of pregnancy.' },
        { q: 'What is a normal fasting blood sugar?', a: 'Below 100 mg/dL (5.6 mmol/L) is normal. 100 to 125 mg/dL (5.6 to 6.9 mmol/L) is raised and 126 mg/dL (7.0 mmol/L) or above on repeat testing is in the diabetes range.' },
        { q: 'What does HbA1c show?', a: 'It reflects your average blood sugar over about 3 months. Below 5.7% is normal, 5.7% to 6.4% is prediabetes and 6.5% or above is in the diabetes range.' },
        { q: 'Why does my lab report show a different range?', a: 'Reference ranges vary between labs, methods, ages and populations. Use the range printed on your report and ask your clinician what it means for you.' },
      ],
      cta: 'Ava can explain your results in plain language and help you prepare questions for your doctor.',
      article: `## What is a reference range?

A reference range is the span of values that most healthy people have for a blood test. A value outside the range is not automatically a problem, and a value inside it does not guarantee that all is well. Ranges depend on the laboratory, the method used, your age and your sex, so your own report’s range is the one to trust.

## Haemoglobin

Haemoglobin carries oxygen in red blood cells. Low haemoglobin is called anaemia and can cause tiredness, breathlessness, dizziness and pale skin. The WHO sets thresholds for anaemia: below 12.0 g/dL in non-pregnant adult women, below 13.0 g/dL in adult men, below 11.0 g/dL in the first and third trimesters of pregnancy and below 10.5 g/dL in the second trimester. Iron deficiency is a common cause, but there are others, so a clinician should look for the reason.

## PCV or haematocrit

Packed cell volume (PCV) or haematocrit is the percentage of your blood made up of red cells. Typical lab ranges are about 36 to 46% for adult women and 41 to 53% for adult men. It usually moves together with haemoglobin.

## Fasting blood glucose

Fasting means no food or drink except water for at least 8 hours. A level below 100 mg/dL (5.6 mmol/L) is normal. A level from 100 to 125 mg/dL (5.6 to 6.9 mmol/L) is called impaired fasting glucose, a sign of higher risk. A level of 126 mg/dL (7.0 mmol/L) or above on two tests is in the diabetes range.

## HbA1c

HbA1c shows your average blood sugar over about 3 months. Below 5.7% (39 mmol/mol) is normal. From 5.7% to 6.4% is prediabetes. At 6.5% (48 mmol/mol) or higher it is in the diabetes range. Some conditions, such as anaemia and sickle cell trait, can make HbA1c less accurate.

## Units

Results are reported in different units around the world. The tool converts between g/dL and g/L, mg/dL and mmol/L, and % and mmol/mol, so you can compare values from different labs.

## What to do with a result

A single out-of-range value is a reason to talk to your clinician, not a diagnosis. Repeat testing and your symptoms usually decide the next step. Seek care urgently for severe breathlessness, chest pain, fainting or very high blood sugar with vomiting or confusion.

## Limits

This tool uses common reference ranges and international criteria. It does not replace a clinician’s interpretation of your results.`,
    },
  },
};
