'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import {
  buildTimeline, colourCheck, NO_FLAGS, validDeliveryDate, warningLevel,
  type Colour, type DeliveryType, type LochiaTimeline, type WarningFlags,
} from '@/lib/tools/logic/lochia';
import { Answer, DateField, Notice, SelectField, Submit, ToolShell, fmtDate } from './ui';

const FLAG_LABELS: { key: keyof WarningFlags; label: string }[] = [
  { key: 'soakingPad', label: 'Soaking a pad every hour' },
  { key: 'bigClots', label: 'Clots bigger than a golf ball' },
  { key: 'foulSmell', label: 'Foul-smelling discharge' },
  { key: 'fever', label: 'Fever, chills or feeling flu-like' },
  { key: 'heavierOrRed', label: 'Bleeding getting heavier, or going back to bright red after easing' },
  { key: 'dizzy', label: 'Dizzy, faint or a racing heartbeat' },
];

function localToday(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

export default function LochiaTimeline() {
  const [delivery, setDelivery] = useState('');
  const [type, setType] = useState<DeliveryType>('vaginal');
  const [colour, setColour] = useState<Colour>('unsure');
  const [flags, setFlags] = useState<WarningFlags>(NO_FLAGS);
  const [error, setError] = useState('');
  const [out, setOut] = useState<{ t: LochiaTimeline; colourNote: string | null } | null>(null);

  function run() {
    setError('');
    setOut(null);
    const d = parseDate(delivery);
    if (!d) return setError('Please enter the date your baby was born.');
    const today = parseDate(localToday()) as Date;
    const v = validDeliveryDate(d, today);
    if (v === 'future') return setError('That date is in the future. Please enter the date your baby was born.');
    if (v === 'too-old') return setError('That was a long time ago. Bleeding after birth has usually finished by about 8 weeks. If you are still bleeding months later, please speak to a doctor.');
    const t = buildTimeline(d, type, today);
    if (!t) return setError('Please check the date.');
    setOut({ t, colourNote: colourCheck(t.day, colour) });
  }
  const level = warningLevel(flags);
  const toggle = (k: keyof WarningFlags) => setFlags(f => ({ ...f, [k]: !f[k] }));

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={out && (
        <div>
          <Answer>{out.t.headline}</Answer>
          <p className="mt-2">{out.t.flowNote}</p>
          {out.colourNote && <Notice tone="caution" title="About the colour you chose">{out.colourNote}</Notice>}
          <h3 className="mt-4 font-semibold">Your dates</h3>
          <ul className="mt-2 space-y-2">
            {out.t.windows.map(w => (
              <li key={w.key} className={`rounded-xl border p-3 ${out.t.stage === w.key ? 'border-primary bg-primary/5' : 'border-line'}`}>
                <p className="font-semibold">{w.name}{out.t.stage === w.key ? ' (now)' : ''}</p>
                <p className="text-sm">{fmtDate(w.start)} to {fmtDate(w.end)} · {w.colour}</p>
                <p className="text-sm text-muted-ink">{w.flow} {w.clots}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">Bleeding usually settles by about 6 weeks ({fmtDate(out.t.typicalEnd)}). Some people have light traces until about 8 weeks ({fmtDate(out.t.longestTypicalEnd)}). Each person is different.</p>
          {out.t.stage === 'beyond' && <Notice tone="caution" title="Still bleeding after 8 weeks?">Bleeding beyond about 8 weeks is worth mentioning to your doctor or midwife, even if it is light.</Notice>}
          {level === 'urgent' && <Notice tone="urgent" title="Get urgent care now">What you have ticked can be a sign of heavy bleeding or infection after birth. Call your midwife, maternity unit or emergency number now, or go to the nearest emergency department. Do not wait to see if it settles.</Notice>}
          {level === 'call' && <Notice tone="caution" title="Call your midwife or doctor today">What you have ticked should be checked soon. Phone your midwife, GP or maternity unit today. If it gets worse or you feel unwell, seek urgent care.</Notice>}
          {level === 'none' && <Notice tone="info" title="Seek help straight away if">You soak a pad every hour, pass clots bigger than a golf ball, have a foul smell, fever, dizziness, or bleeding that gets heavier or turns bright red again.</Notice>}
        </div>
      )}
    >
      <DateField label="Date your baby was born" value={delivery} onChange={setDelivery} />
      <SelectField label="Type of birth" value={type} onChange={setType}
        options={[{ value: 'vaginal', label: 'Vaginal birth' }, { value: 'caesarean', label: 'Caesarean (C-section)' }]} />
      <SelectField label="Colour of the bleeding today (optional)" value={colour} onChange={setColour}
        options={[{ value: 'unsure', label: 'Skip this' }, { value: 'red', label: 'Red (dark or bright)' }, { value: 'brown', label: 'Pink or brown' }, { value: 'yellow', label: 'Yellow or white' }]} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Are you noticing any of these? (optional)</legend>
        {FLAG_LABELS.map(f => (
          <label key={f.key} className="flex min-h-[44px] items-start gap-3 text-base">
            <input type="checkbox" checked={flags[f.key]} onChange={() => toggle(f.key)} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
            <span>{f.label}</span>
          </label>
        ))}
      </fieldset>
      <Submit>Show my bleeding timeline</Submit>
    </ToolShell>
  );
}
