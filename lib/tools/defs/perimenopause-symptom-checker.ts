import type { Tool } from '../types';

export const tool: Tool = {
  id: 'perimenopause-symptom-checker',
  category: 'cycle',
  related: ['period-calculator', 'irregular-cycle-predictor', 'period-return-timeline', 'pregnancy-test-timing', 'lab-reference-ranges'],
  text: {
    en: {
      slug: 'perimenopause-symptom-checker',
      title: 'Perimenopause Symptom Checker: Am I in It?',
      h1: 'Perimenopause Symptom Checker',
      description: 'Answer a few questions about your age, periods, hot flushes, sleep and mood to see how closely they match perimenopause, and when to see a doctor.',
      intro: 'Answer a short checklist about your age, your periods and the symptoms you have noticed. You will see how closely the pattern resembles the menopause transition, what it does not explain, and when to see a doctor. It is not a diagnosis.',
      faqs: [
        { q: 'What are the first signs of perimenopause?', a: 'The most common first sign is a change in your periods, such as shorter or longer gaps, or lighter or heavier bleeding. Hot flushes, night sweats, poor sleep, mood changes and vaginal dryness often follow, but they vary a lot from woman to woman.' },
        { q: 'What age does perimenopause start?', a: 'It usually starts in the 40s, although some women notice changes in their late 30s. The average age at menopause in the UK is about 51, and symptoms commonly last several years, sometimes up to 7 to 9 years or longer.' },
        { q: 'What is the difference between perimenopause and menopause?', a: 'Perimenopause is the run-up, when hormones fluctuate and periods change. Menopause is a single point, confirmed when you have had no period for 12 months in a row. The years after that are called postmenopause.' },
        { q: 'Do I need a blood test to know if I am in perimenopause?', a: 'Usually not. If you are over 45 with typical symptoms, a doctor can usually recognise perimenopause without tests. Hormone levels swing from week to week, so one result can be misleading. Tests may be offered if you are under 45 or the picture is unclear.' },
        { q: 'Can I still get pregnant in perimenopause?', a: 'Yes. Fertility falls but ovulation can still happen, even with irregular periods. If you do not want a pregnancy, keep using contraception until a doctor advises you can stop, usually 2 years after your last period if under 50 and 1 year if over 50.' },
        { q: 'What else can cause symptoms like perimenopause?', a: 'Thyroid problems, anaemia, pregnancy, stress, depression, some medicines and hormonal contraception can all cause similar symptoms. That is why very heavy bleeding, bleeding after sex or between periods, and unexplained weight change should be checked rather than assumed to be perimenopause.' },
        { q: 'When should I see a doctor about perimenopause?', a: 'See a doctor if symptoms affect your sleep, mood, work or relationships, if bleeding is very heavy or lasts longer than 7 days, or if you bleed after 12 months without a period. Periods that skip or stop before 40 also need a proper check.' },
      ],
      cta: 'Ava, the Telegram bot, can help you track your cycle and symptoms to bring to your appointment.',
      article: `## What this perimenopause symptom checker does

This is a short checklist, not a test. You enter your age, describe what your periods have been doing, tick the symptoms you have noticed, and tick any warning features. The tool then shows how closely your pattern resembles the menopause transition, what is not explained by it, and when to see a doctor.

It never diagnoses. Only a doctor who knows your history can tell you what is behind your symptoms, and the answers stay in your browser.

## Perimenopause, menopause and postmenopause

These words describe different stages.

- **Perimenopause** is the transition before your periods stop. Hormones, especially oestrogen, rise and fall unpredictably, and symptoms begin.
- **Menopause** is a single point in time. It is confirmed when you have had no period for 12 months in a row, with no other reason such as pregnancy, hormonal contraception or surgery.
- **Postmenopause** is all the years after that.

## Average ages

- Menopause usually happens between 45 and 55. The average age in the UK is about 51.
- Perimenopause usually begins in the 40s, though some women notice changes in their late 30s.
- Symptoms commonly last several years. The NHS says 7 to 9 years or longer is common.
- Menopause between 40 and 45 is called early menopause. Before 40 it is called premature menopause or premature ovarian insufficiency. Both need a medical check.

Ages vary between women and between populations, so treat these as a guide. Smoking, some cancer treatments, removal of the ovaries and a family history can bring menopause earlier.

## Common symptoms

Not everyone has all of them, and some women have very few.

- Periods that change: shorter or longer gaps, skipped periods, lighter or heavier bleeding
- Hot flushes and night sweats
- Poor sleep, even without sweats
- Low mood, anxiety, irritability, brain fog
- Vaginal dryness, discomfort during sex, lower sex drive
- More urinary urgency or urine infections
- Aching joints, headaches, palpitations

Hot flushes, night sweats and vaginal dryness are the most typical of falling oestrogen. Poor sleep, low mood and brain fog are common in perimenopause but are also common for many other reasons, so the checker gives them less weight.

## How the checker works

Each answer adds points: your age band, the pattern of your periods, and the symptoms you ticked, with the more typical symptoms counting for more. The total is turned into one of four plain descriptions:

- the pattern does not strongly resemble the transition
- it partly resembles it
- it closely resembles it
- you have gone 12 months or more without a period, which fits the definition of menopause

The result is a description of a pattern, not a prediction or a diagnosis. Under 40 it never says closely, because other causes need to be looked at first. If your periods are hidden by hormonal contraception, a hormonal coil, hysterectomy, pregnancy or breastfeeding, the checker says periods are not a useful guide and stays modest.

## What perimenopause does not explain

This is the part many online quizzes skip. Some things are not simply "the change" and should be checked.

- **Very heavy bleeding**, such as soaking a pad or tampon every hour or two or passing large clots. This can cause anaemia and can be due to fibroids or polyps.
- **Bleeding between periods or after sex.**
- **Periods lasting longer than 7 days**, or cycles shorter than 21 days.
- **Any bleeding after 12 months without a period.** It is usually not serious, but it must always be checked.
- **Thyroid symptoms.** An overactive thyroid can cause a racing heart, trembling, heat intolerance and weight loss. An underactive one can cause tiredness, feeling cold, dry skin and low mood. A simple blood test can tell the difference.
- **Pelvic pain or bloating that does not settle.**
- **A late period when you could be pregnant.** Do a pregnancy test first.
- **Chest pain, fainting, or feeling hopeless or thinking of harming yourself.** These need help the same day.

## Do I need a blood test?

If you are over 45 and have typical symptoms, a doctor can usually recognise perimenopause from your story alone. Hormone tests are not usually needed, and one result can mislead because levels change from week to week. Tests are more useful under 45, when the picture is unclear, or to rule out other causes such as thyroid problems and anaemia.

## Contraception and pregnancy

Falling fertility does not mean no fertility. If you do not want to conceive, keep using contraception until a doctor says you can stop. The usual advice is 2 years after your last period if you are under 50, and 1 year if you are 50 or older. Hormonal methods can mask the signs, so a doctor can help you plan the right time to stop.

## Why symptoms can feel so different

Perimenopause is not a steady decline. Oestrogen can swing higher and lower than usual from month to month, so you may have a run of bad weeks followed by a calm spell. That is why many women doubt themselves, or are told it is stress. A pattern that keeps coming back over several months is more telling than a single bad week.

Other things can make the same symptoms feel worse: caring responsibilities, work pressure, a poor sleep routine, some medicines and low iron. Looking at the whole picture, rather than one symptom at a time, helps your doctor work out what to treat first.

## Talking to your doctor

It can be hard to raise these topics. A few lines can help:

- "My periods have changed over the last few months, and I would like to know if this could be perimenopause."
- "My sleep and mood have changed and it is affecting my work."
- "Can we check my thyroid and iron levels as well?"

If you feel dismissed, you can ask for the conversation to be noted in your records, or ask to see another doctor.

## What can help

You do not have to wait it out. Options include:

- hormone replacement therapy (HRT), which is the most effective treatment for hot flushes for most women
- non-hormonal medicines and talking therapies such as cognitive behavioural therapy
- vaginal oestrogen for dryness
- regular physical activity, not smoking, less alcohol and caffeine, and a cooler bedroom

A symptom diary is useful. Note period dates, flushes, sleep and mood for a few weeks and take it to your appointment.

## When to see a doctor

Get help the same day for chest pain, fainting, or thoughts of harming yourself. Book an appointment soon for very heavy bleeding, bleeding between periods or after sex, any bleeding after 12 months without a period, periods that skip or stop before 40, or thyroid-type symptoms. Book a routine appointment if symptoms affect your sleep, mood, work or relationships.

## Nigeria and wherever you are

Menopause is a normal stage of life everywhere, but it is often not talked about. You can start with a general practitioner, a gynaecologist or a clinic you trust. Ask for a thyroid test and a blood count if you feel exhausted, and say clearly which symptoms bother you most. Take your symptom diary with you.`,
    },
  },
};
