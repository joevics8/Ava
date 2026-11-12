'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { analyseCycles, parseCycleLengths, type CycleAnalysis } from '@/lib/tools/logic/irregular-cycle';
import { Answer, DateField, Field, Notice, Submit, ToolShell, fmtDate, inputCls } from './ui';

const REG_LABEL = { regular: 'Fairly regular', borderline: 'Borderline irregular', irregular: 'Irregular' } as const;

export default function IrregularCyclePredictor() {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [a, setA] = useState<CycleAnalysis | null>(null);

  function run() {
    setError(''); setA(null);
    const start = parseDate(date);
    if (!start) return setError('Please enter a valid date for the first day of your last period.');
    const parsed = parseCycleLengths(text);
    if (parsed.error) return setError(parsed.error);
    setA(analyseCycles(parsed.values, start));
  }

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={a && (
        <div>
          <Answer>Next period: {fmtDate(a.nextEarliest)} to {fmtDate(a.nextLatest)}</Answer>
          <p className="mt-1 text-sm text-muted-ink">Most likely around {fmtDate(a.nextLikely)} (your average cycle is {a.average} days).</p>
          <ul className="mt-4 space-y-1">
            <li><span className="text-muted-ink">Shortest cycle:</span> <strong>{a.shortest} days</strong></li>
            <li><span className="text-muted-ink">Longest cycle:</span> <strong>{a.longest} days</strong></li>
            <li><span className="text-muted-ink">Difference:</span> <strong>{a.variation} days</strong> ({REG_LABEL[a.regularity]})</li>
            <li>
              <span className="text-muted-ink">Estimated fertile days:</span>{' '}
              <strong>{a.fertileStart && a.fertileEnd ? `${fmtDate(a.fertileStart)} to ${fmtDate(a.fertileEnd)} (cycle days ${a.fertileStartDay} to ${a.fertileEndDay})` : 'cannot be estimated reliably'}</strong>
            </li>
          </ul>
          <Notice tone="caution" title="A rough guide, not contraception">
            {a.fertileStart ? 'This calendar-method estimate gets wider the more your cycles vary' + (a.wideWindow ? ', and yours varies a lot, so the window is long. ' : '. ') : 'Your shortest cycle is too short for the calendar rule to give a useful start day. '}
            Calendar estimates alone are not a reliable way to prevent pregnancy. Ovulation tests or temperature tracking are more precise if you are trying to conceive.
          </Notice>
          {a.clinicNotes.length > 0 && (
            <Notice tone="caution" title="Worth mentioning to a clinician">
              <ul className="list-disc pl-5">{a.clinicNotes.map(n => <li key={n}>{n}</li>)}</ul>
            </Notice>
          )}
        </div>
      )}
    >
      <DateField label="First day of your last period" value={date} onChange={setDate} />
      <Field label="Your last 3 to 12 cycle lengths, in days" hint="Count from the first day of one period to the first day of the next. Example: 28, 31, 27, 35">
        {id => <input id={id} type="text" inputMode="numeric" autoComplete="off" placeholder="28, 31, 27, 35" value={text} onChange={e => setText(e.target.value)} className={inputCls} />}
      </Field>
      <Submit>Predict my next period</Submit>
    </ToolShell>
  );
}
