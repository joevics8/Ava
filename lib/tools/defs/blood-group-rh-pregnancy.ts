import type { Tool } from '../types';

export const tool: Tool = {
  id: 'blood-group-rh-pregnancy',
  category: 'pregnancy',
  related: ['genotype-compatibility', 'pregnancy-weeks-to-months', 'due-date-calculator'],
  text: {
    en: {
      slug: 'blood-group-compatibility-pregnancy',
      title: 'Baby Blood Group Calculator: ABO and Rh Factor',
      h1: 'Baby Blood Group and Rh Compatibility Calculator',
      description: 'Choose both parents’ blood group and Rh factor to see which blood groups a baby could have, and whether Rh incompatibility matters in pregnancy.',
      intro: 'Pick the mother’s and father’s ABO group and Rh factor. You will see which baby blood groups are possible and whether an Rh-negative mother needs extra care.',
      faqs: [
        { q: 'What blood group will my baby have?', a: 'A baby gets one ABO gene from each parent, so the group depends on the genes behind your blood groups. This calculator shows every group that is possible rather than a single answer.' },
        { q: 'What does Rh negative mean in pregnancy?', a: 'It means your red blood cells do not carry the Rh protein. If your baby is Rh positive, your body can form antibodies after exposure to the baby’s blood. Anti-D injections given by your maternity team prevent this.' },
        { q: 'Is Rh incompatibility a problem in a first pregnancy?', a: 'Usually not. Antibodies normally form during or after birth, so the risk is mainly for later pregnancies. Preventive treatment is offered in the first pregnancy to protect the next.' },
        { q: 'Can two parents with blood group A have a group O baby?', a: 'Yes, if both carry a hidden O gene. A group A parent can be AA or AO. If both are AO, there is a 1 in 4 chance of a group O baby.' },
      ],
      cta: 'Ava can explain your antenatal tests in plain language and keep your dates in one place.',
      article: `## Blood groups in one minute

Everyone has an ABO blood group (A, B, AB or O) and an Rh factor (positive or negative). The ABO group depends on genes inherited from both parents. A and B are dominant over O, so a person with group A may carry genes A and A, or A and O. That hidden O gene is why two group A parents can have a group O child.

## How the calculator works

You choose each parent’s group and Rh factor. Because a blood group does not reveal the genes behind it, the tool works out every combination that could be passed on. It lists the baby blood groups that are possible. It does not claim exact percentages, because those would need information that a blood group alone does not show.

## Rh factor and pregnancy

Rh is a protein on red blood cells. About 85 out of 100 people in many populations are Rh positive, but the share varies around the world. A problem can arise when the mother is Rh negative and the baby is Rh positive, which is only possible if the father is Rh positive or carries a positive gene.

If a small amount of the baby’s blood mixes with the mother’s, usually around delivery, her body can make antibodies against Rh positive cells. These antibodies can affect a later Rh positive baby. Maternity teams prevent this with an anti-D injection at set points in pregnancy and after birth when needed. Ask your midwife or doctor when your injections are due. If you are Rh negative, tell your care team about any bleeding, abdominal injury or procedure in pregnancy.

## Group O mothers and jaundice

If the mother is group O and the baby is group A, B or AB, there is a small increase in mild newborn jaundice. It is common and treatable, and your baby’s team will check for it.

## When to see a clinician

Your blood group and Rh factor are checked at your first antenatal visit. If you do not know your blood group, ask your clinic to test it early in pregnancy. Seek urgent care for any heavy bleeding in pregnancy, whatever your blood group.

## Limits of this tool

This tool is for understanding, not for planning your care. It does not replace a laboratory blood test, and it does not cover rare blood groups.`,
    },
  },
};
