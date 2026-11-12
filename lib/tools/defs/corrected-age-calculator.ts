import type { Tool } from '../types';

export const tool: Tool = {
  id: 'corrected-age-calculator',
  category: 'baby',
  related: ['vaccination-schedule', 'pregnancy-weeks-to-months', 'due-date-calculator'],
  text: {
    en: {
      slug: 'corrected-age-premature-baby-calculator',
      title: 'Corrected Age Calculator for Premature Babies',
      h1: 'Corrected Age Calculator for Premature Babies',
      description: 'Enter your baby’s birth date and weeks at birth to find their corrected age, the age to use for comparing growth and milestones after a premature birth.',
      intro: 'A baby born early is measured from the day they were due, not the day they were born. Enter the birth date and weeks at birth to see the corrected age.',
      faqs: [
        { q: 'What is corrected age?', a: 'It is your baby’s age counted from their due date instead of their birth date. A baby born 8 weeks early who is 5 months old has a corrected age of about 3 months.' },
        { q: 'Until what age do I use corrected age?', a: 'Most clinicians use it until about 2 years old. After that, the gap between the two ages matters less for development.' },
        { q: 'Do I use corrected age for vaccines?', a: 'No. Vaccines are usually given by age since birth, even for premature babies. Ask your child’s clinic if you are unsure.' },
        { q: 'What counts as premature?', a: 'A baby born before 37 weeks. Late preterm is 34 to 36 weeks, moderately preterm 32 to 33, very preterm 28 to 31 and extremely preterm below 28 weeks.' },
      ],
      cta: 'Ava can answer your questions about feeding, sleep and development as your baby grows.',
      article: `## What is corrected age?

A baby born at 40 weeks has had a full 40 weeks to grow in the womb. A baby born at 32 weeks has had 8 weeks less. Their body and brain are not 8 weeks behind in a worrying way: they simply started their outside life earlier. Corrected age, also called adjusted age, makes up for this difference by counting from the due date.

## How it is calculated

Take the number of weeks your baby was born before 40 weeks, then subtract that from their age since birth. Example: born 8 weeks early, now 20 weeks old (5 months). The corrected age is 12 weeks, or about 3 months. This calculator does the calendar maths for you and also shows the original due date.

## Premature categories

Gestational age is how many weeks pregnant you were at birth.

- **Late preterm:** 34 to 36 weeks and 6 days
- **Moderately preterm:** 32 to 33 weeks and 6 days
- **Very preterm:** 28 to 31 weeks and 6 days
- **Extremely preterm:** below 28 weeks

## What it is used for

Corrected age is the fairer age for comparing your baby’s milestones, such as smiling, rolling, sitting and first words, and for checking growth on charts. A baby born early may reach milestones a few weeks after others of the same birth date, and this is normal. Premature babies often use special growth charts as well.

## What it is not used for

Corrected age does not change when vaccinations are given or when your baby is considered ready for milk, solid foods or school. Your health visitor or paediatrician will advise on timing for solids, which is often between 4 and 6 months corrected age, but it depends on the baby.

## When to talk to a clinician

Seek advice if your baby has trouble feeding, is not gaining weight, seems unusually floppy or stiff, does not respond to sound or sight, or you are worried about their development. You know your baby best.

## Limits

This tool is a guide to dates. It cannot assess your baby’s health or development, and it is not a diagnosis.`,
    },
  },
};
