'use client';
import { useState } from 'react';
import { assessEmergencyContraception, hoursBetween, type EcResult } from '@/lib/tools/logic/emergency-contraception';
import { Answer, Field, Notice, NumberField, SelectField, Submit, ToolShell, inputCls } from './ui';

export default function EmergencyContraceptionWindow() {
  const [mode, setMode] = useState<'hours' | 'when'>('hours');
  const [hours, setHours] = useState('');
  const [when, setWhen] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<EcResult | null>(null);

  function run() {
    setError(''); setResult(null);
    let h: number;
    if (mode === 'hours') h = Number(hours);
    else {
      const t = Date.parse(when);
      if (!when || Number.isNaN(t)) return setError('Please enter the date and time.');
      h = hoursBetween(t, Date.now());
    }
    if (!Number.isFinite(h) || h < 0 || (mode === 'hours' && hours.trim() === '')) return setError(mode === 'hours' ? 'Enter how many hours ago it happened (0 or more).' : 'That time is in the future.');
    setResult(assessEmergencyContraception({ hoursSince: h, weightKg: weight ? Number(weight) : null, bmi: bmi ? Number(bmi) : null }));
  }

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={result && (
        <div>
          <Answer>{result.headline}</Answer>
          <ul className="mt-4 space-y-3">
            {result.options.map(o => (
              <li key={o.id} className={`rounded-xl border p-3 ${o.available ? 'border-primary bg-white' : 'border-line bg-white/60 opacity-70'}`}>
                <p className="font-semibold">{o.name} <span className="font-normal text-muted-ink">· {o.available ? `about ${Math.floor(o.hoursLeft)} hours left` : `past its ${o.windowHours}-hour window`}</span></p>
                <p className="text-sm text-muted-ink">{o.effectiveness}</p>
                {o.available && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{o.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
              </li>
            ))}
          </ul>
          <Notice tone="caution" title="Good to know">
            <ul className="list-disc space-y-1 pl-5">{result.general.map((g, i) => <li key={i}>{g}</li>)}</ul>
          </Notice>
          <Notice title="Where to get it">A pharmacy, sexual health clinic, GP or family planning service. The copper IUD needs a clinician to fit it.</Notice>
        </div>
      )}
    >
      <SelectField label="How do you want to enter the time?" value={mode} onChange={v => { setMode(v); setResult(null); }}
        options={[{ value: 'hours', label: 'I know how many hours ago' }, { value: 'when', label: 'I know the date and time' }]} />
      {mode === 'hours'
        ? <NumberField label="Hours since sex without a condom (or a condom failure)" value={hours} onChange={setHours} min={0} step={1} unit="hours" hint="24 hours is 1 day. 5 days is 120 hours." />
        : <Field label="Date and time it happened">{id => <input id={id} type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className={inputCls} />}</Field>}
      <div className="grid grid-cols-2 items-end gap-4">
        <NumberField label="Weight (optional)" value={weight} onChange={setWeight} min={20} max={300} step={0.1} unit="kg" />
        <NumberField label="Or BMI (optional)" value={bmi} onChange={setBmi} min={10} max={80} step={0.1} />
      </div>
      <p className="text-xs text-muted-ink">Weight can change which pill works best. Leave both blank if you prefer.</p>
      <Submit>Show my options</Submit>
    </ToolShell>
  );
}
