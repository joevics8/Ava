import type { Tool } from '../types';

export const tool: Tool = {
  id: 'lam-postpartum-fertility',
  category: 'contraception',
  related: ['period-return-timeline', 'pregnancy-test-timing', 'missed-pill-calculator'],
  text: {
    en: {
      slug: 'breastfeeding-fertility-lam-checker',
      title: 'Breastfeeding Fertility Checker (LAM Method)',
      h1: 'Breastfeeding Fertility and LAM Checker',
      description: 'Check whether the lactational amenorrhea method (LAM) can protect you after birth, and when fertility may return. Free, private and based on WHO criteria.',
      intro: 'Enter your baby’s birth date and how you are feeding. You will see whether the three LAM criteria are met and the date to plan contraception by.',
      faqs: [
        { q: 'Can I get pregnant while breastfeeding?', a: 'Yes. Fertility can return before your first period, as early as about 3 weeks after birth if you are not breastfeeding fully. Breastfeeding alone is not a reliable method unless the LAM criteria are all met.' },
        { q: 'What are the LAM criteria?', a: 'Your baby is under 6 months old, you feed only breast milk, day and night, with no long gaps, and your periods have not returned. If all three are true, LAM is about 98% effective.' },
        { q: 'When should I start contraception after birth?', a: 'Have a method in place by about 3 weeks after birth if you are having sex, because ovulation can happen before the first period. Ask your midwife or doctor which method suits you.' },
        { q: 'Which contraception is safe while breastfeeding?', a: 'Condoms, the progestogen-only pill, the implant, the injection, the hormonal and copper IUD and others are generally suitable. Combined pills with oestrogen are usually delayed. Ask your clinician.' },
      ],
      cta: 'Ava can answer your postnatal questions and remind you about contraception and checkups.',
      article: `## What is LAM?

The lactational amenorrhea method, or LAM, uses breastfeeding to delay the return of ovulation. Amenorrhea means no periods. LAM is a temporary method, and only works if three conditions are all true at the same time.

## The three LAM criteria

1. **Your baby is under 6 months old.**
2. **You are feeding only breast milk,** day and night, with no formula, no regular solid food and no long gaps between feeds.
3. **Your periods have not returned.** Bleeding in the first weeks after birth, called lochia, is not a period.

When all three are met and the method is used perfectly, LAM is about 98% effective in the first six months. If any one changes, the protection falls, and you need another method.

## Why fertility can return before a period

Ovulation happens about two weeks before a period. This means you can ovulate and become pregnant before your first postnatal period arrives, so a lack of periods is not enough on its own. If you are not breastfeeding, fertility may return from about 3 weeks after birth. This is why the tool shows a date by which to have contraception in place.

## What changes the result

Giving formula or solid foods, long gaps between feeds (for example longer sleeps or pumping instead of feeding), or a returning period reduce the effect of breastfeeding on fertility. Dummies and pumping may also affect it.

## Contraception while breastfeeding

Many methods are safe: condoms, the progestogen-only pill, the implant, the injection, copper and hormonal IUDs. Combined pills containing oestrogen are usually avoided in the first weeks and while breastfeeding, so ask your clinician. A good time to plan is at your postnatal check.

## When to talk to a clinician

If your period has not returned several months after you stopped breastfeeding, or you have signs of pregnancy, see your doctor or midwife. Also seek advice for heavy bleeding, fever or pain after birth.

## Limits

This tool describes standard criteria. It cannot tell you how fertile you are. LAM stops working after 6 months, so plan your next method early.`,
    },
  },
};
