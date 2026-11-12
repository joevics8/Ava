import type { Tool } from '../types';

export const tool: Tool = {
  id: 'vaccination-schedule',
  category: 'baby',
  related: ['corrected-age-calculator', 'pregnancy-weeks-to-months', 'due-date-calculator'],
  text: {
    en: {
      slug: 'child-vaccination-schedule-calculator',
      title: 'Child Vaccination Schedule Calculator by Date of Birth',
      h1: 'Child Vaccination Schedule Calculator',
      description: 'Enter your child’s date of birth to see a dated vaccine schedule with what is due now and what is coming up. WHO-style and US-style schedules.',
      intro: 'Add your child’s date of birth and pick a schedule. You will see each routine vaccine, the dates it is usually given, and what is due now.',
      faqs: [
        { q: 'Which schedule should I choose?', a: 'Use the one that is closest to your country’s programme, or your clinic’s card. Schedules differ between countries, so your child’s vaccination card and local clinic always take priority.' },
        { q: 'My child missed a vaccine. Do we start again?', a: 'Usually not. Most vaccines can be given late and the series continues from where it stopped. Ask your clinic what is due and when.' },
        { q: 'Can my baby have more than one vaccine at the same visit?', a: 'Yes. Giving several vaccines at one visit is safe and is standard practice in routine schedules.' },
        { q: 'Are vaccines given by corrected age for premature babies?', a: 'No. Premature babies are normally vaccinated by their age since birth, not their corrected age. Ask the clinic about your baby’s own plan.' },
      ],
      cta: 'Ava can remind you about your child’s checkups and answer questions in plain language.',
      article: `## Why a schedule matters

Routine childhood vaccines protect against serious infections such as measles, polio, whooping cough, pneumonia and meningitis. They work best when they are given at the recommended ages, because babies are most at risk from some infections in their first months. A dated schedule helps you plan clinic visits and spot what is due.

## How the calculator works

You enter your child’s date of birth and choose a schedule. The tool lists each routine vaccine with the window in which it is normally given and shows whether it is due now, upcoming or past. The windows are guides to typical ages, and the dose names are simplified.

## The two schedules

- **WHO-style routine schedule:** based on the schedule used in many countries with an expanded programme on immunisation. It includes a dose at birth, a series at 6, 10 and 14 weeks, and measles-containing vaccines at 9 months and later. Some vaccines, such as the malaria vaccine or yellow fever, are given only in countries where they are recommended, and they are marked.
- **US-style schedule:** based on a schedule that uses 2, 4 and 6 months, then boosters in the second year and again before school.

Many countries use a different mix. The United Kingdom, Australia, India, Nigeria, Brazil and others each publish their own. If your country’s schedule is not listed, use this as a guide and follow your clinic.

## Late or missed doses

If a dose is overdue, do not wait for the next routine visit. Contact your clinic. In most cases the dose is given as soon as possible and the series carries on, with no need to start again. Some vaccines have an upper age limit, such as the first rotavirus dose, which is why it is worth asking early.

## Before and after a vaccine

Mild fever, soreness or fussiness for a day or two is common. Seek urgent medical help for difficulty breathing, a high fever in a very young baby, a seizure, or a swollen face or lips after a vaccine.

## Limits

This tool is a guide. It cannot know your country’s current programme, your child’s health or earlier doses. Your child’s vaccination card and your local health service decide what is given.`,
    },
  },
};
