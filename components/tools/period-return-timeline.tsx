'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { periodReturnWindow, SCENARIOS, type ReturnWindow, type Scenario } from '@/lib/tools/logic/period-return';
import { Answer, DateField, Notice, SelectField, Submit, ToolShell, fmtDate } from './ui';

export default function PeriodReturnTimeline() {
  const [scenario, setScenario] = useState<Scenario>('birth-not-breastfeeding');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [w, setW] = useState<ReturnWindow | null>(null);
  const info = SCENARIOS[scenario];

  function run() {
    setError(''); setW(null);
    const event = parseDate(date);
    if (!event) return setError('Please enter a valid date.');
    const r = periodReturnWindow(scenario, event, new Date());
    if (!r) return setError('That date is in the future.');
    setW(r);
  }

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={w && (
        <div>
          <Answer>{w.info.wide ? 'This varies widely.' : `Typically ${fmtDate(w.start)} to ${fmtDate(w.end)}`}</Answer>
          <p className="mt-2">{w.info.summary}</p>
          <ul className="mt-3 space-y-1">
            <li><span className="text-muted-ink">Typical range:</span> <strong>{fmtDate(w.start)} to {fmtDate(w.end)}</strong></li>
            {w.typical && <li><span className="text-muted-ink">On average:</span> <strong>around {fmtDate(w.typical)}</strong></li>}
            {w.askFrom && <li><span className="text-muted-ink">If no period by:</span> <strong>{fmtDate(w.askFrom)}, ask a clinician</strong></li>}
          </ul>
          <p className="mt-3 text-sm text-muted-ink">
            {w.phase === 'before' ? 'You are before the usual range, so no period yet is expected.' : w.phase === 'within' ? 'You are inside the usual range now.' : 'You are past the usual range. This is common to see in some people, but consider asking a clinician.'}
          </p>
          <Notice tone="caution" title="Good to know"><ul className="list-disc space-y-1 pl-5">{w.info.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Notice>
          <Notice title="Pregnancy before the first period">You can ovulate, and become pregnant, before your first period returns. Use contraception if you want to avoid pregnancy, and take a test if you could be pregnant.</Notice>
        </div>
      )}
    >
      <SelectField label="Which situation?" value={scenario} onChange={v => { setScenario(v); setW(null); }}
        options={(Object.keys(SCENARIOS) as Scenario[]).map(k => ({ value: k, label: SCENARIOS[k].label }))} />
      <DateField label={info.dateLabel} value={date} onChange={v => { setDate(v); setW(null); }} />
      <Submit>Estimate when it returns</Submit>
    </ToolShell>
  );
}
