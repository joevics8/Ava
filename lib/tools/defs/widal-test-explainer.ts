import type { Tool } from '../types';

export const tool: Tool = {
  id: 'widal-test-explainer',
  category: 'labs',
  related: ['lab-reference-ranges', 'sti-hiv-window-period', 'pregnancy-test-timing'],
  text: {
    en: {
      slug: 'widal-test-result-explained',
      title: 'Widal Test Result Explained: O and H Titres',
      h1: 'Widal Test Result Explained',
      description: 'Enter your Widal O and H titres to see what the numbers can and cannot tell you about typhoid fever, with clear warning signs and next steps.',
      intro: 'Pick the O and H titres from your Widal report. You will see a plain-language reading, why the test is hard to interpret, and when to seek care.',
      faqs: [
        { q: 'What does a positive Widal test mean?', a: 'It means your blood has antibodies that react with typhoid germs. This can happen with a current typhoid infection, but also after past infection, vaccination or other illnesses, so a single result cannot confirm typhoid.' },
        { q: 'What titre is considered significant?', a: 'Many laboratories treat 1:160 or higher as suggestive, but the right cut-off varies by region and population. A rise in titres between two tests a week or so apart is more meaningful than one result.' },
        { q: 'What is the best test for typhoid?', a: 'A blood culture, ideally taken before antibiotics, is the more reliable test. Your clinician may also use other tests along with your symptoms.' },
        { q: 'Can I treat typhoid at home with antibiotics?', a: 'No. Taking antibiotics without a diagnosis can hide the infection, make cultures negative and cause resistance. See a clinician who can decide what you need.' },
      ],
      cta: 'Ava can help you prepare questions for your doctor and explain your results in plain language.',
      article: `## What is the Widal test?

The Widal test is a blood test that looks for antibodies against the bacteria that cause typhoid fever (Salmonella Typhi). The laboratory dilutes your blood and checks how far it can be diluted before it stops reacting. The result is written as a titre, such as 1:80 or 1:160. A higher second number means more antibodies. Results are given for the O antigen (somatic) and the H antigen (flagellar).

## Why it is hard to interpret

The Widal test is widely used, but it has limits. Antibodies can be present from an earlier typhoid infection, from a vaccine, or from other infections that cause a similar reaction. In places where typhoid is common, many healthy people have a titre that looks positive. The test can also be negative early in an illness, because antibodies take about a week to rise. For these reasons, a single result is rarely enough.

## What the numbers suggest

- **Low titres (for example below 1:80):** not suggestive of typhoid, although early infection can still be missed.
- **Borderline (1:80 to 1:160):** unclear. A repeat test after several days can show whether the level is rising.
- **Higher titres (1:160 or above):** raised and may fit typhoid, particularly with fever and symptoms, but they are not a diagnosis.

The cut-off varies between laboratories and regions, so use your own lab report’s reference range as well.

## How doctors confirm typhoid

Blood culture, ideally before antibiotics, is the more reliable test. Stool or bone marrow cultures and newer rapid tests may also be used. A clinician combines these with your symptoms, how long you have had fever and where you live or have travelled.

## Warning signs

Seek medical care promptly if you have a fever lasting more than 3 days, severe abdominal pain, repeated vomiting or dehydration, confusion, blood in the stool, or black stools. Typhoid can cause serious complications if untreated, and early treatment is effective.

## Do not self-treat

Do not start antibiotics on your own based on a Widal result. The right medicine depends on local resistance patterns and your health. Drink fluids, rest and see a doctor.

## Limits

This tool explains how to read a Widal result in general terms. It does not diagnose typhoid and does not replace a clinician.`,
    },
  },
};
