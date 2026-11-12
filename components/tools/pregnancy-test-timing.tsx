'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { timingFromPeriod, timingFromSex, MAX_CYCLE, MIN_CYCLE, type TestTiming } from '@/lib/tools/logic/pregnancy-test-timing';
import { todayLocal } from '@/lib/tools/logic/pregnancy-dates';
import { fmtDate, Answer, DateField, NumberField, Notice, SelectField, Submit, ToolShell } from './ui';

export default function PregnancyTestTiming() {
  const [mode, setMode] = useState<'sex' | 'period'>('sex');
  const [date, setDate] = useState(''); const [cycle, setCycle] = useState('28');
  const [res, setRes] = useState<TestTiming | null>(null); const [err, setErr] = useState('');

  function run() {
    setErr(''); setRes(null);
    const d = parseDate(date);
    if (!d) return setErr(mode === 'sex' ? 'Enter the date of unprotected sex.' : 'Enter the first day of your last period.');
    const t = todayLocal();
    const r = mode === 'sex' ? timingFromSex(d, t) : timingFromPeriod(d, Number(cycle), t);
    if (!r) return setErr(mode === 'sex' ? 'The date cannot be in the future.' : `Enter a past date and a cycle of ${MIN_CYCLE} to ${MAX_CYCLE} days.`);
    setRes(r);
  }

  return (
    <ToolShell onSubmit={run} error={err}
      result={res && (
        <div>
          <Answer>{res.today === 'reliable' ? 'You can take a test now and trust a negative' : res.today === 'early' ? `A negative result is not reliable until ${fmtDate(res.reliable)}` : `Too early to test: wait until ${fmtDate(res.earliest)}`}</Answer>
          <ul className="mt-3 space-y-1">
            <li><span className="text-muted-ink">Earliest a very sensitive test might show positive:</span> <strong>{fmtDate(res.earliest)}</strong></li>
            <li><span className="text-muted-ink">A negative result is reliable from:</span> <strong>{fmtDate(res.reliable)}</strong></li>
            {res.expectedPeriod && <li><span className="text-muted-ink">Period expected around:</span> <strong>{fmtDate(res.expectedPeriod)}</strong></li>}
            <li><span className="text-muted-ink">If negative but no period, retest between:</span> <strong>{fmtDate(res.retestFrom)} and {fmtDate(res.retestTo)}</strong></li>
          </ul>
          <Notice title="Tips">Use first-morning urine, follow the instructions on the box, and read the result in the stated time. A positive result is almost always right. See a clinician to confirm and for pregnancy care. Seek urgent help for severe one-sided pain, heavy bleeding or fainting.</Notice>
        </div>
      )}
    >
      <SelectField label="Work it out from" value={mode} onChange={v => { setMode(v); setRes(null); setDate(''); }} options={[{ value: 'sex', label: 'Date of unprotected sex' }, { value: 'period', label: 'First day of my last period' }]} />
      <DateField label={mode === 'sex' ? 'Date of unprotected sex' : 'First day of last period'} value={date} onChange={setDate} />
      {mode === 'period' && <NumberField label="Cycle length" unit="days" value={cycle} onChange={setCycle} min={MIN_CYCLE} max={MAX_CYCLE} step={1} hint="If your cycles vary, use your longest recent cycle." />}
      <Submit>When can I test?</Submit>
    </ToolShell>
  );
}
