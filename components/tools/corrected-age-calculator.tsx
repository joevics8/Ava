'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { correctedAge, type CorrectedAgeResult } from '@/lib/tools/logic/corrected-age';
import { todayLocal } from '@/lib/tools/logic/pregnancy-dates';
import { fmtDate, Answer, DateField, NumberField, Notice, Submit, ToolShell } from './ui';

const span = (a: { months: number; weeks: number; days: number }) =>
  [a.months ? `${a.months} month${a.months === 1 ? '' : 's'}` : '', a.weeks ? `${a.weeks} week${a.weeks === 1 ? '' : 's'}` : '', a.days || (!a.months && !a.weeks) ? `${a.days} day${a.days === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ');

export default function CorrectedAgeCalculator() {
  const [dob, setDob] = useState(''); const [w, setW] = useState('32'); const [d, setD] = useState('0');
  const [res, setRes] = useState<CorrectedAgeResult | null>(null); const [err, setErr] = useState('');

  function run() {
    setErr(''); setRes(null);
    const birth = parseDate(dob);
    if (!birth) return setErr('Enter your baby’s date of birth.');
    const r = correctedAge(birth, Number(w), Number(d), todayLocal());
    if (!r) return setErr('Check the birth date (it cannot be in the future) and enter 22 to 42 weeks and 0 to 6 days.');
    setRes(r);
  }

  return (
    <ToolShell onSubmit={run} error={err}
      result={res && (
        <div>
          {!res.preterm ? (
            <><Answer>Born at {Number(w)} weeks: no correction needed</Answer><p className="mt-2">Your baby’s age is {span(res.chronological)}. Corrected age only applies to babies born before 37 weeks.</p></>
          ) : res.beforeDueDate ? (
            <><Answer>Corrected age: not born yet by due date</Answer><p className="mt-2">Your baby’s due date was {fmtDate(res.dueDate)}, in {res.daysToDueDate} day{res.daysToDueDate === 1 ? '' : 's'}. Until then, the corrected age is counted as before term.</p></>
          ) : (
            <><Answer>Corrected age: {res.corrected && span(res.corrected)}</Answer>
              <ul className="mt-3 space-y-1">
                <li><span className="text-muted-ink">Age since birth:</span> <strong>{span(res.chronological)}</strong></li>
                <li><span className="text-muted-ink">Born early by:</span> <strong>{res.earlyWeeks} weeks{res.earlyExtraDays ? ` ${res.earlyExtraDays} days` : ''}</strong> ({res.category})</li>
                <li><span className="text-muted-ink">Original due date:</span> <strong>{fmtDate(res.dueDate)}</strong></li>
              </ul></>
          )}
          {res.preterm && res.pastTwoYears && <Notice title="Over 2 years">Most clinicians stop using corrected age at about 2 years. Ask your child’s doctor what they prefer.</Notice>}
          <Notice title="How to use this">Corrected age is a guide for comparing development, such as smiling, sitting and walking. It is not a test. Talk to your child’s clinician about any worries.</Notice>
        </div>
      )}
    >
      <DateField label="Baby’s date of birth" value={dob} onChange={setDob} />
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Weeks at birth" value={w} onChange={setW} min={22} max={42} step={1} />
        <NumberField label="Extra days" value={d} onChange={setD} min={0} max={6} step={1} />
      </div>
      <Submit>Work out corrected age</Submit>
    </ToolShell>
  );
}
