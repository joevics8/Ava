import type { Tool } from '../types';

export const tool: Tool = {
  id: 'bbt-ovulation-checker',
  category: 'cycle',
  related: ['ovulation-calculator', 'irregular-cycle-predictor', 'period-calculator', 'pregnancy-test-timing'],
  text: {
    en: {
      slug: 'bbt-ovulation-checker',
      title: 'BBT Ovulation Checker: Read Your Chart',
      h1: 'BBT Ovulation Checker',
      description: 'Enter your morning temperatures to find the BBT shift that confirms ovulation, see a chart and learn what the three over six rule means. Free and private.',
      intro: 'Paste your daily morning temperatures, in Celsius or Fahrenheit, and the tool looks for the sustained rise that follows ovulation. It draws your chart and estimates the likely ovulation day. Remember that BBT confirms ovulation after it has happened and does not predict it.',
      faqs: [
        { q: 'How do I know if I ovulated from my BBT chart?', a: 'Look for a rise that stays up. Ovulation is likely when three or more readings in a row sit above the highest of the previous six, with the third at least 0.2 °C (about 0.4 °F) higher. The temperature usually stays raised until your next period.' },
        { q: 'How many days after ovulation does BBT rise?', a: 'The rise usually shows within one to two days of ovulation, so the day before the first high reading is the most likely ovulation day. It can be off by a day either way, which is why BBT is an estimate and not an exact date.' },
        { q: 'Can BBT predict ovulation?', a: 'No. The temperature only rises after the egg has been released, when the most fertile days have already passed. BBT is useful for confirming that ovulation happened and for learning your pattern over several cycles.' },
        { q: 'Why is my temperature not rising?', a: 'It may not have risen yet, you may not have ovulated this cycle, or the readings may be unreliable because of a late waking time, poor sleep, alcohol, illness or a thermometer that is not precise. One flat chart is not a diagnosis, but repeated flat charts are worth discussing with a doctor.' },
        { q: 'How should I take my basal body temperature?', a: 'Use the same thermometer and the same route (usually the mouth) every morning, before you get out of bed, eat, drink or talk, after at least 3 to 4 hours of sleep. Start on the first day of your period and note anything unusual.' },
        { q: 'What temperature rise counts as ovulation?', a: 'Most people see a rise of about 0.2 to 0.5 °C (roughly 0.4 to 1 °F) that lasts. Your own numbers vary, so what matters is a sustained step up from your own earlier readings, not a particular number.' },
        { q: 'Does alcohol or being ill affect BBT?', a: 'Yes. A fever, a night of drinking, a very short night, travel across time zones and some medicines can all raise or lower a reading. Mark those days with an asterisk and the tool leaves them out rather than letting them distort your coverline.' },
        { q: 'If my temperature stays high, am I pregnant?', a: 'Temperatures that stay raised for 18 days or more after the rise can be an early sign of pregnancy. A pregnancy test will tell you; a high chart alone does not.' },
      ],
      cta: 'Ava, the Telegram bot, can help you keep track of your cycle and your daily readings.',
      article: `## What the BBT ovulation checker does

Basal body temperature (BBT) is your lowest resting temperature, taken first thing in the morning. After ovulation, the hormone progesterone raises it slightly, and it stays up until your next period. This tool reads your list of daily temperatures, looks for that step up, and shows it on a simple chart.

It returns a likely ovulation day, the coverline it used, how big the rise was, and plain notes on how much to trust the result.

## How to use it

1. Choose Celsius or Fahrenheit.
2. Type or paste one reading per day, starting on day 1 of your period. Use new lines, spaces or commas, and a full stop for decimals.
3. Type a dash (-) for a day you did not measure.
4. Put an asterisk after a reading affected by illness, alcohol, a poor night or a very different waking time, for example 36.9*.
5. Press the button. You can enter up to 45 days.

Nothing you type is sent anywhere. It stays in your browser.

## How to take a useful reading

BBT is a very small signal, so routine matters more than the thermometer's price.

- Measure at about the same time every morning, after at least 3 to 4 hours of unbroken sleep.
- Do it before you sit up, drink, eat or talk.
- Use the same thermometer and the same place, usually the mouth.
- A digital thermometer that shows two decimal places in Celsius (or one in Fahrenheit) makes the pattern easier to see.
- Track for at least three cycles. One chart shows you very little about your pattern.

## The three over six rule

The method here is the "three over six" rule used in fertility awareness teaching.

1. Take the six readings before a possible rise and find the highest. That is your coverline.
2. If the next three readings are all above the coverline, and the third is at least 0.2 °C (about 0.4 °F) above it, the shift is confirmed.
3. If the third is above the coverline but not by 0.2 °C, a fourth reading above the coverline confirms it.

The estimated ovulation day is the day before the first higher reading, with a likely range of up to two days earlier. Ovulation does not leave a precise mark on the chart, which is why the tool gives a day and a range.

Days you mark as disturbed, or leave blank, are never guessed. They are left out when the coverline is set, and a missing day inside the rise stops the rule from being met.

## BBT confirms ovulation after the fact

This is the most important limit. The temperature rises after ovulation. By the time you can see a shift, the egg has been and gone, and your most fertile days are behind you. That means:

- BBT cannot tell you when to have sex in the current cycle.
- It can show you, over several months, roughly where in the cycle you tend to ovulate, which helps you time sex in later cycles.
- It is not a safe way to prevent pregnancy on its own. Sperm can survive up to five days, so you can conceive from sex before the rise.

If you want to know ovulation is close, ovulation predictor kits, cervical mucus changes and the ovulation calculator give earlier signals.

## Using your chart over time

One cycle tells you little, but three or four start to show a pattern. Note the day of the shift in each cycle. If it lands on a similar day each time, you can guess roughly when ovulation is due next, and then confirm it with ovulation test strips or cervical mucus. If the day moves around by a week or more, your cycles may be irregular, and the irregular cycle predictor will give you a wider window.

A short gap between the rise and your next period, under about 10 days, is worth mentioning to a doctor if it happens cycle after cycle and you are trying to conceive.

## Why your chart might look messy

A good chart has a lower phase, a clear step up, and a higher phase. Real charts are often untidy, and that is normal.

- **Illness or fever** raises readings for a few days.
- **Alcohol** the night before can push a reading up and disturb sleep.
- **Short or broken sleep, stress and shift work** add noise.
- **Different waking times** matter: temperature rises through the early morning.
- **Travel across time zones** and some medicines, including some hormonal treatments, change the pattern.
- **Missing days** make the coverline less reliable. Several gaps close to the rise can hide a real shift.

If the tool reports no clear shift, that does not mean you did not ovulate. It means this chart does not show it clearly. The rise may not have happened yet, it may be small, or the data may be too patchy.

## How accurate is it?

BBT is a reasonable way to confirm ovulation in people with fairly regular cycles who measure consistently, but it is not exact. The rise can be off by a day or two, some people have a gradual rather than a sharp rise, and some ovulating people have charts that are very hard to read.

BBT can be a poor choice shortly after having a baby, while breastfeeding, after stopping hormonal contraception, around a first period, approaching menopause, or with very irregular cycles or polycystic ovary syndrome. Charts from those times are harder to interpret.

This tool is a reading aid. It cannot diagnose a fertility problem or confirm that you have a healthy cycle.

## What is normal?

- Before ovulation, morning temperatures are often around 36.1 to 36.4 °C (97 to 97.6 °F), though your own baseline may be a little higher or lower.
- After ovulation they typically rise by about 0.2 to 0.5 °C (0.4 to 1 °F) and stay up for roughly 10 to 16 days.
- Your temperature drops again a day or two before your period if you are not pregnant.
- If it stays high for 18 days or more, take a pregnancy test.

The exact numbers matter less than the step up from your own earlier readings.

## When to see a doctor

Speak to a doctor or a pharmacist if:

- you have no periods for 3 months or longer, or your cycles are very irregular
- your chart shows no shift over several cycles and you want to conceive
- you have been trying for a pregnancy for 12 months (or 6 months if you are 35 or older) without success
- you have pain, very heavy bleeding or bleeding between periods
- you have a persistent fever or feel unwell, which is a reason to seek care, not to chart

A fertility clinic can check ovulation with blood tests for progesterone and ultrasound, which are more reliable than temperature.

## Nigeria and wherever you are

A basal thermometer is not essential. A reliable digital thermometer works, though it should show at least one decimal place. In hot weather, a warm room, fever from malaria or other infections, or a night without electricity can all change readings, so mark those days with an asterisk. If you have a fever, getting it checked matters more than the chart.`,
    },
  },
};
