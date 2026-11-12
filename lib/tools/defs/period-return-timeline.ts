import type { Tool } from '../types';

export const tool: Tool = {
  id: 'period-return-timeline',
  category: 'cycle',
  related: ['lam-postpartum-fertility', 'period-calculator', 'irregular-cycle-predictor'],
  text: {
    en: {
      slug: 'when-will-my-period-return',
      title: 'When Will My Period Return? Timeline Calculator',
      h1: 'When Will My Period Return?',
      description: 'See when your period usually returns after birth, breastfeeding, miscarriage, stopping the pill, the injection or removing an implant or IUD.',
      intro: 'Choose what happened and the date. You will see the usual range for when periods return, and when to seek advice.',
      faqs: [
        { q: 'When does a period return after having a baby?', a: 'If you are not breastfeeding, usually 6 to 12 weeks after birth. If you are breastfeeding, it varies widely and may be absent for months.' },
        { q: 'When will I get a period after a miscarriage?', a: 'Usually 4 to 6 weeks after. You can ovulate within about 2 weeks, so pregnancy is possible before your first period.' },
        { q: 'How long does it take for periods to return after the pill?', a: 'Most people have natural periods within 1 to 3 months. You may have a withdrawal bleed first, which is not the same as a natural period.' },
        { q: 'Why is my period late after the injection?', a: 'The contraceptive injection can delay the return of periods and fertility. On average it takes around 10 months after the last injection, and sometimes a year or more.' },
      ],
      cta: 'Ava can help you track your cycle as it returns and spot what is normal for you.',
      article: `## Why periods change after a life event

Your cycle is controlled by hormones. Pregnancy, birth, breastfeeding, a loss and contraception all change those hormones. When the change ends, it takes time for ovulation, and then your period, to return. How long varies widely, so this tool shows typical ranges rather than a single date.

## After birth

If you are not breastfeeding, a period usually returns about 6 to 12 weeks after birth. If you are breastfeeding fully, periods often stay away for months and may return as feeds become less frequent or solid foods begin. For some people, periods come back sooner, and for others later than a year.

## After a miscarriage or abortion

The first period usually arrives about 4 to 6 weeks afterwards. Ovulation can happen within about 2 weeks, so you can become pregnant before your first period. Seek care the same day for heavy bleeding (soaking a pad every hour for 2 hours), severe pain, a fever or foul-smelling discharge.

## After stopping the combined pill

Most people get natural periods back within 1 to 3 months, although it can take longer. You may have a withdrawal bleed within a few days of stopping, but this is not a natural period. You can ovulate in the first cycle, so use contraception if you are not trying to conceive.

## After the contraceptive injection

Return to fertility can take several months. On average it is about 10 months from your last injection, and up to a year or more for some people. This does not mean anything is wrong.

## After removing an implant or IUD

Fertility usually returns quickly. Periods typically come back within a few weeks to 3 months.

## When to see a doctor

Speak to a clinician if you have not had a period 3 months after the times above, if your periods stay very irregular, are very heavy, painful or last more than 7 days, or if you may be pregnant. A pregnancy test is a sensible first step if there is any chance.

## Limits

These ranges describe what is usual. Your body may be earlier or later, and other things such as stress, weight change, thyroid conditions and polycystic ovary syndrome also affect periods.`,
    },
  },
};
