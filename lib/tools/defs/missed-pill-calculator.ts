import type { Tool } from '../types';

export const tool: Tool = {
  id: 'missed-pill-calculator',
  category: 'contraception',
  related: ['emergency-contraception-window', 'pregnancy-test-timing', 'period-return-timeline'],
  text: {
    en: {
      slug: 'missed-pill-calculator',
      title: 'Missed Pill Calculator: What to Do Next',
      h1: 'Missed Pill Calculator',
      description: 'Missed a pill? Choose your pill type and how many you missed to see what to do, how long to use condoms and whether you need emergency contraception.',
      intro: 'Choose your pill type, how late you are and which week of the pack you are in. You get clear steps based on standard sexual health guidance.',
      faqs: [
        { q: 'What should I do if I miss one combined pill?', a: 'Take it as soon as you remember, even if that means two pills in one day, and carry on as usual. For a single missed pill you are still protected and do not need extra contraception.' },
        { q: 'What if I miss two or more combined pills?', a: 'Take the most recent missed pill now, keep taking the rest, and use condoms or avoid sex until you have taken pills for 7 days in a row. Depending on the week of the pack and whether you had sex, you may need emergency contraception.' },
        { q: 'How late is too late for the progestogen-only pill?', a: 'It depends on the type. A traditional progestogen-only pill has a 3-hour window, desogestrel pills have a 12-hour window and the drospirenone pill has a 24-hour window. If you are later than that, take the missed pill and use condoms.' },
        { q: 'Do I need a pregnancy test after missing pills?', a: 'If you had sex without a condom after missing pills, take a pregnancy test about 3 weeks later, or sooner if your period is late or unusually light.' },
      ],
      cta: 'Ava can answer your contraception questions and remind you to take your pill.',
      article: `## Why missed pills matter

Birth control pills work by keeping hormone levels steady. When pills are missed, hormone levels can drop and ovulation may happen. How much risk this creates depends on the type of pill, how many were missed and where you are in the pack.

## Combined pill

The combined pill contains oestrogen and progestogen. It comes in 21-day packs with a 7-day break, or 28-day packs with 7 inactive pills.

- **One pill missed or taken up to 24 hours late:** take it now and continue as normal. You are still protected.
- **Two or more pills missed (48 hours late or more):** take the most recent missed pill now and use condoms for 7 days.
- **Week 1 of the pack:** if you had sex without a condom in the last 5 days or in the pill-free break, you may need emergency contraception.
- **Week 2:** emergency contraception is not usually needed if you took the previous 7 pills correctly.
- **Week 3:** finish the active pills and start the next pack straight away without the break.

## Progestogen-only pill

The window to take this pill is narrow. A traditional pill has a 3-hour window, a desogestrel pill has 12 hours and a drospirenone pill has 24 hours. If you are late, take one missed pill now, continue as normal and use condoms for 2 days (7 days for drospirenone). If you had sex without a condom since the missed pill, you may need emergency contraception.

## When emergency contraception may be needed

The copper IUD works for up to 5 days after sex and is the most effective option. A pill can work for up to 3 days (levonorgestrel) or 5 days (ulipristal). The sooner the better. Ask a pharmacist or clinic.

## Vomiting and diarrhoea

If you vomit within 3 hours of taking a pill, or have severe diarrhoea for more than 24 hours, count the pill as missed. Some other medicines can also make the pill less effective, so check with a pharmacist.

## Things to remember

Take a pregnancy test about 3 weeks after any sex without a condom following missed pills. If unsure, use condoms and ask your pharmacist or clinician for advice.

## Limits

This tool follows general guidance. Your brand, health conditions and other medicines may change what is right for you. Check the leaflet in your pack and ask a clinician if you are unsure.`,
    },
  },
};
