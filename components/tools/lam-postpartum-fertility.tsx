'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { BREASTFEEDING_COMPATIBLE, checkLam, MAX_BABY_MONTHS, type Feeding, type LamResult } from '@/lib/tools/logic/lam';
import { Answer, DateField, Notice, SelectField, Submit, ToolShell, fmtDate } from './ui';

export default function LamPostpartumFertility() {
  const [birth, setBirth] = useState('');
  const [feeding, setFeeding] = useState<Feeding>('exclusive');
  const [period, setPeriod] = useState<'no' | 'yes'>('no');
  const [error, setError] = useState('');
  const [r, setR] = useState<LamResult | null>(null);

  function run() {
    setError(''); setR(null);
    const birthDate = parseDate(birth);
    if (!birthDate) return setError('Please enter your baby\'s date of birth.');
    const res = checkLam({ birthDate, feeding, periodReturned: period === 'yes', today: new Date() });
    if (!res.valid) return setError(res.ageDays < 0 ? 'That date is in the future.' : `This tool is for the first ${MAX_BABY_MONTHS} months after birth.`);
    setR(res);
  }
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setR(null); };

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={r && (
        <div>
          <Answer>{r.lamApplies ? 'You meet all 3 LAM conditions.' : 'LAM does not apply to you right now.'}</Answer>
          <ul className="mt-3 space-y-2">
            {r.criteria.map(c => (
              <li key={c.id} className="flex gap-2"><span aria-hidden="true">{c.met ? '✓' : '✗'}</span><span><span className="sr-only">{c.met ? 'Met: ' : 'Not met: '}</span>{c.label}</span></li>
            ))}
          </ul>
          <p className="mt-3">
            Your baby is {r.ageWeeks} weeks old. {r.lamApplies
              ? 'With all three conditions met and perfect use, LAM is about 98% effective. It stops working as soon as any one changes.'
              : 'LAM is only about 98% effective when all three conditions are met, so you need another method if you want to avoid pregnancy.'}
          </p>
          <Notice tone="caution" title="Fertility can return before your first period">
            {r.daysToContraception > 0
              ? `Pregnancy is very unlikely before day 21 after birth (${fmtDate(r.contraceptionByDate)}). Plan contraception to be in place by then.`
              : `Ovulation can happen from about 3 weeks after birth, and from ${fmtDate(r.contraceptionByDate)} you can become pregnant before your first period.`}
            {' '}If you are not breastfeeding fully, the risk starts earlier and is higher.
          </Notice>
          <Notice title="Methods usually suitable while breastfeeding">
            <ul className="list-disc space-y-1 pl-5">{BREASTFEEDING_COMPATIBLE.map(m => <li key={m}>{m}</li>)}</ul>
            <p className="mt-2">Pills containing oestrogen (the combined pill) are usually avoided while breastfeeding. Ask a clinician which method suits you.</p>
          </Notice>
        </div>
      )}
    >
      <DateField label="Your baby's date of birth" value={birth} onChange={reset(setBirth)} />
      <SelectField label="How are you feeding?" value={feeding} onChange={reset(setFeeding)}
        options={[
          { value: 'exclusive', label: 'Breast milk only, day and night, with no long gaps' },
          { value: 'mostly', label: 'Mostly breastfeeding, with some formula or food' },
          { value: 'no', label: 'Not breastfeeding' },
        ]} />
      <SelectField label="Have your periods returned?" value={period} onChange={reset(setPeriod)}
        options={[{ value: 'no', label: 'No periods since birth' }, { value: 'yes', label: 'Yes, I have had a period' }]}
        hint="Bleeding in the first 8 weeks after birth is normal and does not count as a period." />
      <Submit>Check LAM</Submit>
    </ToolShell>
  );
}
