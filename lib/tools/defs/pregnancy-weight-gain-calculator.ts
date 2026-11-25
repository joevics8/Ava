import type { Tool } from '../types';

export const tool: Tool = {
  id: 'pregnancy-weight-gain-calculator',
  category: 'pregnancy',
  related: ['due-date-calculator', 'pregnancy-weeks-to-months', 'blood-group-rh-pregnancy'],
  text: {
    en: {
      slug: 'pregnancy-weight-gain-calculator',
      title: 'Pregnancy Weight Gain Calculator by Week',
      h1: 'Pregnancy Weight Gain Calculator',
      description: 'How much weight should you gain in pregnancy? See the range for your BMI, one baby or twins, and whether your gain is on track for your week.',
      intro: 'Enter your height, your weight before pregnancy, your weight now and how many weeks pregnant you are. You see the recommended total gain for your starting BMI and whether your gain is on track for this week. It uses the US National Academy of Medicine ranges that ACOG also uses.',
      faqs: [
        { q: 'How much weight should I gain during pregnancy?', a: 'It depends on your weight before pregnancy. With one baby the usual ranges are 12.5 to 18 kg if you started underweight, 11.5 to 16 kg at a healthy weight, 7 to 11.5 kg if overweight and 5 to 9 kg if your BMI was 30 or more. Your midwife or doctor may adjust this for you.' },
        { q: 'How much weight should I gain in the first trimester?', a: 'About 0.5 to 2 kg (1 to 4 lb) in total is typical. Many women gain nothing or lose a little because of nausea and food aversions, and that is usually fine if it settles. Tell your midwife if you cannot keep food or fluids down.' },
        { q: 'How much weight should I gain each week?', a: 'From about week 13, the usual rate is roughly 0.4 to 0.5 kg a week at a healthy BMI, less for a higher starting BMI and a little more for a lower one. Weekly weights bounce around, so look at the trend over a few weeks, not a single reading.' },
        { q: 'How much weight should I gain with twins?', a: 'Provisional ranges for twins are about 17 to 25 kg at a healthy starting weight, 14 to 23 kg if overweight and 11 to 19 kg if obese. There is no standard range if you started underweight. Because twins often arrive earlier, your care team will guide you.' },
        { q: 'What if I am gaining too much or too little?', a: 'Do not diet or cut food groups. Mention it at your next antenatal visit so they can check how you and the baby are doing and give you advice on food and activity. A one-off high or low reading is common and often settles.' },
        { q: 'Does the weight I gain include the baby?', a: 'Yes. It includes the baby, placenta, amniotic fluid, larger breasts and womb, extra blood and fluid, and fat stores. The baby is only part of it, usually about 3 to 3.5 kg at term.' },
        { q: 'Does this calculator work for short women or for Asian and African BMI cut-offs?', a: 'The ranges use standard BMI cut-offs for everyone, and BMI is a rough measure. It may over or under call your category if you are very muscular, very short or from a group with different body composition. Your clinician can interpret it for you.' },
        { q: 'Should I worry if I lost weight in pregnancy?', a: 'In the first trimester, small loss with morning sickness is common. After week 13 or if you are losing weight steadily, please tell your midwife or doctor soon.' },
      ],
      cta: 'Ava, the Telegram bot, can help you track your pregnancy weeks and answer questions about eating well.',
      article: `## What this pregnancy weight gain calculator does

This calculator tells you how much weight is generally recommended during pregnancy for your starting size, and whether your gain so far looks on track for how many weeks pregnant you are. It works for one baby or twins, and accepts kilograms and centimetres or pounds, feet and inches.

You need four things: your height, your weight before pregnancy, your weight today and your week of pregnancy. The tool works out your pre-pregnancy BMI, picks your category and compares your gain so far with the usual range for this stage.

## How to use it

1. Choose metric or imperial units.
2. Say whether you are expecting one baby or twins.
3. Enter your height and your weight just before you got pregnant. If you do not know it, use your weight at your first antenatal visit.
4. Enter your weight now, ideally weighed in the morning in light clothes.
5. Enter your whole weeks of pregnancy.

You then see your gain so far, the usual range for this week, the total expected for the whole pregnancy and the weekly rate.

## How much weight should I gain during pregnancy?

The ranges come from the 2009 report by the US Institute of Medicine (now the National Academy of Medicine), which the American College of Obstetricians and Gynecologists (ACOG) also follows. They depend on your BMI before pregnancy.

| Starting BMI | Total gain, one baby | Weekly gain after week 13 |
|---|---|---|
| Under 18.5 (underweight) | 12.5 to 18 kg (28 to 40 lb) | about 0.44 to 0.58 kg |
| 18.5 to 24.9 (healthy) | 11.5 to 16 kg (25 to 35 lb) | about 0.35 to 0.5 kg |
| 25 to 29.9 (overweight) | 7 to 11.5 kg (15 to 25 lb) | about 0.23 to 0.33 kg |
| 30 or more (obese) | 5 to 9 kg (11 to 20 lb) | about 0.17 to 0.27 kg |

For the first trimester the report assumes a total of about 0.5 to 2 kg (1 to 4 lb). The tool builds the expected range for each week by adding the weekly rate for your category from week 13.

## Weight gain by week of pregnancy

Weight gain is not even. In the first 13 weeks most women gain very little. Many gain nothing, and some lose a little with nausea and vomiting. Weight picks up in the second and third trimesters as the baby grows, and the placenta, womb, blood volume and fluid all increase.

Where does the weight go? The baby at term is usually around 3 to 3.5 kg. The rest is the placenta, amniotic fluid, a bigger womb and breasts, extra blood and body fluid, and fat stores that help with breastfeeding.

Your weight can also swing by a kilo or more from day to day because of fluid, meals and the time you weigh. For that reason, the tool treats results within 1 kg of the range as "slightly" above or below, rather than a problem. Look at the trend over several weeks.

## Twin pregnancy weight gain

The IOM ranges for twins are marked as provisional. They are about 17 to 25 kg (37 to 54 lb) if you started at a healthy weight, 14 to 23 kg (31 to 50 lb) if overweight and 11 to 19 kg (25 to 42 lb) if obese. There is no standard range for twins if you started underweight, so the tool does not give one.

Twins also often arrive before 40 weeks, so the week-by-week range for twins here is an estimate, reaching the total at about 37 weeks. Your care team will give you advice that fits your pregnancy.

## How accurate is it?

The result is only as good as the numbers you enter and the guideline behind it. Please keep these limits in mind.

- **BMI is a rough screen.** It does not measure muscle, fat or body shape. The pregnancy ranges use the same cut-offs for everyone, and some groups, for example many Asian women, are advised to use lower BMI cut-offs in other settings. Your clinician can interpret this for you.
- **Guidelines are averages, not targets.** Many healthy pregnancies fall outside them. A gain a little above or below the range does not mean something is wrong.
- **They are US-based.** Other countries' guidance, for example in the UK, focuses less on weekly targets and more on healthy eating and activity, and NICE does not recommend routine weighing to judge progress.
- **Some conditions change the advice.** Gestational diabetes, high blood pressure, eating disorders, a very high or very low BMI and being under 18 are examples. Your care team may set a different goal.
- **Weight alone does not show how the baby is growing.** Your midwife checks that with measurements of your bump and scans.

## What is normal?

It is normal to gain slowly early on, to gain faster in the second half, and to have weeks when the scale does not move. It is also normal to feel heavier from fluid in the evening, especially in hot weather. Slow, steady change is the pattern to look for.

Do not try to lose weight during pregnancy, even if you started above the range, unless your clinician advises it. Equally, do not force extra food. Eating regular balanced meals, drinking enough and staying active in the ways your clinician says are safe is the best approach.

## When to see a doctor or midwife

Please speak to your midwife or doctor if:

- you are losing weight after the first trimester, or you are unable to keep food or fluids down
- your gain is clearly above or below the range for several weeks
- you notice sudden swelling of the face, hands or feet, a severe headache, vision changes or pain under your ribs, which can be signs of pre-eclampsia and need urgent attention
- you are very worried about your weight or your eating

You do not need to wait for your next appointment if something feels wrong.

## Nigeria and wherever you are

In many clinics you are weighed at your booking visit, so ask for that number if you did not weigh yourself before pregnancy. Use the same scale each time if you can, since scales differ. Routine weighing varies between clinics and countries. If you are underweight or struggle to eat enough, tell your midwife, as there is help with food and supplements. Balanced meals built around beans, eggs, fish, vegetables and a starchy food such as yam, rice or millet cover most needs, and you do not need special or expensive foods. A mid-pregnancy weight check at your clinic is a good moment to ask what your own range should be.

## The bottom line

Use this tool as a guide to see roughly where you are, not as a pass or fail. Use the numbers to start a conversation with your midwife or doctor, who knows your history and can advise what is right for you.`,
    },
  },
};
