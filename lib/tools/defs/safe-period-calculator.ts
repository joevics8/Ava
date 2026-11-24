import type { Tool } from '../types';

export const tool: Tool = {
  id: 'safe-period-calculator',
  category: 'cycle',
  related: ['ovulation-calculator', 'irregular-cycle-predictor', 'period-calculator', 'emergency-contraception-window'],
  text: {
    en: {
      slug: 'safe-period-calculator',
      title: 'Safe Period Calculator: Safe Days and Their Limits',
      h1: 'Safe Period Calculator',
      description: 'Work out your likely fertile and lower-risk days from your cycle history, and see honestly why the calendar method is not reliable contraception.',
      intro: 'Enter your last few cycle lengths and the start of your last period to see which days are most likely to be fertile. The calendar method is not reliable contraception, so this tool also shows how it performs, who it may suit and what to use instead.',
      faqs: [
        { q: 'Is there really a safe period in the menstrual cycle?', a: 'There are days when pregnancy is less likely, but no day is completely safe. Ovulation can come earlier or later than expected, and sperm can survive for up to 5 days. For this reason the days before ovulation also carry a risk.' },
        { q: 'How reliable is the calendar method for avoiding pregnancy?', a: 'Not very. The NHS says about 24 in 100 women using fertility awareness get pregnant in a year with typical use. The CDC gives about 13 in 100 for the Standard Days Method, and a review in the BMJ pooled calendar-rhythm users at about 15 in 100.' },
        { q: 'Can I use the safe period method with irregular periods?', a: 'No. If your cycles vary by more than about a week, or you often have cycles shorter than 26 or longer than 32 days, the fertile days cannot be predicted. The NHS says fertility awareness does not suit irregular periods. Use another method.' },
        { q: 'Which days am I most likely to get pregnant?', a: 'The fertile window is about 6 days: the 5 days before ovulation and the day of ovulation. Ovulation usually happens about 14 days before the next period, so in a 28-day cycle that is roughly days 9 to 14.' },
        { q: 'Can I get pregnant just after my period?', a: 'Yes, especially with a short cycle. If you ovulate soon after bleeding stops, sperm from sex at the end of your period can still be alive. This is one reason the calendar method fails.' },
        { q: 'Does the safe period method protect against STIs?', a: 'No. Only condoms reduce the risk of sexually transmitted infections, including HIV. If you are not in a relationship where you both have recent test results, use a condom every time.' },
        { q: 'What if I had sex on a fertile day and do not want to be pregnant?', a: 'Emergency contraception works best the sooner it is used. A copper IUD can be fitted up to 5 days after sex, and emergency pills work for up to 3 or 5 days depending on the type. A pharmacist or clinic can help.' },
        { q: 'What are better ways to avoid pregnancy?', a: 'Implants, IUDs and the injection are the most effective, with fewer than 1 in 100 pregnancies a year for implants and IUDs. The pill, condoms and other methods work well when used every time. A pharmacist or clinic can help you choose.' },
      ],
      cta: 'Ava can help you track your cycle and talk through contraception options in private.',
      article: `## What the safe period calculator does

Enter the length of your last few menstrual cycles and the first day of your last period. The tool shows which cycle days are most likely to be fertile, and the calendar dates for the next few cycles.

It uses the calendar method, also called the rhythm method. This is a simple form of fertility awareness: you predict ovulation from past cycles and avoid unprotected sex on the days around it.

Please read this first: **the calendar method is not reliable contraception.** The "safe days" are best described as days when pregnancy is less likely, not days when it cannot happen.

## How reliable is the safe period method?

The figures below show how many women out of 100 get pregnant in the first year of use.

| Source | Typical use |
|---|---|
| NHS, fertility awareness | About 24 in 100 |
| CDC, Standard Days Method | About 13 in 100 |
| BMJ review, calendar rhythm users | About 15 in 100 |
| BMJ review, range for other fertility awareness methods | About 10 to 34 in 100 |

The NHS says that fertility awareness is between 91% and 99% effective when it is followed correctly every time. In everyday life, though, it is only about 76% effective. Most people do not follow it perfectly: cycles change, sex is not always planned and counting days is easy to get wrong.

For comparison, the contraceptive pill leads to about 7 pregnancies in 100 with typical use, and implants and IUDs to fewer than 1 in 100.

## How to use it

1. Work out your cycle lengths. Count from day 1 of one period (the first day of bleeding) to day 1 of the next. A phone note or calendar is enough.
2. Enter at least 3 cycles. Six or more gives a fairer picture, and 12 is better still.
3. Enter the first day of your most recent period.
4. Read the warnings first. They tell you whether the method fits your cycles at all.

If the tool says your cycles are irregular or outside the usual range, believe it. The dates are then shown only so you can see why they cannot be trusted.

## What is a normal cycle?

A cycle is usually 21 to 35 days, and many adults have cycles that vary by a few days from month to month. A difference of up to about a week between your shortest and longest cycle is common. Teenagers, people close to menopause and women after having a baby often have more variation. If your cycles are often shorter than 21 days or longer than 35, or your periods stop for months, it is worth asking a clinician, as it can have a medical cause such as polycystic ovary syndrome or a thyroid problem.

## How the calculation works

The classic Ogino-Knaus rule uses your own cycle history:

- **First fertile day** = your shortest cycle minus 18.
- **Last fertile day** = your longest cycle minus 11.

The days of your cycle are counted from the first day of bleeding as day 1. For example, with cycles between 26 and 32 days, the fertile days run from day 8 to day 21.

The rule works because ovulation happens about 12 to 16 days before the next period. It allows for sperm that can live up to 5 days and for an egg that survives about a day.

This tool also applies the CDC Standard Days Method, which treats days 8 to 19 as fertile for people with cycles of 26 to 32 days. If your cycles fit, it will never show a window narrower than that. For future cycles the window gets wider, because your next period could start earlier or later than average.

## Who might the calendar method suit?

The calendar method is a poor choice for avoiding pregnancy. It may work for people who:

- Have regular cycles of 26 to 32 days, with at least 6 months of records.
- Would accept a pregnancy if it happened, for example because they want to space children and have no strong reason to avoid one.
- Cannot use hormonal methods for religious, cultural or health reasons, and will use condoms or abstain on fertile days.
- Are ready to track every cycle and avoid sex or use condoms for around 12 days each month.

It may also help people who are trying to conceive, because it shows when to have sex. The ovulation calculator is better for that.

## Who should not use it

Do not rely on this method if:

- Your cycles are irregular. The NHS says fertility awareness is not suitable with irregular periods.
- Two or more of your cycles in a year are shorter than 26 or longer than 32 days.
- You are within the first months after having a baby, while breastfeeding or after stopping hormonal contraception, because cycles are unpredictable.
- You are in your teens or approaching menopause, when cycles often change.
- You have a medical reason to avoid pregnancy, or you take medicines that could harm a baby.
- You need protection from sexually transmitted infections.

## Why the days can be wrong

- Ovulation does not happen on the same day in every cycle, even when your period is regular.
- Illness, stress, travel and weight change can all delay ovulation.
- Sperm survive for up to 5 days, so sex before the fertile days can still cause pregnancy.
- Cycle length from a few months ago may not predict the next one.

## Better options

If you want to avoid pregnancy, the most dependable choices are implants, IUDs and the injection. The pill, patch and ring also work well. Condoms protect against infections and can be combined with any other method. If you want to stay hormone-free, a copper IUD is an option, and a clinician can talk through every choice with you.

If you still want to use fertility awareness, ask a trained teacher. Methods that track temperature and cervical mucus, taught properly, can work better than counting days. The NHS notes that it takes 2 to 3 cycles to learn them, and you should use condoms while you learn.

## If you had sex on a fertile day

Emergency contraception reduces the chance of pregnancy and works best the sooner it is taken. A copper IUD works for up to 5 days. Pills work for up to 3 or 5 days depending on the type. If your next period is late, take a pregnancy test.

## When to see a doctor or pharmacist

- Your periods are irregular or have stopped.
- You want help choosing contraception.
- You had unprotected sex and need emergency contraception.
- You may be pregnant, or you are worried about infection.

## Nigeria and wherever you are

Condoms and many other methods can be bought without a prescription at pharmacies, and family planning clinics offer implants, IUDs and injections. Ask what is available near you. Many places offer them free or at low cost.

## Limits of this tool

It uses averages and your past cycles. It cannot see your hormones or confirm ovulation, so treat every date as a guess. It is general information, not medical advice.`,
    },
  },
};
