import type { Tool } from '../types';

export const tool: Tool = {
  id: 'emergency-contraception-window',
  category: 'contraception',
  related: ['missed-pill-calculator', 'pregnancy-test-timing', 'sti-hiv-window-period'],
  text: {
    en: {
      slug: 'emergency-contraception-window-calculator',
      title: 'Emergency Contraception Window Calculator',
      h1: 'Emergency Contraception Window Calculator',
      description: 'See which emergency contraception options still work, by hours since unprotected sex: copper IUD, ulipristal and levonorgestrel. Free and private.',
      intro: 'Enter how long ago the unprotected sex happened and, if you wish, your weight. You will see which options are still possible.',
      faqs: [
        { q: 'How long after sex can I take the morning-after pill?', a: 'Levonorgestrel works best within 72 hours (3 days) and ulipristal within 120 hours (5 days). Both work better the sooner they are taken.' },
        { q: 'What is the most effective emergency contraception?', a: 'The copper IUD, which can be fitted up to 5 days after sex. It is more effective than any pill and can stay in as ongoing contraception.' },
        { q: 'Does my weight affect the emergency pill?', a: 'Levonorgestrel may work less well above about 70 kg or a BMI above 26. Ulipristal or a copper IUD is usually preferred. A pharmacist can advise.' },
        { q: 'When should I take a pregnancy test?', a: 'About 3 weeks after the sex, or sooner if your period is more than 7 days late, is unusually light or you have other signs of pregnancy.' },
      ],
      cta: 'Ava can answer your contraception questions privately, at any hour.',
      article: `## Emergency contraception in brief

Emergency contraception reduces the chance of pregnancy after sex without a condom, when a condom failed, or after missed contraceptive pills. It does not end an existing pregnancy and does not protect against infections. It works by delaying or preventing ovulation, or in the case of a copper IUD, by stopping an egg from implanting and preventing fertilisation.

## The three options

- **Copper IUD (coil):** the most effective option. It can be fitted by a trained clinician up to 5 days after unprotected sex, or up to 5 days after the earliest possible ovulation. It can then stay in as regular contraception for years.
- **Ulipristal acetate pill:** a single tablet that works for up to 120 hours (5 days). It stays effective as the hours pass, but is still better taken early. It can reduce the effect of hormonal contraception, so you need to wait 5 days before starting or restarting it.
- **Levonorgestrel pill:** a single tablet licensed for up to 72 hours (3 days). It works best when taken as soon as possible.

## Does weight matter?

Studies suggest levonorgestrel may be less effective at higher body weight. UK guidance mentions a weight above 70 kg or a BMI above 26. In that case, ulipristal or a copper IUD is often preferred. Ask a pharmacist or clinic which fits you.

## Medicines and breastfeeding

Some medicines, such as rifampicin, certain epilepsy medicines and St John’s wort, can make emergency pills less effective. Tell the pharmacist what you take. Levonorgestrel is considered safe when breastfeeding. With ulipristal the usual advice is to avoid breastfeeding for about a week, so ask for advice.

## After taking it

Your next period may come earlier or later than usual. If it is more than 7 days late, or unusually light, take a pregnancy test. Take a test 3 weeks after the sex in any case. Use condoms until your next period, and think about ongoing contraception.

## Infections

Emergency contraception does not prevent sexually transmitted infections. If you are worried, see a sexual health clinic and test at the right time.

## Where to get it

Many pharmacies sell emergency pills without a prescription, and sexual health clinics, family planning services and some doctors fit copper IUDs. If you are past the usual window, still contact a clinic: a copper IUD can sometimes still be fitted.

## Limits

This tool uses the licensed windows. It does not replace advice from a pharmacist or clinician, and it cannot tell you whether you are pregnant.`,
    },
  },
};
