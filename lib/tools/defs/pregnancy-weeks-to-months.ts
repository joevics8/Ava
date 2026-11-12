import type { Tool } from '../types';

export const tool: Tool = {
  id: 'pregnancy-weeks-to-months',
  category: 'pregnancy',
  related: ['due-date-calculator', 'pregnancy-test-timing', 'ovulation-calculator'],
  text: {
    en: {
      slug: 'pregnancy-weeks-to-months-calculator',
      title: 'Pregnancy Weeks to Months Calculator',
      h1: 'Pregnancy Weeks to Months Calculator',
      description: 'Convert weeks of pregnancy to months. Enter your weeks and days or your last period date to see your month, trimester and time left to 40 weeks.',
      intro: 'Pregnancy is counted in weeks, but most people think in months. Enter your weeks, or your last period date, to see where you are.',
      faqs: [
        { q: 'How many months is 20 weeks pregnant?', a: '20 weeks is about 4 months and 3 weeks, so you are in your fifth month. It is the halfway point of a 40-week pregnancy.' },
        { q: 'Why does a pregnancy take 9 months if it is 40 weeks?', a: 'Calendar months average about 4.35 weeks. Forty weeks divided by 4.35 is 9.2, which is 9 months and about 1 week. Pregnancy is counted from the last period, so it covers a little over 9 months from conception.' },
        { q: 'How many weeks is each trimester?', a: 'The first trimester runs from week 1 to the end of week 12, the second from week 13 to the end of week 26, and the third from week 27 until birth.' },
        { q: 'Which month am I in at 36 weeks?', a: '36 weeks is 8 months and 1 week, so you are in your ninth month. A baby born from 37 weeks is called early term or term depending on the exact week.' },
      ],
      cta: 'Ava keeps your pregnancy dates in one place and answers questions week by week.',
      article: `## Weeks or months?

Doctors and midwives count pregnancy in weeks, starting from the first day of your last period. A full-term pregnancy is 40 weeks, or 280 days. Friends, family and forms often ask for months instead, and the two do not line up neatly, which is why people get confused.

## How the conversion works

A calendar month is not exactly four weeks. On average it is about 4.35 weeks, or 30.4 days. To change weeks to months, divide your days of pregnancy by 30.4. At 40 weeks that gives 9.2, which is 9 months and about a week. This calculator does the sum, shows the completed months with any extra weeks left over, and tells you which month you are currently in.

## Quick guide

- Weeks 1 to 4: month 1
- Weeks 5 to 8: month 2 (about 8 weeks is 2 months)
- Weeks 9 to 13: month 3
- Weeks 14 to 17: month 4
- Weeks 18 to 21: month 5 (20 weeks is the halfway point)
- Weeks 22 to 26: month 6
- Weeks 27 to 30: month 7
- Weeks 31 to 35: month 8
- Weeks 36 to 40: month 9

These are approximations. Different websites divide the weeks in slightly different ways, so your own midwife’s numbers are the ones to follow.

## Trimesters

The first trimester lasts to the end of week 12, the second from week 13 to week 26, and the third from week 27 to birth. The trimester is shown with your result.

## Why your dates may change

If your cycles are not 28 days, or you are not sure of your last period, your dates may be adjusted after an early ultrasound. If a scan changes your dating, use the weeks your clinic gives you.

## When to talk to a clinician

Seek urgent care for heavy bleeding, severe pain, fluid leaking from the vagina, or a big change in your baby’s movements. If you have gone past 40 weeks, talk to your midwife or doctor about your plan. At 42 weeks or more, you should be under close care.

## Limits

This tool converts dates only. It does not estimate your due date from a scan, and it is not a substitute for antenatal care.`,
    },
  },
};
