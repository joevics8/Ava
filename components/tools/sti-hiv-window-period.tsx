'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { assessWindow, HIV_TESTS, type HivTest, type Infection, type WindowResult } from '@/lib/tools/logic/sti-window';
import { Answer, DateField, Notice, SelectField, Submit, ToolShell, fmtDate } from './ui';

const INFECTIONS: { value: Infection; label: string }[] = [
  { value: 'hiv', label: 'HIV' }, { value: 'chlamydia', label: 'Chlamydia' }, { value: 'gonorrhoea', label: 'Gonorrhoea' }, { value: 'syphilis', label: 'Syphilis' },
];

export default function StiHivWindowPeriod() {
  const [infection, setInfection] = useState<Infection>('hiv');
  const [hivTest, setHivTest] = useState<HivTest>('lab-ag-ab');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<WindowResult | null>(null);

  function run() {
    setError(''); setResult(null);
    const exposure = parseDate(date);
    if (!exposure) return setError('Please enter a valid date.');
    const r = assessWindow({ exposure, infection, hivTest, today: new Date() });
    if (r.status === 'invalid') return setError('That date is in the future.');
    setResult(r);
  }
  const headline = (r: WindowResult) => r.status === 'conclusive' ? 'A test now gives a conclusive result.'
    : r.status === 'testable' ? 'A test now can detect it, but repeat it later to be sure.'
    : r.earliest ? `Too early for a reliable test. Earliest: ${fmtDate(r.earliest)}.` : `Wait until ${fmtDate(r.conclusive)} for a conclusive result.`;

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={result && (
        <div>
          {result.pepUrgent && (
            <Notice tone="urgent" title="Do not wait: ask about HIV prevention medicine (PEP)">
              PEP can prevent HIV if started within 72 hours of exposure, and the sooner the better. Go to an emergency department or sexual health clinic now. Testing dates below do not apply to this decision.
            </Notice>
          )}
          <p className="mt-3 text-sm text-muted-ink">{result.label}</p>
          <Answer>{headline(result)}</Answer>
          <ul className="mt-3 space-y-1">
            {result.earliest && result.earliestDays !== result.conclusiveDays && <li><span className="text-muted-ink">Earliest reliable test:</span> <strong>{fmtDate(result.earliest)}</strong> (day {result.earliestDays})</li>}
            <li><span className="text-muted-ink">Conclusive from:</span> <strong>{fmtDate(result.conclusive)}</strong> (day {result.conclusiveDays})</li>
            <li><span className="text-muted-ink">Days since exposure:</span> <strong>{result.daysSince}</strong></li>
          </ul>
          <Notice title="Remember"><ul className="list-disc space-y-1 pl-5">{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Notice>
        </div>
      )}
    >
      <SelectField label="Which infection?" value={infection} onChange={v => { setInfection(v); setResult(null); }} options={INFECTIONS} />
      {infection === 'hiv' && (
        <SelectField label="Which kind of HIV test?" value={hivTest} onChange={v => { setHivTest(v); setResult(null); }}
          options={(Object.keys(HIV_TESTS) as HivTest[]).map(k => ({ value: k, label: HIV_TESTS[k].label }))}
          hint="Not sure? Ask the clinic. Most clinic blood tests are antigen/antibody tests." />
      )}
      <DateField label="Date of the possible exposure" value={date} onChange={v => { setDate(v); setResult(null); }} hint="If there was more than one, use the most recent." />
      <Submit>Find my testing dates</Submit>
    </ToolShell>
  );
}
