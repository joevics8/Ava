// Mendelian inheritance of the haemoglobin alleles A (normal), S (sickle) and C.
// Each parent passes on one of their two alleles, each with probability 1/2.

export type Allele = 'A' | 'S' | 'C';
export const GENOTYPES = ['AA', 'AS', 'AC', 'SS', 'SC', 'CC'] as const;
export type Genotype = (typeof GENOTYPES)[number];

const canonical = (a: Allele, b: Allele): Genotype => {
  const order = { A: 0, C: 1, S: 2 } as const;
  const [x, y] = order[a] <= order[b] ? [a, b] : [b, a];
  const g = `${x}${y}`;
  // Normalise to the names people use: AS, AC, SC.
  return (g === 'AC' ? 'AC' : g === 'AS' ? 'AS' : g === 'CS' ? 'SC' : g) as Genotype;
};

const alleles = (g: Genotype): [Allele, Allele] => [g[0] as Allele, g[1] as Allele];

/** Chance (0-100, whole percent for the 4 equal combinations) of each genotype in one child. */
export function childOutcomes(p1: Genotype, p2: Genotype): Record<Genotype, number> {
  const out: Record<Genotype, number> = { AA: 0, AS: 0, AC: 0, SS: 0, SC: 0, CC: 0 };
  for (const a of alleles(p1)) for (const b of alleles(p2)) out[canonical(a, b)] += 25;
  return out;
}

export type Level = 'none' | 'trait' | 'disease-risk';

export interface GenotypeResult {
  outcomes: Record<Genotype, number>;
  /** Chance a child has sickle cell disease (SS or SC). */
  sickleDisease: number;
  /** Chance a child has HbC disease (CC), usually mild. */
  hbcDisease: number;
  /** Chance a child is a carrier (AS or AC). */
  carrier: number;
  level: Level;
}

export function assess(p1: Genotype, p2: Genotype): GenotypeResult {
  const o = childOutcomes(p1, p2);
  const sickleDisease = o.SS + o.SC;
  const hbcDisease = o.CC;
  const carrier = o.AS + o.AC;
  const level: Level = sickleDisease > 0 || hbcDisease > 0 ? 'disease-risk' : carrier > 0 ? 'trait' : 'none';
  return { outcomes: o, sickleDisease, hbcDisease, carrier, level };
}
