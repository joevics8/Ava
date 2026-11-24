'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { afterPositive, interpretLhPattern, LH_PATTERNS, planLhTesting, type LhPattern, type LhPlanOk } from '@/lib/tools/logic/lh-surge';
import { Answer, DateField, Notice, NumberField, SelectField, Submit, ToolShell, fmtDate } from './ui';

type Mode = 'plan' | 'positive' | 'meaning';

const MODES: { value: Mode; label: string }[] = [
  { value: 'plan', label: 'When should I start testing?' },
  { value: 'positive', label: 'I got a positive test: when will I ovulate?' },
  { value: 'meaning', label: 'What does my result mean?' },
];

export default function LhSurgeOvulationCalculator() {
  const [mode, setMode] = useState<Mode>('plan');
  const [start, setStart] = useState('');
  const [cycle, setCycle] = useState('28');
  const [shortest, setShortest] = useState('');
  const [longest, setLongest] = useState('');
  const [posDate, setPosDate] = useState('');
  const [pattern, setPattern] = useState<LhPattern>('faint');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<LhPlanOk | null>(null);
  const [pos, setPos] = useState<ReturnType<typeof afterPositive> | null>(null);
  const [meaning, setMeaning] = useState<ReturnType<typeof interpretLhPattern> | null>(null);

  function clear() { setPlan(null); setPos(null); setMeaning(null); }

  function run() {
    setError('');
    clear();
    if (mode === 'plan') {
      const c = Number(cycle);
      if (!cycle || !Number.isInteger(c) || c < 21 || c > 45) return setError('Enter a cycle length between 21 and 45 days.');
      let lastStart: Date | null = null;
      if (start) { lastStart = parseDate(start); if (!lastStart) return setError('Enter a valid date for your last period.'); }
      const r = planLhTesting({ lastStart, cycleLength: c, shortest: shortest ? Number(shortest) : null, longest: longest ? Number(longest) : null });
      if (!r.ok) return setError(r.error === 'invalid-cycle' ? 'Enter a cycle length between 21 and 45 days.' : 'Shortest and longest cycles must each be between 21 and 45 days, with the shortest not longer than the longest.');
      setPlan(r);
    } else if (mode === 'positive') {
      const d = parseDate(posDate);
      if (!d) return setError('Enter the date of your positive test.');
      setPos(afterPositive(d));
    } else {
      setMeaning(interpretLhPattern(pattern));
    }
  }
  const upd = <T,>(set: (v: T) => void) => (v: T) => { set(v); clear(); };

  const result = plan ? (
    <div>
      <Answer>Start testing on cycle day {plan.startDay}</Answer>
      {plan.dates && <p className="mt-1 text-lg font-semibold">{fmtDate(plan.dates.start)}</p>}
      <p className="mt-2 text-sm">
        Test once a day (twice if the line is getting darker) until cycle day {plan.stopDay}
        {plan.dates ? `, ${fmtDate(plan.dates.stop)}` : ''}. That is about {plan.testCount} {plan.testCount === 1 ? 'test' : 'tests'}.
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-3">
          <dt className="font-semibold">Ovulation expected around</dt>
          <dd>Cycle day {plan.expectedOvulationDay}{plan.dates ? `, ${fmtDate(plan.dates.ovulation)}` : ''}</dd>
        </div>
        <div className="rounded-xl border border-line bg-white p-3">
          <dt className="font-semibold">Best days to try</dt>
          <dd>Cycle days {plan.bestFromDay} to {plan.bestToDay}{plan.dates ? ` (${fmtDate(plan.dates.bestFrom)} to ${fmtDate(plan.dates.bestTo)})` : ''}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm">A positive test brings the best days forward: the day of the positive and the day after. Once you have a positive you can stop testing this cycle.</p>
      {plan.varied && <Notice title="Your cycles vary">The window starts from your shortest cycle and runs past your longest, so it is wider to catch an early or late surge.</Notice>}
      {plan.longWindow && <Notice title="A long testing window">That is a lot of strips. Testing once a day, at the same time, is enough. If you are unsure when you ovulate, a clinician can help.</Notice>}
      <Notice title="Estimates">The calendar can be a few days out. The test, not the date, tells you when the surge starts.</Notice>
    </div>
  ) : pos ? (
    <div>
      <Answer>Ovulation is most likely on {fmtDate(pos.likely)}</Answer>
      <p className="mt-2 text-sm">Ovulation usually follows the start of the LH surge by about 24 to 36 hours, and sometimes up to 48 hours, so it could fall anywhere from {fmtDate(pos.earliest)} to {fmtDate(pos.latest)}.</p>
      <p className="mt-2 text-sm font-semibold">If you are trying for a pregnancy, the best days are {fmtDate(pos.bestDays[0])} and {fmtDate(pos.bestDays[1])}. Sex every day or every other day around then covers you.</p>
      <Notice title="Not contraception">A positive test only tells you the surge has started. Sperm can survive for several days, so you can get pregnant before and after your positive test. Do not use strips to avoid pregnancy.</Notice>
    </div>
  ) : meaning ? (
    <div>
      <Answer>{meaning.headline}</Answer>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{meaning.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
      {meaning.seeClinician && <Notice tone="caution" title="Worth asking a clinician">Take your cycle dates and test photos with you. Tests for ovulation and hormones are simple and many causes are treatable.</Notice>}
    </div>
  ) : null;

  return (
    <ToolShell onSubmit={run} error={error} result={result}>
      <SelectField label="What do you want to know?" value={mode} onChange={upd(setMode)} options={MODES} />
      {mode === 'plan' && (
        <>
          <NumberField label="Usual cycle length" unit="days" value={cycle} onChange={upd(setCycle)} min={21} max={45} step={1} hint="Day 1 of one period to the day before the next. If it varies, use the average and fill in the boxes below." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField label="Shortest recent cycle (optional)" unit="days" value={shortest} onChange={upd(setShortest)} min={21} max={45} step={1} />
            <NumberField label="Longest recent cycle (optional)" unit="days" value={longest} onChange={upd(setLongest)} min={21} max={45} step={1} />
          </div>
          <DateField label="First day of your last period (optional)" value={start} onChange={upd(setStart)} hint="Adds calendar dates to your plan." />
        </>
      )}
      {mode === 'positive' && <DateField label="Date of your positive test" value={posDate} onChange={upd(setPosDate)} />}
      {mode === 'meaning' && <SelectField label="What did your strips show?" value={pattern} onChange={upd(setPattern)} options={LH_PATTERNS} />}
      <Submit>{mode === 'plan' ? 'Make my testing plan' : mode === 'positive' ? 'When will I ovulate?' : 'What does this mean?'}</Submit>
    </ToolShell>
  );
}
