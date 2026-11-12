'use client';
import { useState } from 'react';
import { scoreQuiz, type Clots, type Colour, type Cramps, type Duration, type Flow, type QuizResult, type RedFlags, type Timing, NO_FLAGS } from '@/lib/tools/logic/implantation';
import { Answer, Notice, SelectField, Submit, ToolShell } from './ui';

const FLAGS: { key: keyof RedFlags; label: string }[] = [
  { key: 'soaking', label: 'Soaking through a pad or more every hour for 2 hours or longer' },
  { key: 'oneSidedPain', label: 'Severe pain, especially on one side of the lower belly' },
  { key: 'faint', label: 'Dizziness, feeling faint, or fainting' },
  { key: 'shoulderTip', label: 'Pain at the tip of the shoulder' },
];

const HEAD: Record<QuizResult['verdict'], string> = {
  implantation: 'Looks more like implantation spotting',
  period: 'Looks more like a period',
  mixed: 'Mixed: it is hard to tell from these answers',
};

export default function ImplantationQuiz() {
  const [timing, setTiming] = useState<Timing>('days-8-to-3');
  const [colour, setColour] = useState<Colour>('pink-brown');
  const [flow, setFlow] = useState<Flow>('spotting');
  const [duration, setDuration] = useState<Duration>('short');
  const [clots, setClots] = useState<Clots>('no');
  const [cramps, setCramps] = useState<Cramps>('none-mild');
  const [flags, setFlags] = useState<RedFlags>(NO_FLAGS);
  const [result, setResult] = useState<QuizResult | null>(null);

  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setResult(null); };

  return (
    <ToolShell
      onSubmit={() => setResult(scoreQuiz({ timing, colour, flow, duration, clots, cramps }, flags))}
      result={result && (
        <div>
          {result.urgent && (
            <Notice tone="urgent" title="Get urgent medical help now">
              Heavy bleeding, severe or one-sided pain, dizziness or shoulder-tip pain can be signs of an ectopic pregnancy or miscarriage. Go to an emergency department or call your local emergency number. Do not wait for a test.
            </Notice>
          )}
          <div className={result.urgent ? 'mt-4' : ''}>
            <Answer>{HEAD[result.verdict]}</Answer>
            <p className="mt-2 text-sm text-muted-ink">
              Points toward implantation: {result.implantationScore}. Points toward a period: {result.periodScore}. This only compares typical patterns, and many people have an overlap.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {result.reasons.map((r, i) => (
                <li key={i}>
                  <span className="font-semibold">{r.side === 'implantation' ? 'Implantation: ' : 'Period: '}</span>{r.text}
                </li>
              ))}
            </ul>
          </div>
          <Notice title="Only a pregnancy test can tell">
            A home test is most reliable from the first day of a missed period. Testing earlier can read negative while hormone levels are still low. If it is negative and your period does not arrive, test again in 3 to 7 days. If you are pregnant and bleeding, see a clinician.
          </Notice>
          <Notice tone="caution" title="See a clinician if">
            Spotting keeps happening between periods, the bleeding is heavier than you expect, or it comes with pain, a bad smell or a fever.
          </Notice>
        </div>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="When did the bleeding start?" value={timing} onChange={reset(setTiming)} options={[
          { value: 'days-8-to-3', label: '3 to 8 days before my period was due' },
          { value: 'days-2-to-0', label: 'Within 2 days of my period being due' },
          { value: 'after-due', label: 'On or after the day my period was due' },
          { value: 'unsure', label: 'I am not sure' },
        ]} />
        <SelectField label="What colour is it?" value={colour} onChange={reset(setColour)} options={[
          { value: 'pink-brown', label: 'Light pink or brown' },
          { value: 'red', label: 'Bright red or dark red' },
        ]} />
        <SelectField label="How much is there?" value={flow} onChange={reset(setFlow)} options={[
          { value: 'spotting', label: 'A few spots, not enough for a pad' },
          { value: 'light', label: 'Light flow, a liner or light pad' },
          { value: 'heavy', label: 'Regular flow, I need a pad or tampon' },
        ]} />
        <SelectField label="How long has it lasted?" value={duration} onChange={reset(setDuration)} options={[
          { value: 'short', label: 'A few hours to about 2 days' },
          { value: 'long', label: '3 days or more (or still going)' },
        ]} />
        <SelectField label="Any clots?" value={clots} onChange={reset(setClots)} options={[
          { value: 'no', label: 'No clots' },
          { value: 'yes', label: 'Yes, there are clots' },
        ]} />
        <SelectField label="Any cramps?" value={cramps} onChange={reset(setCramps)} options={[
          { value: 'none-mild', label: 'None, or mild brief twinges' },
          { value: 'strong', label: 'Moderate to strong period-type cramps' },
        ]} />
      </div>
      <fieldset className="rounded-xl border border-line bg-white p-3">
        <legend className="px-1 text-sm font-semibold">Do you have any of these now?</legend>
        <div className="mt-1 space-y-2">
          {FLAGS.map(f => (
            <label key={f.key} className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4" checked={flags[f.key]} onChange={e => { setFlags({ ...flags, [f.key]: e.target.checked }); setResult(null); }} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Submit>See what it looks like</Submit>
    </ToolShell>
  );
}
