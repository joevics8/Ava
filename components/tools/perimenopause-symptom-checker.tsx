'use client';
import { useState } from 'react';
import {
  assessPerimenopause, validAge, FLAGS, SYMPTOMS, MIN_AGE, MAX_AGE,
  type FlagId, type PerimenopauseResult, type PeriodStatus, type SymptomId,
} from '@/lib/tools/logic/perimenopause';
import { Answer, Notice, NumberField, SelectField, Submit, ToolShell } from './ui';

const PERIODS: { value: PeriodStatus; label: string }[] = [
  { value: 'regular', label: 'Still regular, much as usual' },
  { value: 'changed', label: 'Changed: shorter or longer gaps, or lighter or heavier' },
  { value: 'skipping', label: 'Skipping periods (gaps of about 2 months or more)' },
  { value: 'stopped-under-12', label: 'No period for 3 to 11 months' },
  { value: 'stopped-12-plus', label: 'No period for 12 months or more' },
  { value: 'not-applicable', label: 'Not a guide: hormonal contraception or coil, hysterectomy, pregnant or breastfeeding' },
];

function Checks<T extends string>({ legend, items, value, onChange }: {
  legend: string; items: { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void;
}) {
  const toggle = (id: T) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <fieldset className="text-sm">
      <legend className="font-semibold">{legend}</legend>
      <div className="mt-2 space-y-1">
        {items.map(i => (
          <label key={i.id} className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-2.5 font-normal">
            <input type="checkbox" checked={value.includes(i.id)} onChange={() => toggle(i.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span>{i.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function PerimenopauseSymptomChecker() {
  const [age, setAge] = useState('');
  const [periods, setPeriods] = useState<PeriodStatus>('regular');
  const [symptoms, setSymptoms] = useState<SymptomId[]>([]);
  const [flags, setFlags] = useState<FlagId[]>([]);
  const [error, setError] = useState('');
  const [res, setRes] = useState<PerimenopauseResult | null>(null);

  function run() {
    const n = Number(age);
    if (!age.trim() || !validAge(n)) { setRes(null); return setError(`Please enter your age as a whole number between ${MIN_AGE} and ${MAX_AGE}.`); }
    setError('');
    setRes(assessPerimenopause({ age: n, periods, symptoms, flags }));
  }
  const clear = <T,>(set: (v: T) => void) => (v: T) => { set(v); setRes(null); };
  const tone = res?.urgency === 'urgent' ? 'urgent' : res?.urgency === 'soon' ? 'caution' : 'info';

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={res && (
        <div>
          <Answer>{res.headline}</Answer>
          <p className="mt-2 text-sm">{res.summary}</p>
          <p className="mt-2 text-sm">{res.agePoints}</p>
          {res.fits.length > 0 && (
            <div className="mt-3 text-sm">
              <p className="font-semibold">What fits the pattern</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">{res.fits.map(f => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
          {res.notExplained.length > 0 && (
            <Notice tone="caution" title="Not explained by perimenopause">
              <ul className="list-disc space-y-2 pl-5">{res.notExplained.map(n => <li key={n.id}><span className="font-semibold">{n.label}.</span> {n.why}</li>)}</ul>
            </Notice>
          )}
          <Notice tone={tone} title={res.urgency === 'urgent' ? 'Get help today' : res.urgency === 'soon' ? 'See a doctor soon' : 'When to see a doctor'}>{res.doctorAdvice}</Notice>
          {res.caveats.map(c => <p key={c} className="mt-3 text-sm">{c}</p>)}
          <p className="mt-3 text-sm text-muted-ink">This is a pattern check, not a diagnosis. Blood tests are not usually needed to recognise perimenopause over 45 and can be misleading because hormones swing from week to week.</p>
        </div>
      )}
    >
      <NumberField label="Your age" unit="years" value={age} onChange={clear(setAge)} min={MIN_AGE} max={MAX_AGE} step={1} />
      <SelectField label="Your periods in the last year" value={periods} onChange={clear(setPeriods)} options={PERIODS} />
      <Checks legend="In the last 3 months, have you noticed any of these more than usual?" items={SYMPTOMS} value={symptoms} onChange={clear(setSymptoms)} />
      <Checks legend="Has any of this happened? (tick all that apply)" items={FLAGS} value={flags} onChange={clear(setFlags)} />
      <Submit>Check my pattern</Submit>
    </ToolShell>
  );
}
