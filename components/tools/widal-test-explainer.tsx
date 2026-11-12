'use client';
import { useState } from 'react';
import { TITRES, interpretWidal, parseFeverDays, titreLabel, type WidalResult } from '@/lib/tools/logic/widal';
import { Answer, Field, Notice, SelectField, Submit, ToolShell, inputCls } from './ui';

const options = TITRES.map(t => ({ value: String(t), label: titreLabel(t) }));

export default function WidalTestExplainer() {
  const [o, setO] = useState('20');
  const [h, setH] = useState('20');
  const [fever, setFever] = useState('');
  const [error, setError] = useState('');
  const [r, setR] = useState<WidalResult | null>(null);

  function run() {
    setError(''); setR(null);
    const days = parseFeverDays(fever);
    if (days.error) return setError(days.error);
    setR(interpretWidal(Number(o), Number(h), days.value));
  }

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={r && (
        <div>
          <Answer>{r.headline}</Answer>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{r.points.map(p => <li key={p}>{p}</li>)}</ul>
          <Notice tone="caution" title="Do not treat yourself because of this number">
            Taking leftover or shop-bought antibiotics without a clinician can hide the illness, make the culture test unreliable and add to antibiotic resistance, which is a serious problem with typhoid.
          </Notice>
          {(r.longFever || r.band === 'raised') && (
            <Notice tone="caution" title="See a clinician soon">
              A fever lasting more than 3 days, or a raised result, should be reviewed in person. Ask whether a blood culture is needed.
            </Notice>
          )}
          <Notice tone="urgent" title="Get urgent care if you have">
            Severe tummy pain, confusion or unusual drowsiness, repeated vomiting or being unable to keep fluids down, signs of dehydration (very dry mouth, little or no urine, dizziness), or blood in your stool or black stools.
          </Notice>
        </div>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="O titre (TO)" value={o} onChange={v => { setO(v); setR(null); }} options={options} />
        <SelectField label="H titre (TH)" value={h} onChange={v => { setH(v); setR(null); }} options={options} />
      </div>
      <Field label="Days of fever so far (optional)" hint="Leave blank if you do not have a fever or are not sure.">
        {id => <input id={id} type="text" inputMode="numeric" autoComplete="off" value={fever} onChange={e => { setFever(e.target.value); setR(null); }} className={inputCls} />}
      </Field>
      <Submit>Explain my result</Submit>
    </ToolShell>
  );
}
