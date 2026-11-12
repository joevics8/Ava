import type { Tool } from '../types';

export const tool: Tool = {
  id: 'irregular-cycle-predictor',
  category: 'cycle',
  related: ['period-calculator', 'ovulation-calculator', 'pregnancy-test-timing'],
  text: {
    en: {
      slug: 'irregular-cycle-calculator',
      title: 'Irregular Cycle Calculator: Period and Fertile Window',
      h1: 'Irregular Cycle Calculator',
      description: 'Enter your last few cycle lengths to see your average, your range and a likely window for your next period and fertile days. Free and private.',
      intro: 'Enter the length of your last 3 to 12 cycles and your last period date. You will see a range for your next period instead of a single guess.',
      faqs: [
        { q: 'What counts as an irregular cycle?', a: 'Cycles that vary by more than about 7 to 9 days from month to month, or that are often shorter than 21 days or longer than 35 days.' },
        { q: 'How does the calculator find my fertile window?', a: 'It uses a standard calendar rule: the first fertile day is your shortest cycle minus 18 days, and the last is your longest cycle minus 11 days, counted from the first day of your last period.' },
        { q: 'Can I use this to avoid pregnancy?', a: 'No. With irregular cycles the window is wide and ovulation can be hard to predict. Use a reliable contraceptive method and talk to a clinician.' },
        { q: 'When should I see a doctor about irregular periods?', a: 'If your periods stop for 3 months or more, are very heavy or painful, come more often than every 21 days, or you are trying to conceive and cycles are irregular.' },
      ],
      cta: 'Ava learns your real cycle over time and tells you what is normal for you.',
      article: `## What is an irregular cycle?

A typical cycle lasts 21 to 35 days, counted from the first day of one period to the first day of the next. Cycles are irregular when they vary a lot from month to month, often by more than 7 to 9 days, or when they are frequently shorter than 21 or longer than 35 days. Variation is common in the first years after periods start and in the years before menopause.

## Why a range helps

A calendar app that gives a single date assumes your cycle is the same every time. When it varies, that date is often wrong. This tool uses your own recent cycles. It shows your average, shortest and longest cycle, and predicts a range for your next period, from your shortest to your longest cycle.

## The fertile window estimate

For women with irregular cycles, a standard calendar method estimates the fertile window using the shortest and longest cycle in the last 6 to 12 months. The earliest fertile day is the shortest cycle minus 18 days. The latest is the longest cycle minus 11 days. The window is longer when cycles vary more. It is a rough guide, and an ovulation test or tracking symptoms such as cervical mucus can narrow it.

## Not a contraception method

This estimate cannot be used to prevent pregnancy. For irregular cycles the fertile window is wide, and ovulation can happen at unexpected times. A reliable contraceptive method is much safer.

## Common causes of irregular cycles

Stress, big changes in weight, intense exercise, thyroid conditions, polycystic ovary syndrome (PCOS), breastfeeding, some medicines and perimenopause can all affect cycles. Hormonal contraception also changes cycles while it is used and after it is stopped.

## When to see a clinician

Book an appointment if your periods stop for 3 months or more (and you are not pregnant), if they come more often than every 21 days, last longer than 7 days, are very heavy or painful, or you bleed between periods or after sex. If you are trying to conceive and have irregular cycles, ask for advice earlier.

## Tips

Record the first day of every period. After six or more cycles your range becomes more reliable. If you could be pregnant, use your longest cycle to decide when a period is late, and see our pregnancy test timing tool.

## Limits

This tool uses the dates you enter. It is a guide, not a medical assessment.`,
    },
  },
};
