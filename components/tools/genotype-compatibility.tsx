'use client';
import { useState } from 'react';
import { assess, GENOTYPES, type Genotype } from '@/lib/tools/logic/genotype';
import { Answer, Notice, SelectField, Submit, ToolShell } from './ui';

const LABEL: Record<Genotype, string> = { AA: 'AA', AS: 'AS (sickle cell trait)', AC: 'AC (HbC trait)', SS: 'SS (sickle cell disease)', SC: 'SC (HbSC disease)', CC: 'CC (HbC disease)' };
const NAME: Record<Genotype, string> = { AA: 'AA (no sickle or C gene)', AS: 'AS (carrier)', AC: 'AC (carrier)', SS: 'SS (sickle cell disease)', SC: 'SC (sickle cell disease)', CC: 'CC (HbC disease, usually mild)' };
const options = GENOTYPES.map(g => ({ value: g, label: LABEL[g] }));

export default function GenotypeCompatibility() {
  const [a, setA] = useState<Genotype>('AS');
  const [b, setB] = useState<Genotype>('AS');
  const [result, setResult] = useState<ReturnType<typeof assess> | null>(null);

  return (
    <ToolShell
      onSubmit={() => setResult(assess(a, b))}
      result={result && (
        <div>
          <Answer>{result.sickleDisease > 0 ? `${result.sickleDisease}% chance of sickle cell disease in each child` : result.hbcDisease > 0 ? `${result.hbcDisease}% chance of HbC disease in each child` : 'No chance of sickle cell disease in a child'}</Answer>
          <ul className="mt-3 space-y-1">
            {GENOTYPES.filter(g => result.outcomes[g] > 0).map(g => (
              <li key={g}><span className="font-semibold">{result.outcomes[g]}%</span> <span className="text-muted-ink">chance of {NAME[g]}</span></li>
            ))}
          </ul>
          {result.level === 'disease-risk' && (
            <Notice tone="caution" title="Talk to a genetic counsellor or doctor">
              The percentages apply to every pregnancy separately: the same chance each time, regardless of earlier children. Counselling and prenatal testing can explain your options.
            </Notice>
          )}
          {result.level === 'trait' && (
            <Notice title="Carriers are usually healthy">A child with a trait (AS or AC) normally has no symptoms but can pass the gene on.</Notice>
          )}
        </div>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Partner 1 genotype" value={a} onChange={v => { setA(v); setResult(null); }} options={options} />
        <SelectField label="Partner 2 genotype" value={b} onChange={v => { setB(v); setResult(null); }} options={options} />
      </div>
      <Submit>Check compatibility</Submit>
    </ToolShell>
  );
}
