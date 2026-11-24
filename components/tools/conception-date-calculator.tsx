'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { todayLocal } from '@/lib/tools/logic/pregnancy-dates';
import { estimateConception, validateConceptionInput, type ConceptionEstimate, type DatingMethod } from '@/lib/tools/logic/conception-date';
import { Answer, DateField, Notice, NumberField, SelectField, Submit, ToolShell, fmtDate } from './ui';

const METHODS: { value: DatingMethod; label: string }[] = [
  { value: 'due-date', label: 'My due date' },
  { value: 'lmp', label: 'The first day of my last period' },
  { value: 'ultrasound', label: 'An ultrasound scan (weeks and days)' },
];

export default function ConceptionDateCalculator() {
  const [method, setMethod] = useState<DatingMethod>('due-date');
  const [date, setDate] = useState('');
  const [cycle, setCycle] = useState('28');
  const [weeks, setWeeks] = useState('');
  const [days, setDays] = useState('0');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ConceptionEstimate | null>(null);

  function run() {
    setResult(null);
    const parsed = parseDate(date);
    if (!parsed) return setError(method === 'ultrasound' ? 'Please enter the date of your scan.' : 'Please enter a valid date.');
    const input = {
      method, date: parsed,
      cycleLength: method === 'lmp' ? Number(cycle) : undefined,
      weeks: method === 'ultrasound' ? (weeks.trim() === '' ? undefined : Number(weeks)) : undefined,
      days: method === 'ultrasound' ? (days.trim() === '' ? undefined : Number(days)) : undefined,
    };
    if (method === 'lmp' && cycle.trim() === '') return setError('Enter your usual cycle length, or 28 if you are not sure.');
    const problem = validateConceptionInput(input, todayLocal());
    if (problem) return setError(problem);
    setError('');
    setResult(estimateConception(input));
  }
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setResult(null); };

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={result && (
        <div>
          <p className="text-sm text-muted-ink">Most likely conception date</p>
          <Answer>{fmtDate(result.conception)}</Answer>
          <p className="mt-2">Realistic range: {fmtDate(result.likelyStart)} to {fmtDate(result.likelyEnd)} (about {result.marginDays} days either side).</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li><strong>Sex that could have led to this pregnancy:</strong> {fmtDate(result.sexWindowStart)} to {fmtDate(result.sexWindowEnd)}. Sperm can survive up to 5 days, so it may have been days before the egg was fertilised.</li>
            <li><strong>Implantation:</strong> usually {fmtDate(result.implantationStart)} to {fmtDate(result.implantationEnd)}.</li>
            <li><strong>First day of last period (as counted):</strong> {fmtDate(result.lmp)}</li>
            <li><strong>Due date:</strong> {fmtDate(result.dueDate)}</li>
          </ul>
          {result.notes.map((n, i) => <p key={i} className="mt-2 text-sm">{n}</p>)}
          <Notice tone="caution" title="This is an estimate, not proof">
            Doctors date a pregnancy from your last period or a scan, and they assume ovulation on day 14. Real ovulation varies, so only the range is reliable. If dates matter for a legal or personal reason, a conception date cannot settle it. See your midwife or doctor if you have any worries about your pregnancy dates.
          </Notice>
        </div>
      )}
    >
      <SelectField label="Work out my conception date from" value={method} onChange={reset(v => { setMethod(v); setError(''); })} options={METHODS} />
      <DateField
        label={method === 'due-date' ? 'Due date' : method === 'lmp' ? 'First day of your last period' : 'Date of your scan'}
        value={date} onChange={reset(setDate)}
        hint={method === 'due-date' ? 'The due date your doctor, midwife or scan gave you.' : method === 'lmp' ? 'Day 1 is the first day of full bleeding.' : 'The day the scan was done, as printed on the report.'}
      />
      {method === 'lmp' && <NumberField label="Usual cycle length" unit="days" value={cycle} onChange={reset(setCycle)} min={21} max={45} step={1} hint="Day 1 of one period to day 1 of the next. Use 28 if you are not sure." />}
      {method === 'ultrasound' && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Weeks" value={weeks} onChange={reset(setWeeks)} min={4} max={41} step={1} hint="Gestational age on the scan" />
          <NumberField label="Days" value={days} onChange={reset(setDays)} min={0} max={6} step={1} hint="0 to 6" />
        </div>
      )}
      <Submit>Estimate conception date</Submit>
    </ToolShell>
  );
}
