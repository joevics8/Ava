import type { Tool } from '../types';

export const tool: Tool = {
  id: 'conception-date-calculator',
  category: 'pregnancy',
  related: ['due-date-calculator', 'ovulation-calculator', 'pregnancy-weeks-to-months', 'implantation-bleeding-vs-period'],
  text: {
    en: {
      slug: 'conception-date-calculator',
      title: 'Conception Date Calculator: When Did I Conceive?',
      h1: 'Conception Date Calculator',
      description: 'Estimate when you conceived from your due date, last period or ultrasound scan. See the likely range, the fertile window and how accurate it is.',
      intro: 'Choose your due date, the first day of your last period or your scan dating, and get the most likely conception date with a realistic range. It also shows the days when sex could have led to the pregnancy, because sperm can survive for up to 5 days.',
      faqs: [
        { q: 'How do I calculate my conception date from my due date?', a: 'Count back 266 days from your due date. That is the usual length of pregnancy from conception, which is 38 weeks. The same answer comes from taking your due date back 280 days to your last period and adding 14 days.' },
        { q: 'Can I know the exact day I conceived?', a: 'Not from a calculator or a scan. Conception happens after sex, and sperm can wait in the body for up to 5 days before an egg is released. Even when you know the dates of sex, the egg may have been fertilised several days later.' },
        { q: 'How accurate is a conception date?', a: 'Treat it as a range of about a week either side. A scan in the first 8 weeks is usually accurate to within about 5 days, and a date worked out from your last period is only as good as your cycle is regular.' },
        { q: 'Is conception the same as the day I had sex?', a: 'No. Conception is when the sperm fertilises the egg. This happens within about 24 hours after ovulation. Sex up to 5 days before ovulation, and on the day itself, can lead to pregnancy.' },
        { q: 'Why does my scan give a different conception date from my last period?', a: 'Your cycle may be longer or shorter than 28 days, or you ovulated earlier or later than day 14. In the first trimester a scan is usually the better guide, which is why clinicians may change a due date when the two differ by more than about a week.' },
        { q: 'How is the conception date different for a longer or shorter cycle?', a: 'Ovulation usually happens about 14 days before the next period, not on day 14. In a 35-day cycle ovulation falls around day 21, and in a 24-day cycle around day 10. This calculator adjusts for your cycle length.' },
        { q: 'When does implantation happen after conception?', a: 'Usually 6 to 12 days after ovulation. A pregnancy test is most reliable from the first day of a missed period.' },
      ],
      cta: 'Ava can help you track your pregnancy dates and answer questions along the way.',
      article: `## What this conception date calculator does

This tool works out the most likely day you conceived, with a realistic range around it. You can start from any of three things:

- **Your due date.** The calculator counts back 266 days, which is the usual time from conception to birth.
- **The first day of your last period (LMP).** It places ovulation about 14 days before your next expected period, so you can enter your usual cycle length.
- **An ultrasound scan.** Enter the weeks and days of pregnancy on your scan report and the date of the scan.

You also get the days when sex could have led to this pregnancy, the usual window for implantation, and your due date.

## How to use it

1. Pick what you know: due date, last period or scan.
2. Enter the date. For a last period, use the first day of full bleeding and add your usual cycle length. If you are unsure, use 28.
3. For a scan, enter the weeks and days exactly as printed on the report, plus the date the scan was done.
4. Read the result as a range, not a single day.

Your information stays in your browser. Nothing is saved or sent anywhere.

## How the calculation works

Pregnancy is counted from the first day of your last period, not from conception. A full-term pregnancy is about 40 weeks (280 days) from that date. Because conception happens roughly two weeks later, it lasts about 38 weeks (266 days) from conception itself.

The standard assumption is a 28-day cycle with ovulation on day 14. So conception is estimated as:

- **Due date minus 266 days**, or
- **Last period plus 14 days**, adjusted for cycle length.

Cycle length matters. Ovulation usually happens about 14 days before your next period, so it depends on how long your cycle is.

| Usual cycle | Likely ovulation (cycle day) |
|---|---|
| 24 days | Day 10 |
| 28 days | Day 14 |
| 32 days | Day 18 |
| 35 days | Day 21 |

For a scan, the tool takes the gestational age on the report, works back to the first day of the last period it implies, and adds 14 days. This tells you the age of the pregnancy, which is what clinicians use. It does not prove the exact day of conception.

## Conception is not the day you had sex

Many people expect one clear date. In practice there are two separate events:

- **Sex.** Sperm can survive in the reproductive tract for up to 5 days, so sex on any of the 5 days before ovulation can lead to pregnancy.
- **Fertilisation.** The egg lives for about 12 to 24 hours after ovulation, so fertilisation happens close to ovulation, not close to sex.

Research tracking couples found a fertile window of about 6 days, ending on the day of ovulation. That is why the result shows a window of 5 days before to 1 day after the estimated conception day. If you had sex on only one day, the true conception date could still be several days later.

If you had sex on several days, you cannot tell which one led to the pregnancy. Neither a scan nor a calculator can settle that question.

## How accurate is it?

Think of the answer as a range of about a week either side, depending on how you started.

- **From a due date:** the range is about 7 days. If the due date came from a first-trimester scan, it is only as exact as that scan.
- **From your last period:** it is reasonably good when your cycles are regular and you know your cycle length. It is much less certain when cycles are irregular, because ovulation can move by a week or more.
- **From an ultrasound:** early scans are the most precise. Before about 9 weeks the margin is around 5 days, between 9 and 15 weeks around 7 days, and it widens to 10 days or more by the middle of pregnancy. After the first trimester, babies grow at different rates, so a scan measures size more than age.

Clinicians may change a due date to the scan date when the two differ by more than a set margin. ACOG gives margins that widen with the stage of pregnancy. If your scan and your period disagree, your due date is the one your midwife or doctor chooses, and that is the one to use.

Assisted conception is different. After IVF, the date of egg collection or embryo transfer gives a precise date, and your clinic will have worked out your dates from it.

## What is normal?

- Cycles anywhere from about 24 to 35 days are common and considered regular.
- Ovulation rarely falls on exactly day 14, even in a 28-day cycle.
- Babies are born across a wide span. Only a small share arrive on the due date, and birth between 37 and 42 weeks is considered term.
- Implantation usually happens 6 to 12 days after ovulation. A very light spot of blood around then is common.

## When to see a doctor or midwife

Book an appointment if:

- You think you are pregnant and have not yet had a booking appointment or scan.
- Your dates do not make sense, for example a scan much smaller or larger than expected.
- Your periods are very irregular, so you do not know when you ovulated.
- You have severe one-sided pain, heavy bleeding or feel faint in early pregnancy. This needs urgent care, since it can be a sign of an ectopic pregnancy.

A first scan is the best way to confirm your dates and the number of babies.

## Using your result

Your conception date helps in a few practical ways:

- **Testing.** A pregnancy test is most reliable from the first day of a missed period, which is about 14 days after ovulation.
- **Booking care.** Antenatal care is best started early. Take your last period date and any scan report with you.
- **Making sense of weeks.** Your pregnancy is counted in weeks from your last period, so you are already about 2 weeks pregnant at conception. Our pregnancy weeks to months tool turns this into months.

## Nigeria and wherever you are

Keep your records together. Write down the first day of your last period as soon as you suspect a pregnancy, and keep every scan report, because the first scan is your best guide to dates and different clinics may ask for them. If you only know roughly when your last period began, give your clinician that range instead of a guess.

## Limits of this tool

This is a general estimate based on averages. It does not replace a scan or advice from your midwife or doctor. It cannot tell you who the father is, and it cannot confirm that you are pregnant. A pregnancy test can.`,
    },
  },
};
