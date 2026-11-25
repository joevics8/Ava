'use client';
import { useState } from 'react';
import {
  assessWeightGain, BMI_LABEL, fmtKgLb, ftInToCm, lbToKg, round1, type Fetuses, type WeightGainResult,
} from '@/lib/tools/logic/pregnancy-weight-gain';
import { Answer, Notice, NumberField, SelectField, Submit, ToolShell } from './ui';

type Units = 'metric' | 'imperial';

const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

export default function PregnancyWeightGainCalculator() {
  const [units, setUnits] = useState<Units>('metric');
  const [fetuses, setFetuses] = useState<Fetuses>('single');
  const [cm, setCm] = useState('');
  const [ft, setFt] = useState('');
  const [inch, setInch] = useState('');
  const [start, setStart] = useState('');
  const [now, setNow] = useState('');
  const [week, setWeek] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<WeightGainResult | null>(null);

  function run() {
    setError('');
    const metric = units === 'metric';
    const heightCm = metric ? num(cm) : ftInToCm(num(ft), inch.trim() === '' ? 0 : num(inch));
    const startKg = metric ? num(start) : lbToKg(num(start));
    const currentKg = metric ? num(now) : lbToKg(num(now));
    const r = assessWeightGain({ heightCm, startKg, currentKg, week: num(week), fetuses });
    if ('error' in r) { setResult(null); return setError(r.error); }
    setResult(r);
  }
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setResult(null); };
  const u = units === 'metric' ? 'kg' : 'lb';

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={result && <Output r={result} />}
    >
      <SelectField label="Units" value={units} onChange={reset(setUnits)} options={[{ value: 'metric', label: 'Metric (kg, cm)' }, { value: 'imperial', label: 'Imperial (lb, feet and inches)' }]} />
      <SelectField label="Pregnancy" value={fetuses} onChange={reset(setFetuses)} options={[{ value: 'single', label: 'One baby' }, { value: 'twins', label: 'Twins' }]} />
      {units === 'metric' ? (
        <NumberField label="Height" unit="cm" value={cm} onChange={reset(setCm)} min={120} max={220} step={1} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Height" unit="feet" value={ft} onChange={reset(setFt)} min={3} max={7} step={1} />
          <NumberField label="Inches" value={inch} onChange={reset(setInch)} min={0} max={11} step={0.5} />
        </div>
      )}
      <NumberField label="Weight before pregnancy" unit={u} value={start} onChange={reset(setStart)} step={0.1} hint="Your weight just before you got pregnant, or at your first antenatal visit if you do not know." />
      <NumberField label="Weight now" unit={u} value={now} onChange={reset(setNow)} step={0.1} hint="Weigh at the same time of day, in light clothes." />
      <NumberField label="Weeks pregnant" value={week} onChange={reset(setWeek)} min={4} max={42} step={1} hint="Whole weeks, from your dating scan or due date." />
      <Submit>Check my weight gain</Submit>
    </ToolShell>
  );
}

function Output({ r }: { r: WeightGainResult }) {
  const tone = r.status === 'low' || r.status === 'high' ? 'caution' : 'info';
  const sign = r.gainKg > 0 ? '+' : '';
  return (
    <div>
      <Answer>{r.headline}</Answer>
      <p className="mt-2">{r.message}</p>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">Your gain so far</dt><dd>{sign}{fmtKgLb(r.gainKg)}</dd></div>
        <div><dt className="font-semibold">Usual range by week {r.week}</dt><dd>{r.expected ? `${fmtKgLb(r.expected.min)} to ${fmtKgLb(r.expected.max)}` : 'Not available'}</dd></div>
        <div><dt className="font-semibold">Total for the whole pregnancy</dt><dd>{r.total ? `${fmtKgLb(r.total.min)} to ${fmtKgLb(r.total.max)}` : 'No standard range'}</dd></div>
        <div><dt className="font-semibold">Weekly rate after week 13</dt><dd>{r.weekly ? `${round1(r.weekly.min)} to ${round1(r.weekly.max)} kg a week` : 'Not set for twins'}</dd></div>
        <div><dt className="font-semibold">Starting BMI</dt><dd>{r.bmi}, {BMI_LABEL[r.category]}</dd></div>
      </dl>
      <p className="mt-3 text-sm">First trimester: about 0.5 to 2 kg (1 to 4 lb) in total is usual.</p>
      {r.mentionToClinician && <Notice tone={tone} title="Worth mentioning to your midwife or doctor">Tell them at your next visit, or sooner if you are vomiting a lot, feel unwell, or notice sudden swelling of your face or hands, or a very fast rise in weight.</Notice>}
      <Notice title="Keep in mind">
        <ul className="list-disc space-y-1 pl-5">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      </Notice>
    </div>
  );
}
