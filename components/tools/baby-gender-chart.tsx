'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { buildChart, checkDates, conceptionFromLmp, lunarSupported, type GenderChart } from '@/lib/tools/logic/gender-chart';
import { Answer, DateField, Notice, SelectField, Submit, ToolShell, fmtDate } from './ui';

function localToday(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

type Mode = 'conception' | 'lmp';

export default function BabyGenderChart() {
  const [birth, setBirth] = useState('');
  const [mode, setMode] = useState<Mode>('conception');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [out, setOut] = useState<GenderChart | null>(null);

  function run() {
    setError('');
    setOut(null);
    if (!lunarSupported()) return setError('This browser cannot work out Chinese calendar dates. Please try an up-to-date Chrome, Safari, Edge or Firefox.');
    const b = parseDate(birth);
    if (!b) return setError('Please enter your date of birth.');
    const entered = parseDate(date);
    if (!entered) return setError(mode === 'conception' ? 'Please enter the date you conceived.' : 'Please enter the first day of your last period.');
    const conception = mode === 'lmp' ? conceptionFromLmp(entered) : entered;
    const check = checkDates(b, conception, parseDate(localToday()) as Date);
    if (check === 'birth-in-future') return setError('Your date of birth is in the future. Please check it.');
    if (check === 'too-young' || check === 'too-old') return setError('Please check your date of birth and the conception date: they give an age outside the usual range for this chart.');
    if (check === 'conception-too-far') return setError('That date is more than two years away. Please pick a nearer date.');
    const chart = buildChart(b, conception);
    if (!chart) return setError('Something went wrong working out the dates. Please check them and try again.');
    setOut(chart);
  }

  const emoji = (g: 'boy' | 'girl') => (g === 'boy' ? '💙' : '💗');

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={out && (
        <div>
          <Answer>The chart says: {out.guess === 'boy' ? 'a boy' : 'a girl'} {emoji(out.guess)}</Answer>
          <p className="mt-2">
            Your lunar age at conception is <strong>{out.age}</strong> and the lunar month is <strong>{out.lunar.month}{out.leapNote ? ' (a leap month)' : ''}</strong>.
            {' '}{out.age} + {out.lunar.month} = {out.sum}, which is {out.sum % 2 === 0 ? 'even, so the chart points to a girl' : 'odd, so the chart points to a boy'}.
          </p>
          <Notice tone="info" title="For fun only">
            The Chinese gender chart is folklore. Checked against real births it is right about half the time, the same as a coin toss. Only a blood screening test (from about 10 weeks) or a scan at 18 to 22 weeks can show your baby&apos;s sex.
          </Notice>
          {out.leapNote && <Notice tone="caution" title="Leap month">Your conception date falls in a leap month. Charts treat these differently, so this answer is even less settled than usual.</Notice>}
          <h3 className="mt-4 font-semibold">The next 12 lunar months</h3>
          <ul className="mt-2 space-y-2">
            {out.rows.map(r => (
              <li key={r.start.toISOString()} className={`rounded-xl border p-3 ${r.current ? 'border-primary bg-primary/5' : 'border-line'}`}>
                <p className="font-semibold">{fmtDate(r.start)} to {fmtDate(r.end)}{r.current ? ' (your date)' : ''}</p>
                <p className="text-sm">Lunar month {r.month}{r.leap ? ' (leap)' : ''} · lunar age {r.age} · {r.guess === 'boy' ? 'boy' : 'girl'} {emoji(r.guess)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    >
      <DateField label="Your date of birth" value={birth} onChange={setBirth} />
      <SelectField label="I know" value={mode} onChange={setMode}
        options={[{ value: 'conception', label: 'The date I conceived' }, { value: 'lmp', label: 'The first day of my last period' }]} />
      <DateField label={mode === 'conception' ? 'Conception date' : 'First day of last period'} value={date} onChange={setDate}
        hint={mode === 'lmp' ? 'We add 14 days to estimate when you conceived.' : undefined} />
      <Submit>Show the chart</Submit>
    </ToolShell>
  );
}
