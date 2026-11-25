'use client';
import { useState } from 'react';
import { kcalLabel, pregnancyNeeds, type Fetuses, type NeedsResult } from '@/lib/tools/logic/pregnancy-needs';
import { Answer, Notice, NumberField, SelectField, Submit, ToolShell } from './ui';

export default function PregnancyCalorieWaterCalculator() {
  const [week, setWeek] = useState('');
  const [fetuses, setFetuses] = useState<Fetuses>('single');
  const [extra, setExtra] = useState<'no' | 'yes'>('no');
  const [error, setError] = useState('');
  const [result, setResult] = useState<NeedsResult | null>(null);

  function run() {
    setError('');
    const r = pregnancyNeeds({ week: week.trim() === '' ? NaN : Number(week), fetuses, extraFluidFactors: extra === 'yes' });
    if ('error' in r) { setResult(null); return setError(r.error); }
    setResult(r);
  }
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setResult(null); };

  return (
    <ToolShell onSubmit={run} error={error} result={result && <Output r={result} />}>
      <NumberField label="Weeks pregnant" value={week} onChange={reset(setWeek)} min={1} max={42} step={1} hint="Whole weeks, from your dating scan or due date." />
      <SelectField label="Pregnancy" value={fetuses} onChange={reset(setFetuses)} options={[{ value: 'single', label: 'One baby' }, { value: 'twins', label: 'Twins' }]} />
      <SelectField label="Vomiting, hot weather or very active?" value={extra} onChange={reset(setExtra)} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
      <Submit>Show my daily needs</Submit>
    </ToolShell>
  );
}

function Output({ r }: { r: NeedsResult }) {
  return (
    <div>
      <Answer>{kcalLabel(r.extraKcal)}</Answer>
      <p className="mt-1 text-sm">Week {r.week}, trimester {r.trimester}. US guidance gives {r.extraKcal.us === 0 ? 'none' : `about ${r.extraKcal.us}`} extra; UK guidance is lower. Treat it as a ceiling, not a target.</p>
      {r.twinNote && <Notice tone="caution">{r.twinNote}</Notice>}

      <h3 className="mt-5 font-display text-lg font-bold">What the extra looks like</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{r.mealIdeas.map((m, i) => <li key={i}>{m}</li>)}</ul>
      <div className="mt-3 space-y-2 text-sm">
        {r.foodIdeas.map(f => <p key={f.group}><span className="font-semibold">{f.label}: </span>{f.examples}</p>)}
      </div>
      <p className="mt-2 text-xs text-muted-ink">{r.foodNote}</p>

      <h3 className="mt-5 font-display text-lg font-bold">Fluids</h3>
      <p className="mt-1 text-sm">Aim for about <strong>{r.drinks.lowL} to {r.drinks.highL.toFixed(1)} litres</strong> of drinks a day, roughly {r.drinks.lowCups} to {r.drinks.highCups} cups of 250 ml. {r.fluidNote}</p>
      <p className="mt-1 text-xs text-muted-ink">{r.totalWaterNote}</p>

      <h3 className="mt-5 font-display text-lg font-bold">Key nutrients</h3>
      {r.folicAcidStillAdvised && <Notice tone="caution" title="Folic acid">You are in the first 12 weeks, when folic acid matters most. If you are not taking 400 micrograms a day, start now and tell your midwife or doctor.</Notice>}
      <ul className="mt-2 space-y-3 text-sm">
        {r.nutrients.map(n => (
          <li key={n.name}>
            <p className="font-semibold">{n.name}: <span className="font-normal">{n.amount}</span></p>
            <p>{n.why} {n.sources}</p>
            {n.note && <p className="text-xs text-muted-ink">{n.note}</p>}
          </li>
        ))}
      </ul>

      <h3 className="mt-5 font-display text-lg font-bold">Foods and drinks to avoid or limit</h3>
      <ul className="mt-1 space-y-1 text-sm">{r.avoid.map(a => <li key={a.title}><span className="font-semibold">{a.title}. </span>{a.detail}</li>)}</ul>

      <Notice title="When to ask for help">Talk to your midwife or doctor if you cannot keep food or fluids down, have very dark urine or dizziness, feel faint, have lost weight, or have a medical condition such as diabetes or anaemia.</Notice>
      <Notice><ul className="list-disc space-y-1 pl-5">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Notice>
    </div>
  );
}
