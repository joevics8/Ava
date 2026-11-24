'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { todayLocal } from '@/lib/tools/logic/pregnancy-dates';
import { FAILURE_FIGURES, analyseSafePeriod, parseCycleLengths, validateSafePeriodInput, type SafePeriodResult } from '@/lib/tools/logic/safe-period';
import { Answer, DateField, Field, Notice, Submit, ToolShell, fmtDate, inputCls } from './ui';

const SUIT: Record<SafePeriodResult['suitability'], { tone: 'urgent' | 'caution' | 'info'; title: string; text: string }> = {
  'not-suitable': { tone: 'urgent', title: 'The calendar method is not suitable for your cycles', text: 'Your cycle history is too irregular or too far outside the usual range for the calendar method to work. The days below could be wrong, so please use a reliable method such as condoms and talk to a clinician about contraception.' },
  caution: { tone: 'caution', title: 'Use extra caution', text: 'Your history is limited or has one cycle outside the usual range, so these days are less trustworthy. Use condoms or another method on every day, not just the fertile days.' },
  possible: { tone: 'info', title: 'Your cycles are regular enough for the method to be used', text: 'That does not make it safe. Even regular cycles can change in any month, and the typical-use failure rate is still high.' },
};

export default function SafePeriodCalculator() {
  const [text, setText] = useState('');
  const [last, setLast] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<SafePeriodResult | null>(null);

  function run() {
    setResult(null);
    const parsed = parseCycleLengths(text);
    if (!parsed.ok) return setError(parsed.error);
    const start = parseDate(last);
    if (!start) return setError('Please enter the first day of your most recent period.');
    const input = { cycleLengths: parsed.values, lastPeriodStart: start };
    const today = todayLocal();
    const problem = validateSafePeriodInput(input, today);
    if (problem) return setError(problem);
    setError('');
    setResult(analyseSafePeriod(input, today));
  }

  const s = result ? SUIT[result.suitability] : null;

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={result && s && (
        <div>
          <Notice tone="urgent" title="The calendar method is not reliable contraception">
            About {FAILURE_FIGURES.nhsFertilityAwareness} in 100 women using fertility awareness get pregnant in a year with typical use (NHS), and the CDC gives about {FAILURE_FIGURES.cdcStandardDays} in 100 for the Standard Days Method. Condoms, the pill, implants and IUDs work far better. Condoms also protect against infections.
          </Notice>
          <p className="mt-4 text-sm text-muted-ink">Cycle days to avoid unprotected sex (day 1 is the first day of your period)</p>
          <Answer>Days {result.firstFertileDay} to {result.lastFertileDay}</Answer>
          <p className="mt-2 text-sm">Based on {result.count} cycles from {result.shortest} to {result.longest} days (average {result.average}).</p>
          <Notice tone={s.tone} title={s.title}>{s.text}</Notice>
          {result.warnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
          <p className="mt-4 font-semibold">Dates</p>
          <ul className="mt-1 space-y-2 text-sm">
            {result.windows.map(w => (
              <li key={w.cycleIndex}>
                <strong>{fmtDate(w.fertileFrom)} to {fmtDate(w.fertileTo)}</strong>
                {w.cycleIndex === 0 ? ' (current cycle)' : ` (cycle ${w.cycleIndex + 1} from now, wider because the start date is less certain)`}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">The days outside this window are not &quot;safe&quot;. They are only less likely to lead to pregnancy. Stress, illness, travel, breastfeeding and coming off hormonal contraception can all move ovulation.</p>
          <Notice tone="caution" title="If you had unprotected sex and do not want to be pregnant">
            Emergency contraception works best the sooner you take it: a pharmacist or clinic can help, and a copper IUD works for up to 5 days. A late or unusually light period means it is worth taking a pregnancy test.
          </Notice>
        </div>
      )}
    >
      <Field label="Your last few cycle lengths, in days" hint="Count from day 1 of one period to day 1 of the next. Use at least 3, ideally 6 to 12, separated by commas. Example: 28, 30, 27, 29, 28, 31">
        {id => <input id={id} type="text" inputMode="numeric" autoComplete="off" value={text} onChange={e => { setText(e.target.value); setResult(null); }} placeholder="28, 30, 27, 29, 28, 31" className={inputCls} />}
      </Field>
      <DateField label="First day of your most recent period" value={last} onChange={v => { setLast(v); setResult(null); }} />
      <Submit>Show fertile days</Submit>
    </ToolShell>
  );
}
