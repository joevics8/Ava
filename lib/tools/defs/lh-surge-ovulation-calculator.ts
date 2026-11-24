import type { Tool } from '../types';

export const tool: Tool = {
  id: 'lh-surge-ovulation-calculator',
  category: 'cycle',
  related: ['ovulation-calculator', 'irregular-cycle-predictor', 'period-calculator'],
  text: {
    en: {
      slug: 'lh-surge-ovulation-calculator',
      title: 'Ovulation Test Guide: When to Test for LH',
      h1: 'LH Surge and Ovulation Test Calculator',
      description: 'Find the best day to start ovulation tests, when you ovulate after a positive LH test, and what faint lines, repeat positives or no surge mean.',
      intro: 'Enter your cycle length to see which day to start testing with ovulation (LH) strips and for how long. If you already have a positive, enter the date to see when ovulation is likely and your best days to try. You can also look up what a faint line, repeated positives or no surge can mean.',
      faqs: [
        { q: 'When should I start taking ovulation tests?', a: 'A common rule is to start on the day of your cycle that equals your cycle length minus 17. For a 28-day cycle that is day 11. If your cycles vary, count from your shortest recent cycle. Your kit leaflet gives the exact advice for your brand.' },
        { q: 'How long after a positive ovulation test do you ovulate?', a: 'Ovulation usually follows the start of the LH surge by about 24 to 36 hours, and sometimes up to 48 hours. The positive day and the day after are therefore your best days to try for a pregnancy.' },
        { q: 'What does a faint line on an ovulation test mean?', a: 'It usually means some LH is present, which is normal, but the surge has not started. Count a test as positive only when the test line is as dark as or darker than the control line, or when a digital test shows a positive symbol. Keep testing.' },
        { q: 'Why are my ovulation tests positive for several days?', a: 'The surge can last two to three days, and in some cycles LH stays raised longer. With PCOS, LH is often high all month, so strips can look positive without ovulation. Some medicines, a recent pregnancy and perimenopause can also cause positives.' },
        { q: 'Can I have a positive test and not ovulate?', a: 'Yes. Sometimes the body starts an LH surge but the egg is not released. Other signs of ovulation, such as stretchy discharge or a rise in waking temperature, can add confidence. A progesterone blood test about a week before your period can confirm ovulation.' },
        { q: 'What if I never get a positive ovulation test?', a: 'One cycle without a positive is common because of timing, dilute urine or a late ovulation. If it happens for two or more cycles, or your periods are far apart or absent, speak to a doctor. Causes such as PCOS and thyroid problems are common and can be treated.' },
        { q: 'What time of day is best to test?', a: 'Most kits work any time, but late morning to early evening is often suggested because LH usually appears in urine later in the day. Test at about the same time each day and avoid drinking a lot in the two hours before.' },
        { q: 'Can I use ovulation tests to avoid pregnancy?', a: 'No. Sperm can survive for several days before ovulation and tests can miss a surge. Use a reliable contraceptive method if you want to avoid pregnancy.' },
      ],
      cta: 'Ava, the Telegram bot, can remind you when to start testing and help you read your results.',
      article: `## What this ovulation test calculator does

An ovulation test, also called an LH test or ovulation predictor kit (OPK), checks your urine for luteinising hormone (LH). A few days before an egg is released, LH rises sharply. A positive test tells you this surge has started, so ovulation is close.

This tool helps with the three questions people ask most:

- Which day should I start testing, and for how long?
- I have a positive. When will I ovulate and what are my best days?
- What does my result mean when the line is faint, stays positive or never appears?

## When to start testing

Testing too early wastes strips. Testing too late can mean you miss the surge. A widely used rule, used by major kit makers, is to start on the day of your cycle that equals your cycle length minus 17. Day 1 is the first day of your period.

- **28-day cycle:** start on day 11.
- **32-day cycle:** start on day 15.
- **24-day cycle:** start on day 7.

If your cycles vary by more than a few days, base the start on your shortest cycle in the last six months. If you do not yet know your cycle length, track at least one full cycle first. A common back-up is to begin around day 10, but you may miss an early surge.

The calculator also shows a stop day, two days after your expected ovulation, or after your longest cycle if they vary. If you reach it without a positive, you can usually stop for that cycle and try again next time.

## How the calculation works

The tool uses one standard rule: ovulation happens about 14 days before your next period. It gives day 15 for a 28-day cycle and day 22 for a 35-day cycle, matching the site's ovulation calculator. The testing window starts four days before that expected day, which is the same as cycle length minus 17, and never earlier than day 5.

After a positive test, the timing comes from the surge itself. Ovulation typically follows about 24 to 36 hours later. Some people ovulate nearer 48 hours. The tool shows the likely day, the earliest and latest day, and your best days.

## How to take the test

- Read your kit leaflet first. Brands differ in sensitivity and what they call positive.
- Test at about the same time each day. Late morning to early evening often works well. Avoid the first urine of the day unless the leaflet says so, because LH usually shows later.
- Cut back on drinks for about two hours beforehand, so your urine is not diluted.
- Once the line starts to darken, test twice a day so you do not miss the peak.
- Use the same brand through a cycle. Strips and digital tests are not directly comparable.

## Reading your result

**Positive.** The test line is as dark as or darker than the control line, or a digital test shows a symbol. Your LH surge has started.

**Faint line.** Everyone makes some LH, so a light line is normal and means the surge has not yet begun. Keep testing.

**No line.** No surge has been detected on that day.

**Invalid.** There is no control line. Repeat with a new test.

## Best days to try for a pregnancy

The fertile window is about six days: the five days before ovulation and ovulation day. The egg lives for roughly 12 to 24 hours, but sperm can survive for several days. The days with the highest chance are the day before ovulation and the two days before that. A positive test therefore means you are already in your best days.

If you are trying to conceive, sex on the day of the positive and the following day, or every day or every other day across the window, is a sensible plan. UK NICE guidance also notes that regular sex every two to three days through the cycle works well without any tests, and that testing can add stress for some couples. Use the kits only if they help you.

## What unusual patterns can mean

**Several positives in a row.** The surge can last two to three days in a healthy cycle. A longer run can happen with PCOS, perimenopause, some medicines and recent pregnancy, because the pregnancy hormone hCG can also trigger some strips.

**PCOS.** LH is often above average with polycystic ovary syndrome, so strips may look positive or nearly positive for many days without an egg being released. Look for a clear rise and fall, and add other signs such as cervical mucus or a progesterone test.

**No surge.** One missed cycle is common. Not every cycle includes ovulation, and stress, illness, travel, breastfeeding and weight change can delay it. Repeated cycles with no surge are worth discussing with a clinician.

**Positive but no pregnancy.** A positive test does not prove ovulation. A small share of surges are not followed by an egg being released. Pregnancy also depends on many other factors.

## How accurate are ovulation tests?

They are good at detecting the surge when used correctly, and are more reliable than counting days. They cannot confirm that an egg was released or that you can get pregnant. Accuracy falls with very dilute urine, a mistimed test, irregular cycles, PCOS and some medicines, so read results alongside your cycle dates and body signs.

## When to see a doctor

- You are under 35 and have been trying for a year without success, or 35 or older and trying for six months. Go sooner if your periods are very irregular or absent, or you have known conditions such as endometriosis.
- Your cycles are shorter than 21 days or longer than 35 days.
- You have had no surge for two or more cycles.
- You have signs of PCOS, such as irregular periods, excess facial or body hair or acne.
- You have pelvic pain with periods or sex.

## Nigeria and wherever you are

Ovulation strips are sold in many pharmacies and online, and prices vary. Cheap strips work well if you follow the leaflet. Keep them dry and in a cool place, because heat and humidity can damage them. Check the expiry date. A clinic can run a progesterone blood test if you want to confirm ovulation.`,
    },
  },
};
