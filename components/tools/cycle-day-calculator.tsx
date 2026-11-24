'use client';
import { useState } from 'react';
import { parseDate, validCycleLength, validPeriodLength } from '@/lib/tools/calculators';
import { cycleDayInfo, PHASE_LABEL, type CycleDayError, type CycleDayOk } from '@/lib/tools/logic/cycle-day';
import { Answer, DateField, Notice, NumberField, Submit, ToolShell, fmtDate } from './ui';

const ERRORS: Record<CycleDayError, string> = {
  'invalid-cycle': 'Enter a cycle length between 21 and 45 days.',
  'invalid-period': 'Enter a period length between 2 and 10 days.',
  'before-start': 'The date you are checking is before your period started. Check both dates.',
  'too-far': 'That is a long time after your last period started. Enter the first day of your most recent period.',
};

/** Today's calendar date as UTC midnight, from the visitor's local date. */
function today(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

export default function CycleDayCalculator() {
  const [start, setStart] = useState('');
  const [cycle, setCycle] = useState('28');
  const [period, setPeriod] = useState('5');
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  const [res, setRes] = useState<CycleDayOk | null>(null);
  const [isToday, setIsToday] = useState(true);

  function run() {
    setError('');
    setRes(null);
    const lastStart = parseDate(start);
    if (!lastStart) return setError('Enter the first day of your last period.');
    const c = Number(cycle);
    const p = Number(period);
    if (!validCycleLength(c)) return setError(ERRORS['invalid-cycle']);
    if (!validPeriodLength(p)) return setError(ERRORS['invalid-period']);
    let t = today();
    if (target) {
      const parsed = parseDate(target);
      if (!parsed) return setError('Enter a valid date to check.');
      t = parsed;
    }
    const r = cycleDayInfo({ lastStart, cycleLength: c, periodLength: p, target: t });
    if (!r.ok) return setError(ERRORS[r.error]);
    setIsToday(!target);
    setRes(r);
  }
  const reset = (set: (v: string) => void) => (v: string) => { set(v); setRes(null); };

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={res && (
        <div>
          <Answer>{res.status === 'in-cycle' ? `Cycle day ${res.cycleDay}` : res.headline}</Answer>
          {res.status === 'in-cycle' && <p className="mt-1 text-lg font-semibold">{PHASE_LABEL[res.phase]}</p>}
          <p className="mt-2 text-sm">
            {isToday ? 'Today' : 'On that date'} is day {res.cycleDay} of your cycle
            {res.status === 'in-cycle' ? `, day ${res.phaseDay} of this phase (cycle days ${res.phaseStartDay} to ${res.phaseEndDay}).` : '.'}
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-3">
              <dt className="font-semibold">Next period expected</dt>
              <dd>{fmtDate(res.nextPeriod)}{res.status === 'in-cycle' ? ` (${res.daysToNextPeriod} ${res.daysToNextPeriod === 1 ? 'day' : 'days'} from ${isToday ? 'today' : 'that date'})` : ''}</dd>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <dt className="font-semibold">Estimated ovulation</dt>
              <dd>{fmtDate(res.ovulationDate)} (cycle day {res.ovulationDay})</dd>
            </div>
          </dl>
          <h3 className="mt-4 font-semibold">What to expect in this phase</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{res.expect.map((e, i) => <li key={i}>{e}</li>)}</ul>
          {res.status !== 'in-cycle' && (
            <Notice tone="caution" title="Period late?">
              A period a few days late is common after stress, illness, travel or a change in routine. If you could be pregnant, a test from the first day of a missed period is reliable. If your period is more than a week late and you are not pregnant, or this keeps happening, ask a clinician. Once your period starts, enter the new first day to restart the count.
            </Notice>
          )}
          <Notice title="Estimates only">
            Phases are worked out from your usual cycle length, so they can be a few days out, especially if your cycles vary. This is not a contraception method. Heavy bleeding, severe pain, periods closer than 21 days or further apart than 35 days, or bleeding between periods are worth discussing with a clinician.
          </Notice>
        </div>
      )}
    >
      <DateField label="First day of your last period" value={start} onChange={reset(setStart)} hint="Day 1 is the first day of full bleeding, not light spotting." />
      <NumberField label="Usual cycle length" unit="days" value={cycle} onChange={reset(setCycle)} min={21} max={45} step={1} hint="From day 1 of one period to the day before the next. Most cycles are 21 to 35 days; 28 is the average." />
      <NumberField label="Usual period length" unit="days" value={period} onChange={reset(setPeriod)} min={2} max={10} step={1} />
      <DateField label="Date to check (optional)" value={target} onChange={reset(setTarget)} hint="Leave blank for today." />
      <Submit>Find my cycle day</Submit>
    </ToolShell>
  );
}
