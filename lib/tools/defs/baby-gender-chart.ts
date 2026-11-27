import type { Tool } from '../types';

export const tool: Tool = {
  id: 'baby-gender-chart',
  category: 'pregnancy',
  related: ['due-date-calculator', 'conception-date-calculator', 'ovulation-calculator'],
  text: {
    en: {
      slug: 'baby-gender-chart',
      title: 'Baby Gender Chart: Chinese Gender Predictor',
      h1: 'Baby Gender Chart (Chinese Gender Predictor)',
      description: 'Try the Chinese gender chart: enter your birth date and conception date for a boy or girl guess, plus the next 12 lunar months. For fun only.',
      intro: 'Enter your birth date and when you conceived (or your last period). The chart uses your lunar age and the lunar month of conception to give a boy or girl guess. It is a traditional game, not a prediction.',
      faqs: [
        { q: 'How does the Chinese gender chart work?', a: 'It adds your lunar age at conception to the lunar month of conception. An odd total points to a boy and an even total to a girl. Lunar age counts you as 1 at birth and adds a year at Chinese New Year.' },
        { q: 'Is the Chinese gender predictor accurate?', a: 'No. Checked against real births it is right about half the time, the same as a coin toss. Treat it as a bit of fun, not a prediction.' },
        { q: 'What decides a baby\'s sex?', a: 'Your egg always carries an X chromosome. The sperm carries either an X (girl) or a Y (boy), and that is settled at fertilisation. Your age or the lunar calendar cannot change it.' },
        { q: 'How can I find out my baby\'s sex for sure?', a: 'A blood screening test (NIPT) from about 10 weeks can show it with high accuracy where it is offered. The anatomy scan at around 18 to 22 weeks can usually show it too.' },
        { q: 'What date should I enter if I do not know when I conceived?', a: 'Choose the last period option. The tool adds 14 days to the first day of your last period, which is a good estimate of ovulation in a 28-day cycle.' },
        { q: 'Why does the chart use lunar age?', a: 'The chart comes from the traditional Chinese calendar, which counts age from 1 at birth and adds a year at Chinese New Year. That usually makes your lunar age one or two years more than your age in years.' },
        { q: 'What if my conception date is in a leap month?', a: 'The Chinese calendar adds a leap month about every three years. Different charts handle it differently, so the result for those dates is even less reliable. The tool will tell you when this applies.' },
        { q: 'Do other signs, like cravings or carrying high, predict the sex?', a: 'No. Cravings, how you carry, the baby\'s heart rate and the timing of sex have not been shown to predict or change a baby\'s sex.' },
      ],
      cta: 'Ava, the Telegram bot, can answer your pregnancy questions and keep your dates and scan reminders in one place.',
      article: `## What this baby gender chart does

This tool runs the traditional Chinese gender chart, also called the Chinese gender predictor. You enter your birth date and either the date you conceived or the first day of your last period. It works out your lunar age at conception and the lunar month of conception, then shows the chart's guess: boy or girl.

It also shows the guess for the next 12 lunar months, with the dates each one covers. That makes it a simple planning chart if you are curious about a future month.

Please treat it as a game. It is a piece of folklore, and it cannot tell you the sex of your baby. The sections below explain why, and what does work.

## How the Chinese gender chart works

The chart uses two numbers from the traditional Chinese calendar, which follows the moon:

- **Your lunar age at conception.** In the traditional count you are 1 at birth, and you gain a year at Chinese New Year rather than on your birthday. So your lunar age is usually one or two years above your age in years.
- **The lunar month of conception.** Lunar months last 29 or 30 days and do not line up with calendar months. Chinese New Year falls somewhere between late January and late February, and the months run on from there.

The simple version of the method adds the two numbers. An odd total points to a boy and an even total points to a girl. Printed charts that list ages down the side and months across the top can differ from each other in a few boxes, which is another sign that no one has a tested rule behind them.

The tool uses your browser's built-in Chinese calendar to find the lunar dates, so it does not depend on a table that could contain typing mistakes.

## How to find your conception date

Conception usually happens at ovulation, which is often about 14 days after the first day of your last period if your cycle is around 28 days. If you do not know the exact date, choose the last period option and the tool will add 14 days for you.

If your cycles are longer, shorter or irregular, the real date can be several days either side. For this chart that rarely matters, because a lunar month is about 30 days long, but a date close to a month boundary can flip the result. You can see the boundaries in the table of 12 lunar months.

## A note on leap months

The Chinese calendar adds an extra month about every three years to keep in step with the seasons. If your conception date falls in one of these leap months, the tool tells you. Different charts treat leap months in different ways, so the answer for those dates is even less settled than usual.

## How accurate is the Chinese gender chart?

Not accurate. When people have checked it against real births, it is right about half the time, which is exactly what a coin toss gives. You may hear of someone whose chart was right, and that is a coincidence, because a coin lands correctly half the time too. The chart is often described as hundreds of years old, but there is no solid evidence for where it came from or that it ever worked.

Biology explains why. Your egg always carries an X chromosome. The baby's sex depends on whether the sperm that fertilises it carries an X (girl) or a Y (boy). That happens at the moment of fertilisation, and your age on the lunar calendar has no way of changing it. Across the world slightly more boys than girls are born, about 105 boys for every 100 girls, so any fixed guess is close to a 50 to 50 bet.

Other popular signs are no better. Timing sex around ovulation, particular positions, diet, cravings, carrying high or low, and the baby's heart rate have not been shown to predict or change a baby's sex.

## How to find out your baby's sex for real

These methods are reliable:

- **A blood test from about 10 weeks.** Some prenatal screening tests (called NIPT or cell-free DNA tests) look at the baby's DNA in your blood and can show the sex with very high accuracy. They are offered mainly to screen for chromosome conditions, so availability and cost depend on where you live.
- **The anatomy scan at around 18 to 22 weeks.** An ultrasound can usually show the sex. It is not perfect, because the baby's position or the scan quality can make it unclear. Some clinics do not share the sex unless you ask.
- **Diagnostic tests such as amniocentesis or CVS.** These are offered only when there is a medical reason, and they carry a small risk of miscarriage, so they are never done just to learn the sex.

Ask your midwife or doctor what is offered in your area and when.

## Using the result sensibly

Share it with friends, compare it with your mother's guess, and enjoy the surprise when your baby arrives or the scan shows. Please do not buy clothes, choose names or make any decision about your pregnancy based on it. If you are worried about anything in your pregnancy, a midwife or doctor can help far more than a chart can.

Your birth date and dates are used only in your browser to work out the result. Nothing is saved or sent anywhere.`,
    },
  },
};
