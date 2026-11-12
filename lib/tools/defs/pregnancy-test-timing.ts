import type { Tool } from '../types';

export const tool: Tool = {
  id: 'pregnancy-test-timing',
  category: 'pregnancy',
  related: ['ovulation-calculator', 'period-calculator', 'irregular-cycle-predictor'],
  text: {
    en: {
      slug: 'when-to-take-a-pregnancy-test',
      title: 'When to Take a Pregnancy Test: Date Calculator',
      h1: 'When to Take a Pregnancy Test',
      description: 'Enter the date of unprotected sex or your last period to find the earliest day a test can show positive and when a negative result can be trusted.',
      intro: 'Testing too early gives a false negative. Add the date of unprotected sex, or your last period and cycle length, to see when to test.',
      faqs: [
        { q: 'How soon after sex can I take a pregnancy test?', a: 'A very sensitive test may show positive from about 10 days after sex, but a negative then is not reliable. The NHS advises waiting 3 weeks (21 days) after unprotected sex for a trustworthy result.' },
        { q: 'Can I test before my missed period?', a: 'Some tests can pick up pregnancy a few days before the period is due, but they miss many early pregnancies. Testing from the first day of a missed period is more reliable.' },
        { q: 'What if my periods are irregular?', a: 'Use your longest recent cycle length when you calculate your expected period. If a test is negative but your period has not come, retest after 3 to 7 days.' },
        { q: 'Can a pregnancy test be wrong?', a: 'A false negative from testing too early or a diluted sample is common. A false positive is rare but can happen with some medicines, a recent pregnancy loss or certain medical conditions.' },
      ],
      cta: 'Ava can answer your questions about early pregnancy and keep your dates in one place.',
      article: `## How a pregnancy test works

A home test looks for hCG, a hormone made after a fertilised egg implants in the womb lining. hCG only starts to rise after implantation, which usually happens 6 to 12 days after ovulation, most often 8 to 10 days. Sperm can survive for up to 5 days, so conception can happen several days after sex. This is why the timing of a test matters.

## The earliest a test can work

Very sensitive tests may show a positive about 10 days after ovulation, which is about 4 days before a period is due. Most pregnancies are not detectable this early. A negative result before your period is due does not rule out pregnancy.

## When a negative result is reliable

- **From the first day of a missed period:** most home tests are reliable from this day.
- **3 weeks after unprotected sex:** if you do not know when you ovulated, this is the safest time to take a test, following NHS advice.

If you get a negative result but your period still has not come, wait 3 to 7 days and test again.

## Irregular cycles

If your cycles vary, you may not know when your period is due. Use your longest recent cycle length to estimate the expected date, and do not call a period late too early. For more detail on the length of your cycles, see our irregular cycle calculator.

## Getting the best result

- Use first-morning urine, which is more concentrated.
- Follow the instructions on the box, including the waiting time.
- Do not drink large amounts of fluid beforehand.
- Do not read the result after the time stated on the pack.

## After a positive result

A positive result is almost always correct. Book an appointment with a midwife or doctor to confirm and to begin antenatal care. If you take medicines regularly, ask whether they are safe in pregnancy before you stop or change anything.

## When to seek urgent help

Get urgent medical care for severe one-sided pain in the lower abdomen, heavy bleeding, shoulder-tip pain, dizziness or fainting, especially if you have a positive test. These can be signs of an ectopic pregnancy.

## Limits

This tool estimates timing from dates. It cannot tell you whether you are pregnant.`,
    },
  },
};
