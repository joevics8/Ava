// ABO and Rh inheritance. Only the blood group (phenotype) is known, not the
// underlying genes, so results list what is POSSIBLE rather than false-precise
// percentages. e.g. a group A parent may carry AA or AO.

export type Abo = 'A' | 'B' | 'AB' | 'O';
export type Rh = '+' | '-';
export const ABO_GROUPS: Abo[] = ['A', 'B', 'AB', 'O'];

type Allele = 'A' | 'B' | 'O';
// Alleles a parent of each group could pass on (taking every genotype that group could be).
const PASSES: Record<Abo, Allele[]> = { A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B'], O: ['O'] };

function group(x: Allele, y: Allele): Abo {
  if (x === 'O' && y === 'O') return 'O';
  if (x !== 'O' && y !== 'O' && x !== y) return 'AB';
  return x === 'O' ? (y as Abo) : (x as Abo);
}

/** Every ABO group a child could have, in A, B, AB, O order. */
export function possibleChildAbo(mother: Abo, father: Abo): Abo[] {
  const found = new Set<Abo>();
  for (const x of PASSES[mother]) for (const y of PASSES[father]) found.add(group(x, y));
  return ABO_GROUPS.filter(g => found.has(g));
}

/**
 * Every Rh type a child could have. Rh-positive is dominant, so an Rh-positive
 * parent may carry one Rh-negative gene (Dd) and still pass it on. Two Rh-negative
 * parents can only have an Rh-negative child.
 */
export function possibleChildRh(mother: Rh, father: Rh): Rh[] {
  return mother === '-' && father === '-' ? ['-'] : ['+', '-'];
}

export type RhConcern = 'not-applicable' | 'none' | 'possible';

/**
 * Rh incompatibility matters when the mother is Rh-negative and the baby could be
 * Rh-positive. Her antibodies form after exposure to Rh-positive blood, so the
 * concern is mostly for later pregnancies and is prevented with anti-D injections.
 */
export function rhConcern(mother: Rh, father: Rh): RhConcern {
  if (mother === '+') return 'not-applicable';
  return father === '-' ? 'none' : 'possible';
}

/** Mother O with a baby who could be A, B or AB: mild newborn jaundice is a little more likely. */
export function aboNoteApplies(mother: Abo, father: Abo): boolean {
  return mother === 'O' && possibleChildAbo(mother, father).some(g => g !== 'O');
}

export interface BloodAssessment { abo: Abo[]; rh: Rh[]; rhConcern: RhConcern; aboNote: boolean }

export function assessBlood(mother: { abo: Abo; rh: Rh }, father: { abo: Abo; rh: Rh }): BloodAssessment {
  return {
    abo: possibleChildAbo(mother.abo, father.abo),
    rh: possibleChildRh(mother.rh, father.rh),
    rhConcern: rhConcern(mother.rh, father.rh),
    aboNote: aboNoteApplies(mother.abo, father.abo),
  };
}
