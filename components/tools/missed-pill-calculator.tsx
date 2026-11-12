'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { adviseMissedPill, POP_WINDOW_HOURS, type Lateness, type MissedPillAdvice, type PackWeek, type PillType } from '@/lib/tools/logic/missed-pill';
import { Answer, DateField, Notice, SelectField, Submit, ToolShell, fmtDate } from './ui';

const PILLS: { value: PillType; label: string }[] = [
  { value: 'combined', label: 'Combined pill (oestrogen and progestogen)' },
  { value: 'pop-3h', label: 'Progestogen-only pill, traditional (3-hour window)' },
  { value: 'pop-12h', label: 'Progestogen-only pill, desogestrel (12-hour window)' },
  { value: 'pop-24h', label: 'Progestogen-only pill, drospirenone (24-hour window)' },
];

export default function MissedPillCalculator() {
  const [pill, setPill] = useState<PillType>('combined');
  const [lateness, setLateness] = useState<Lateness>('one-missed');
  const [week, setWeek] = useState<'1' | '2' | '3'>('1');
  const [packDays, setPackDays] = useState<'21' | '28'>('28');
  const [sex, setSex] = useState<'no' | 'yes'>('no');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<MissedPillAdvice | null>(null);

  const combined = pill === 'combined';
  const hours = combined ? 24 : POP_WINDOW_HOURS[pill as Exclude<PillType, 'combined'>];
  const latenessOptions: { value: Lateness; label: string }[] = combined
    ? [
        { value: 'within-window', label: 'Less than 24 hours late' },
        { value: 'one-missed', label: 'One pill missed (24 to 48 hours late)' },
        { value: 'two-plus-missed', label: 'Two or more pills missed (48 hours or more late)' },
      ]
    : [
        { value: 'within-window', label: `Less than ${hours} hours late` },
        { value: 'one-missed', label: `More than ${hours} hours late, or one or more pills missed` },
      ];
  const effLateness: Lateness = !combined && lateness === 'two-plus-missed' ? 'one-missed' : lateness;

  function run() {
    setError('');
    let takeDate: Date | null = null;
    if (date) { takeDate = parseDate(date); if (!takeDate) { setAdvice(null); return setError('Please enter a valid date.'); } }
    setAdvice(adviseMissedPill({
      pill, lateness: effLateness, week: Number(week) as PackWeek, packDays: Number(packDays) as 21 | 28,
      unprotectedSex: sex === 'yes', takeDate,
    }));
  }
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setAdvice(null); };

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={advice && (
        <div>
          <Answer>{advice.headline}</Answer>
          <ol className="mt-3 list-decimal space-y-2 pl-5">{advice.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          {advice.protectedFrom && <p className="mt-3 font-semibold">You can rely on your pill again from {fmtDate(advice.protectedFrom)}.</p>}
          <Notice tone={advice.emergency === 'ask' ? 'urgent' : 'info'} title={advice.emergency === 'ask' ? 'Ask about emergency contraception' : 'Emergency contraception'}>{advice.emergencyText}</Notice>
          {advice.pregnancyTestNote && <p className="mt-3 text-sm">{advice.pregnancyTestNote}</p>}
          <Notice tone="caution" title="If you are unsure">Use condoms and ask a pharmacist or clinician. Severe vomiting or diarrhoea, and some medicines, can also make pills less reliable.</Notice>
        </div>
      )}
    >
      <SelectField label="Which pill do you take?" value={pill} onChange={reset(v => { setPill(v); setLateness('one-missed'); })} options={PILLS} />
      <SelectField label="How late or how many missed?" value={effLateness} onChange={reset(setLateness)} options={latenessOptions}
        hint={combined ? 'A pill counts as missed when it is more than 24 hours late, which means 48 hours or more since your last pill.' : undefined} />
      {combined && effLateness === 'two-plus-missed' && (
        <>
          <SelectField label="Which week of the pack were the missed pills in?" value={week} onChange={reset(setWeek)}
            options={[{ value: '1', label: 'Week 1 (pills 1 to 7, including the first pill after the break)' }, { value: '2', label: 'Week 2 (pills 8 to 14)' }, { value: '3', label: 'Week 3 (pills 15 to 21)' }]} />
          {week === '3' && <SelectField label="Pack size" value={packDays} onChange={reset(setPackDays)} options={[{ value: '28', label: '28-day pack (with inactive pills)' }, { value: '21', label: '21-day pack (7-day break)' }]} />}
        </>
      )}
      {effLateness !== 'within-window' && (
        <>
          <SelectField label={combined ? 'Sex without a condom in the pill-free break or the last 5 days?' : 'Sex without a condom since the missed pill?'} value={sex} onChange={reset(setSex)}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
          <DateField label="Date you take the missed pill (optional)" value={date} onChange={reset(setDate)} hint="Today if you are taking it now. Used to show when you are protected again." />
        </>
      )}
      <Submit>Show what to do</Submit>
    </ToolShell>
  );
}
