import type { Tool } from '../types';

export const tool: Tool = {
  id: 'genotype-compatibility',
  category: 'pregnancy',
  related: ['blood-group-rh-pregnancy', 'due-date-calculator', 'pregnancy-weeks-to-months'],
  text: {
    en: {
      slug: 'genotype-compatibility-calculator',
      title: 'Genotype Compatibility Calculator: AA, AS, SS, AC',
      h1: 'Genotype Compatibility Calculator',
      description: 'Pick two genotypes (AA, AS, AC, SS, SC, CC) to see the chance a child has sickle cell disease or is a carrier. Free, private and easy to read.',
      intro: 'Choose the genotype of each partner. You will see the chance of each genotype in a child, including sickle cell disease, for every pregnancy.',
      faqs: [
        { q: 'What does it mean if both partners are AS?', a: 'Each pregnancy has a 25% chance of a child with sickle cell disease (SS), a 50% chance of a carrier (AS) and a 25% chance of a child with no sickle gene (AA). The chances are the same every time.' },
        { q: 'Can an AA and AS couple have a child with sickle cell disease?', a: 'No. A child can only have sickle cell disease if both parents pass on a sickle gene. With one AA parent, children are AA or AS, never SS.' },
        { q: 'Is AS the same as having sickle cell disease?', a: 'No. AS is sickle cell trait. Most people with the trait are healthy, but they can pass the gene to their children.' },
        { q: 'How do I find out my genotype?', a: 'A simple blood test called haemoglobin electrophoresis (or HPLC) shows your genotype. Ask a clinic or laboratory. A normal blood count alone does not tell you.' },
      ],
      cta: 'Questions about genetics, pregnancy or testing? Ava can explain it in plain language.',
      article: `## What is a genotype?

Your haemoglobin genotype describes the haemoglobin genes you inherited from your parents, one from each. Haemoglobin is the protein in red blood cells that carries oxygen. The most common versions are **A** (normal), **S** (sickle) and **C**.

- **AA** means two normal genes.
- **AS** means one normal gene and one sickle gene. This is sickle cell trait.
- **SS** means two sickle genes. This is sickle cell disease.
- **AC** is HbC trait, and **SC** means one sickle and one C gene. SC is a form of sickle cell disease, often milder than SS.

## How the calculator works

Each parent passes one of their two genes to a child, and either gene is equally likely. Four combinations are possible, each with a 25% chance. The calculator lists every combination and adds up the chances. The result is the chance for each pregnancy separately. Having one child with a condition does not change the chance for the next.

## Which pairings carry the most risk?

- **AA and anything:** no child can have sickle cell disease.
- **AS and AS:** a 25% chance of SS in each pregnancy.
- **AS and AC:** a 25% chance of SC in each pregnancy.
- **SS and AS:** a 50% chance of SS.
- **SS and SS:** every child has SS.

## What can couples do?

Knowing your genotype before pregnancy gives you choices. A genetic counsellor can explain the risks, discuss options such as prenatal testing, and help you plan care. Many people with sickle cell disease live full lives with regular care, and treatment keeps improving.

## Limits of this tool

The tool covers the A, S and C genes only. Other inherited conditions, such as beta thalassaemia, can interact with these genes. It does not replace counselling, and your genotype should always come from a laboratory test.`,
    },
  },
};
