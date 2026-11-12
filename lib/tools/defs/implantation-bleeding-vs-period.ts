import type { Tool } from '../types';

export const tool: Tool = {
  id: 'implantation-bleeding-vs-period',
  category: 'pregnancy',
  related: ['pregnancy-test-timing', 'period-calculator', 'ovulation-calculator'],
  text: {
    en: {
      slug: 'implantation-bleeding-or-period-quiz',
      title: 'Implantation Bleeding or Period? Quick Quiz',
      h1: 'Implantation Bleeding or Period?',
      description: 'Answer a few questions about timing, colour, flow and cramps to see whether your bleeding looks more like implantation spotting or a period.',
      intro: 'Answer five quick questions about your bleeding. You will see which pattern it resembles and when a pregnancy test can give a real answer.',
      faqs: [
        { q: 'What does implantation bleeding look like?', a: 'Usually light spotting that is pink or brown, lasting from a few hours to two days, without clots. It is much lighter than a normal period.' },
        { q: 'When does implantation bleeding happen?', a: 'About 6 to 12 days after ovulation, often a few days before the period is due. Not everyone has it: most pregnant people do not notice any bleeding.' },
        { q: 'Can implantation bleeding be heavy?', a: 'No. Heavy bleeding like a period, bright red blood or clots is not typical implantation bleeding. See a clinician if you are pregnant or may be.' },
        { q: 'How can I be sure?', a: 'Only a pregnancy test can tell. Test from the first day of a missed period, or 3 weeks after unprotected sex. If it is negative but your period has not started, retest in 3 to 7 days.' },
      ],
      cta: 'Ava can help you track your cycle and understand what is normal for you.',
      article: `## What is implantation bleeding?

When a fertilised egg attaches to the womb lining, a little blood can be released. This is implantation bleeding. It happens about 6 to 12 days after ovulation, which is often a few days before a period would be due. Only a minority of pregnant people notice it, so having no bleeding does not mean anything either way.

## How it differs from a period

- **Timing:** it often comes a little before the expected period, and a period usually arrives right on the expected date or after.
- **Colour:** pink, light red or brown for implantation; a period often starts light but becomes bright or dark red.
- **Flow:** spotting only, not enough to fill a pad, versus a flow that builds over a day or two.
- **Length:** a few hours to two days, compared with three to seven days for most periods.
- **Clots:** implantation spotting does not usually contain clots, while period blood often does.
- **Cramps:** implantation cramps, if any, are mild and short. Period cramps are often stronger and last longer.

## How the quiz works

You answer five questions about the bleeding. The tool compares your answers with the usual features of each type and tells you which one it resembles more, or that the pattern is mixed. It is a rough guide. Many other things can cause spotting, including ovulation, hormonal contraception, stress, infections and cervical changes.

## The only way to know

A pregnancy test is the only way to confirm. Testing too early gives a false negative, so wait until the first day of a missed period or 3 weeks after unprotected sex. If you test negative but still do not have a period, repeat the test after 3 to 7 days.

## Seek urgent help if

Get urgent medical care for heavy bleeding that soaks a pad in an hour, severe pain, especially on one side, pain in the tip of the shoulder, dizziness or fainting. If you may be pregnant, these could be signs of an ectopic pregnancy or miscarriage.

## Limits

This quiz is not a diagnosis. It cannot tell you whether you are pregnant. If you are worried about any bleeding, speak to a clinician.`,
    },
  },
};
