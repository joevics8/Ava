'use client';
import { useState } from 'react';
import {
  discardBy, fmtDateTime, formatDuration, HANDLING_RULES, hoursLeft, parseDateTime, PLACE_LABELS, STATE_LABELS, TIME_LABELS,
  type DiscardResult, type MilkPlace, type MilkState,
} from '@/lib/tools/logic/milk-storage';
import { Answer, Field, Notice, SelectField, Submit, ToolShell, inputCls } from './ui';

const STATES = (Object.keys(STATE_LABELS) as MilkState[]).map(v => ({ value: v, label: STATE_LABELS[v] }));
const PLACES = (Object.keys(PLACE_LABELS) as MilkPlace[]).map(v => ({ value: v, label: PLACE_LABELS[v] }));

function nowLocal(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`;
}

export default function BreastMilkStorageGuide() {
  const [state, setState] = useState<MilkState>('fresh');
  const [place, setPlace] = useState<MilkPlace>('fridge');
  const [hot, setHot] = useState(false);
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [res, setRes] = useState<{ r: DiscardResult; left: number | null } | null>(null);

  function run() {
    setError('');
    setRes(null);
    let start = null as Date | null;
    if (time) {
      start = parseDateTime(time);
      if (!start) return setError('Please enter a valid date and time.');
      const now = parseDateTime(nowLocal()) as Date;
      if (start.getTime() > now.getTime() + 60 * 1000) return setError('That time is in the future. Please enter when the milk was expressed, thawed, warmed or last fed.');
    }
    const r = discardBy(state, place, start ?? new Date(0), hot);
    const left = r.discardBy && start ? hoursLeft(r.discardBy, parseDateTime(nowLocal()) as Date) : null;
    setRes({ r: start ? r : { ...r, discardBy: null }, left });
  }
  const clear = <T,>(set: (v: T) => void) => (v: T) => { set(v); setRes(null); };
  const showHot = place === 'room' && state === 'fresh';

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={res && (
        <div>
          {res.r.rule.allowed ? (
            <>
              <Answer>Safe for up to {formatDuration(res.r.rule)}.</Answer>
              <p className="mt-2">Counted from the {res.r.rule.from}. {res.r.rule.range}.</p>
              {res.r.discardBy && <p className="mt-3 text-lg font-semibold">Use or discard by {fmtDateTime(res.r.discardBy)}</p>}
              {res.left !== null && res.left <= 0 && <Notice tone="urgent" title="Past the safe time">This milk is past the time limit. Please discard it.</Notice>}
              {res.left !== null && res.left > 0 && res.left < 1 && <Notice tone="caution" title="Almost out of time">Less than an hour left. Use it soon.</Notice>}
            </>
          ) : (
            <>
              <Answer>Do not store this milk this way.</Answer>
              <p className="mt-2">{res.r.rule.note}</p>
            </>
          )}
          {res.r.rule.note && res.r.rule.allowed && <p className="mt-3 text-sm">{res.r.rule.note}</p>}
          <p className="mt-3 text-sm text-muted-ink">We use the most cautious figure from CDC, NHS, La Leche League and the Academy of Breastfeeding Medicine. Guidance varies slightly between them.</p>
          <Notice tone="info" title="Thawing, warming and refreezing">
            <ul className="list-disc space-y-1 pl-5">{HANDLING_RULES.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </Notice>
          <Notice tone="caution" title="Hot weather and power cuts">
            Above about 25C, milk spoils faster, so refrigerate or cool it sooner. If the power goes off, keep the fridge and freezer doors shut: a full freezer keeps milk frozen for about 48 hours (24 if half full) and a fridge for about 4 hours. For longer, use a cooler with frozen ice packs. If you are unsure whether milk is safe, throw it away. If your baby is unwell after a feed, with vomiting, diarrhoea or a fever, see a doctor.
          </Notice>
        </div>
      )}
    >
      <SelectField label="State of the milk" value={state} onChange={clear(setState)} options={STATES} />
      <SelectField label="Where is it stored?" value={place} onChange={clear(setPlace)} options={PLACES} />
      {showHot && (
        <SelectField label="Is the room hotter than 25C?" value={hot ? 'yes' : 'no'} onChange={v => { setHot(v === 'yes'); setRes(null); }}
          options={[{ value: 'no', label: 'No, 25C or cooler' }, { value: 'yes', label: 'Yes, warm or hot room' }]}
          hint="Common in warm climates, or when there is no air conditioning." />
      )}
      <Field label={`${TIME_LABELS[state]} (optional)`} hint="Add it to get a discard-by time.">
        {id => <input id={id} type="datetime-local" value={time} onChange={e => { setTime(e.target.value); setRes(null); }} className={inputCls} />}
      </Field>
      <Submit>Show how long it is safe</Submit>
    </ToolShell>
  );
}
