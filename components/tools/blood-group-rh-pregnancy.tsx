'use client';
import { useState } from 'react';
import { ABO_GROUPS, assessBlood, type Abo, type Rh } from '@/lib/tools/logic/blood-group';
import { Answer, Notice, SelectField, Submit, ToolShell } from './ui';

const abo = ABO_GROUPS.map(g => ({ value: g, label: `Group ${g}` }));
const rh = [{ value: '+' as Rh, label: 'Rh positive (+)' }, { value: '-' as Rh, label: 'Rh negative (-)' }];

export default function BloodGroupRhPregnancy() {
  const [mA, setMA] = useState<Abo>('O'); const [mR, setMR] = useState<Rh>('-');
  const [fA, setFA] = useState<Abo>('A'); const [fR, setFR] = useState<Rh>('+');
  const [res, setRes] = useState<ReturnType<typeof assessBlood> | null>(null);
  const reset = () => setRes(null);

  return (
    <ToolShell
      onSubmit={() => setRes(assessBlood({ abo: mA, rh: mR }, { abo: fA, rh: fR }))}
      result={res && (
        <div>
          <Answer>Possible baby blood groups: {res.abo.flatMap(a => res.rh.map(r => `${a}${r}`)).join(', ')}</Answer>
          <p className="mt-2 text-sm text-muted-ink">These are the groups that are possible, not percentages. Your exact odds depend on genes a blood group does not show.</p>
          {res.rhConcern === 'possible' && (
            <Notice tone="caution" title="Rh-negative mother, baby could be Rh positive">
              This can matter in pregnancy, mostly for later pregnancies. It is managed with a routine blood test and an anti-D injection given by your maternity team at set points. Tell your midwife or doctor your blood group at your first visit so they can plan it.
            </Notice>
          )}
          {res.rhConcern === 'none' && <Notice title="No Rh difference">Both parents are Rh negative, so the baby will be Rh negative too. Rh incompatibility does not apply.</Notice>}
          {res.rhConcern === 'not-applicable' && <Notice title="Rh is not a concern here">A mother who is Rh positive does not form antibodies against an Rh positive or negative baby.</Notice>}
          {res.aboNote && <Notice title="Group O mother">If the baby is group A, B or AB, mild newborn jaundice is slightly more likely. It is usually easy to treat.</Notice>}
        </div>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Mother: ABO group" value={mA} onChange={v => { setMA(v); reset(); }} options={abo} />
        <SelectField label="Mother: Rh factor" value={mR} onChange={v => { setMR(v); reset(); }} options={rh} />
        <SelectField label="Father: ABO group" value={fA} onChange={v => { setFA(v); reset(); }} options={abo} />
        <SelectField label="Father: Rh factor" value={fR} onChange={v => { setFR(v); reset(); }} options={rh} />
      </div>
      <Submit>Check blood groups</Submit>
    </ToolShell>
  );
}
