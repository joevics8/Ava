import type { Tool } from '../types';

export const tool: Tool = {
  id: 'sti-hiv-window-period',
  category: 'sexual-health',
  related: ['emergency-contraception-window', 'pregnancy-test-timing', 'missed-pill-calculator'],
  text: {
    en: {
      slug: 'sti-and-hiv-window-period-calculator',
      title: 'STI and HIV Window Period Calculator',
      h1: 'STI and HIV Window Period Calculator',
      description: 'Enter the date of a possible exposure to see when an HIV, chlamydia, gonorrhoea or syphilis test is reliable and when to retest. Private, no judgement.',
      intro: 'Choose the infection, the type of test and the date of the exposure. You will see when a result can be trusted and when to retest.',
      faqs: [
        { q: 'What is a window period?', a: 'It is the time between an exposure and the point when a test can reliably detect an infection. Testing inside this window can give a false negative.' },
        { q: 'How long should I wait to test for HIV?', a: 'It depends on the test. A lab antigen/antibody test can detect HIV from about 18 days and is conclusive by 45 days. Rapid and self-tests can take up to 90 days to be conclusive.' },
        { q: 'What is post-exposure prophylaxis (PEP)?', a: 'It is a short course of medicine that can prevent HIV after a possible exposure. It must be started within 72 hours, so seek care straight away if this applies to you.' },
        { q: 'Should I test earlier if I have symptoms?', a: 'Yes. If you have symptoms, get tested regardless of the dates, and repeat the test later if it is negative inside the window.' },
      ],
      cta: 'Ava can answer your health questions privately, without judgement.',
      article: `## What is a window period?

After an infection enters the body, it takes time before a test can detect it. Tests look for the germ itself, for proteins from the germ, or for antibodies your body makes. The time until a test is reliable is the window period. A negative result inside the window may be wrong, so the date of the exposure matters.

## Typical windows

- **HIV, NAT (RNA) test:** can detect HIV from about 10 days and is conclusive by about 33 days.
- **HIV, lab antigen/antibody blood test:** detectable from about 18 days and conclusive by 45 days.
- **HIV, rapid antigen/antibody finger-prick test:** detectable from about 18 days; conclusive by 90 days.
- **HIV, antibody-only home test:** from about 23 days; conclusive by 90 days.
- **Chlamydia and gonorrhoea:** swab or urine tests are reliable from 14 days after exposure.
- **Syphilis:** blood tests can take up to 3 months (90 days) to become conclusive.

## How to use the result

If you test after the earliest date, a positive is a real result. A negative is reassuring, but only conclusive after the second date. If your test was earlier, plan a repeat test on the conclusive date. If you had other exposures since, count from the latest one.

## HIV: act within 72 hours

If you think you were exposed to HIV in the last 72 hours, go to an emergency department or a sexual health service straight away and ask about post-exposure prophylaxis (PEP). It works best the sooner it is started. Do not wait for a test.

## Other infections

Hepatitis B and C, herpes, HPV and trichomoniasis have different tests and windows, and some are not tested for routinely. Ask a clinic which tests suit your situation. Vaccines for hepatitis B and HPV are available in many places.

## Protecting yourself and others

Until you have a conclusive result, use condoms or avoid sex. Treatment is available for most sexually transmitted infections, and HIV is a manageable long-term condition with treatment. Many clinics test confidentially and without judgement.

## Limits

This tool lists typical windows. Your clinic’s test may differ, and the result depends on your own body. Always follow the advice of the clinician who ordered your test.`,
    },
  },
};
