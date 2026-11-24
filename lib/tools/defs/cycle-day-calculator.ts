import type { Tool } from '../types';

export const tool: Tool = {
  id: 'cycle-day-calculator',
  category: 'cycle',
  related: ['period-calculator', 'ovulation-calculator', 'irregular-cycle-predictor'],
  text: {
    en: {
      slug: 'cycle-day-calculator',
      title: 'Cycle Day Calculator: What Day Am I On?',
      h1: 'Cycle Day Calculator',
      description: 'Find out what day of your cycle it is, which phase you are in, how many days until your next period and what to expect. Free and private.',
      intro: 'Enter the first day of your last period and your usual cycle length. You get today\'s cycle day, your phase (menstrual, follicular, ovulation or luteal), the days until your next period and what is common in that phase. Nothing you enter is saved.',
      faqs: [
        { q: 'How do I know what day of my cycle I am on?', a: 'Day 1 is the first day of full period bleeding. Count that day as 1 and add one for each day after it. If your period started on the 1st and today is the 10th, you are on cycle day 10. This calculator does the counting for you.' },
        { q: 'Does spotting count as day 1?', a: 'Usually not. Light spotting before your period starts is not counted. Day 1 is the first day of real flow that needs a pad, tampon or cup. If bleeding starts late in the evening, many people count the next day as day 1.' },
        { q: 'What are the four phases of the menstrual cycle?', a: 'They are the menstrual phase (your period), the follicular phase (the build-up to ovulation), ovulation (an egg is released) and the luteal phase (after ovulation, until the next period). The first day of your period starts the next menstrual phase.' },
        { q: 'What cycle day do I ovulate on?', a: 'Ovulation happens about 14 days before your next period, so in a 28-day cycle that is around day 14 or 15. In a 35-day cycle it is closer to day 22. It varies between people and between cycles, so treat the date as an estimate.' },
        { q: 'How long is a normal menstrual cycle?', a: 'The NHS describes regular cycles of 21 to 35 days as normal, with an average of about 28 days. Cycles can differ by a few days from month to month. Teenagers and women approaching menopause often have more variation.' },
        { q: 'Why does it say my period is late?', a: 'Your cycle day has passed the length you entered. A few days late is common after stress, illness, travel or changes in sleep or weight. If you could be pregnant, test from the first day of a missed period. If you are not pregnant and your period is more than a week late, or this keeps happening, speak to a clinician.' },
        { q: 'Can I use my cycle day to avoid pregnancy?', a: 'No. This tool estimates your phase from your usual cycle length, which is not accurate enough to prevent pregnancy. Sperm can survive for days and ovulation can shift. Use a reliable method of contraception if you want to avoid pregnancy.' },
      ],
      cta: 'Ava, the Telegram bot, can track your cycle day and tell you when your next period is due.',
      article: `## What this cycle day calculator does

Your cycle day tells you where you are between one period and the next. Day 1 is the first day of your period, and the count carries on until the day before your next period starts. Knowing the number helps you make sense of symptoms such as cramps, bloating, spots, tender breasts or changes in discharge and mood.

This calculator works out three things from your last period and your usual cycle length: the day of the cycle you are on, the phase you are in, and how many days remain until your next period. It also shows an estimated ovulation date and a short list of what is common in your current phase.

## How to use it

1. Enter the first day of your last period. Count the first day of full flow, not light spotting.
2. Enter your usual cycle length. This is the number of days from day 1 of one period to the day before the next. If you do not know, 28 is the average, but check your last few periods if you can.
3. Enter your usual period length, which is how many days you normally bleed.
4. Leave the date blank to find today's cycle day, or pick another date to look backwards or forwards.

If the date you check is more than a few days past your expected period, the tool tells you the period is late and suggests restarting the count when it arrives. Always enter the most recent period, because the count starts again with each new one.

## A worked example

Say your last period started on 1 March, your cycle is usually 30 days and your period lasts 5 days. On 12 March you are on cycle day 12, in the follicular phase. Your next period is expected on 31 March, and ovulation is estimated around cycle day 17, which is 17 March. If 31 March comes and goes, the tool shows how many days late you are and keeps you in the luteal phase until your period starts.

## How the calculation works

The cycle day is simple counting: the number of days since your last period began, plus one.

The phases are an estimate built on one widely used rule. Ovulation tends to happen about 14 days before your next period starts. The luteal phase, which runs from ovulation to your next period, is the steadiest part of the cycle. The first half is what changes most. That is why a longer cycle usually means a later ovulation, not a longer luteal phase.

From that rule the calculator splits your cycle like this:

- **Menstrual phase:** from day 1 for as many days as your period lasts.
- **Follicular phase:** from the end of your period until just before ovulation. It technically starts on day 1, but is shown after the bleed.
- **Ovulation phase:** the day before, the day of and the day after estimated ovulation.
- **Luteal phase:** from after ovulation until your next period.

In a 28-day cycle with a 5-day period, that is days 1 to 5 menstrual, 6 to 13 follicular, 14 to 16 ovulation and 17 to 28 luteal. Ovulation lands on day 15, matching the site's ovulation calculator. Some sources say day 14, which is within the margin of error.

## What happens in each phase

**Menstrual phase.** The womb lining sheds as a period. Hormone levels are at their lowest, so cramps, tiredness and a low mood are common. Heat, gentle movement, rest and simple pain relief help many people.

**Follicular phase.** Oestrogen rises as an egg follicle grows in the ovary. Many people feel their energy and mood improve. Discharge changes from dry or sticky to creamier and then clearer.

**Ovulation.** An egg is released and this is your most fertile time. You may notice clear, stretchy discharge, a higher sex drive, mild one-sided twinges or a little spotting. Ovulation happens once, and the egg lives for about a day, but sperm can survive for several days, so the fertile window is longer than the day itself.

**Luteal phase.** Progesterone rises, then falls if you are not pregnant. In the last week or so, premenstrual symptoms such as bloating, tender breasts, cravings, poor sleep and irritability are common. Your period usually starts 10 to 16 days after ovulation.

## A note on cycle syncing

You may see advice to eat, exercise or work differently in each phase. Hormones do change through the month, and some people feel better matching their activity to their energy. But good evidence that phase-based diets or workouts improve health is limited. Treat these ideas as optional and personal, not rules.

## How accurate is it?

The day count is exact if you enter the right date. The phase and ovulation dates are estimates. They assume your cycle is as regular as the number you entered, and that you ovulate 14 days before your next period. Real cycles move.

- Stress, illness, travel, shift work, breastfeeding, a recent pregnancy or stopping hormonal contraception can shift ovulation by days or weeks.
- If your cycle length varies by more than a few days, expect the phase boundaries to be less precise. The irregular cycle predictor can give a wider range.
- If you use hormonal contraception, you do not ovulate in the usual way, so the phases do not apply.

This tool cannot confirm that you ovulated. Ovulation tests, cervical mucus changes and a rise in waking temperature can give more evidence, and a progesterone blood test can confirm it.

## What counts as a normal cycle

The NHS describes regular cycles of 21 to 35 days as normal, with an average near 28 days. Periods commonly last 3 to 7 days. It is normal for the length to vary by a few days from cycle to cycle. In the first few years after periods start, and in the years before menopause, cycles are often less predictable.

## When to see a doctor

Speak to a doctor, nurse or pharmacist if you notice any of these:

- Periods that come less than 21 days or more than 35 days apart, most of the time.
- No period for three months or more, and you are not pregnant.
- Bleeding for more than 7 days, or very heavy bleeding that soaks through a pad or tampon every hour or two.
- Bleeding between periods or after sex.
- Severe pain that stops you doing normal things or does not settle with usual pain relief.
- A period that is late when you could be pregnant. Do a pregnancy test first.
- Not having started periods by age 16.

Seek urgent care for sudden severe pelvic pain, fainting, or heavy bleeding with dizziness, especially if you might be pregnant.

## Nigeria and wherever you are

Pregnancy tests and basic pain relief are available at most pharmacies, and many clinics offer free or low-cost cycle and fertility advice. If you cannot get to a clinic easily, keep a simple note of the first day of each period in your phone or a diary. A few months of dates make this calculator far more accurate, and give a doctor useful information if you ever need to ask about your cycle.

Iron-rich food such as beans, green leafy vegetables, liver and fish can help if your periods are heavy. If you feel very tired or breathless, ask about a blood test for anaemia.`,
    },
  },
};
