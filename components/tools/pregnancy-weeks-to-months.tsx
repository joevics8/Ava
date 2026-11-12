'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { fromLmp, fromWeeksDays, type MonthsResult } from '@/lib/tools/logic/pregnancy-months';
import { todayLocal } from '@/lib/tools/logic/pregnancy-dates';
import { Answer, DateField, NumberField, Notice, SelectField, Submit, ToolShell } from './ui';

export default function PregnancyWeeksToMonths() {
  const [mode, setMode] = useState<'weeks' | 'lmp'>('weeks');
  const [weeks, setWeeks] = useState('20'); const [days, setDays] = useState('0'); const [lmp, setLmp] = useState('');
  const [res, setRes] = useState<MonthsResult | null>(null); const [err, setErr] = useState('');

  function run() {
    setErr(''); setRes(null);
    const r = mode === 'weeks' ? fromWeeksDays(Number(weeks), Number(days)) : (() => { const d = parseDate(lmp); return d ? fromLmp(d, todayLocal()) : null; })();
    if (!r) return setErr(mode === 'weeks' ? 'Enter weeks from 0 to 42 and days from 0 to 6.' : 'Enter the first day of your last period (a past date within the last 42 weeks).');
    setRes(r);
  }

  return (
    <ToolShell onSubmit={run} error={err}
      result={res && (
        <div>
          <Answer>{res.weeks} weeks {res.days ? `${res.days} days ` : ''}is about {res.completedMonths} month{res.completedMonths === 1 ? '' : 's'}{res.extraWeeks ? ` and ${res.extraWeeks} week${res.extraWeeks === 1 ? '' : 's'}` : ''}</Answer>
          <ul className="mt-3 space-y-1">
            <li><span className="text-muted-ink">You are in month</span> <strong>{res.currentMonth}</strong> <span className="text-muted-ink">of 9</span></li>
            <li><span className="text-muted-ink">Trimester:</span> <strong>{res.trimester}</strong></li>
            <li><span className="text-muted-ink">Time left to 40 weeks:</span> <strong>{res.pastDue ? 'You have reached 40 weeks' : `${res.weeksLeft} weeks ${res.daysLeft} days`}</strong></li>
          </ul>
          {res.veryLate && <Notice tone="caution" title="42 weeks or more">Talk to your midwife or doctor about your care now.</Notice>}
        </div>
      )}
    >
      <SelectField label="I know" value={mode} onChange={v => { setMode(v); setRes(null); }} options={[{ value: 'weeks', label: 'How many weeks pregnant I am' }, { value: 'lmp', label: 'The first day of my last period' }]} />
      {mode === 'weeks' ? (
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Weeks" value={weeks} onChange={setWeeks} min={0} max={42} step={1} />
          <NumberField label="Days" value={days} onChange={setDays} min={0} max={6} step={1} />
        </div>
      ) : <DateField label="First day of your last period" value={lmp} onChange={setLmp} />}
      <Submit>Convert to months</Submit>
    </ToolShell>
  );
}
