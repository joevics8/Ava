'use client';
import { useState } from 'react';
import { analyseBbt, parseReadings, MAX_DAYS, type BbtResult, type BbtReading, type TempUnit } from '@/lib/tools/logic/bbt';
import { Answer, Field, Notice, SelectField, Submit, ToolShell, inputCls } from './ui';

function Chart({ readings, result }: { readings: BbtReading[]; result: BbtResult }) {
  const pts = readings.filter(r => r.temp !== null) as (BbtReading & { temp: number })[];
  if (pts.length < 2) return null;
  const W = 320, H = 180, L = 36, R = 8, T = 10, B = 24;
  const vals = pts.map(p => p.temp);
  const dp = result.unit === 'C' ? 0.1 : 0.2;
  const lo = Math.floor((Math.min(...vals) - dp) / dp) * dp;
  const hi = Math.ceil((Math.max(...vals) + dp) / dp) * dp;
  const n = readings.length;
  const x = (day: number) => L + ((day - 1) / Math.max(1, n - 1)) * (W - L - R);
  const y = (t: number) => T + (1 - (t - lo) / (hi - lo)) * (H - T - B);
  const sh = result.shift;
  const line = pts.filter(p => !p.disturbed).map(p => `${x(p.day).toFixed(1)},${y(p.temp).toFixed(1)}`).join(' ');
  const ticks = [lo, (lo + hi) / 2, hi];
  const dec = result.unit === 'C' ? 2 : 1;
  const desc = sh
    ? `Temperature chart over ${n} days. A sustained rise starts on day ${sh.firstHighDay}; ovulation was most likely on day ${sh.likelyOvulationDay}.`
    : `Temperature chart over ${n} days. No clear sustained rise was found.`;
  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={desc} className="h-auto w-full rounded-xl border border-line bg-white">
        {ticks.map(t => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity="0.1" />
            <text x={L - 4} y={y(t) + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.6">{t.toFixed(dec)}</text>
          </g>
        ))}
        {sh && <rect x={x(sh.earliestOvulationDay)} y={T} width={Math.max(4, x(sh.latestOvulationDay) - x(sh.earliestOvulationDay))} height={H - T - B} fill="#f59e0b" opacity="0.15" />}
        {sh && <line x1={L} x2={W - R} y1={y(sh.coverline)} y2={y(sh.coverline)} stroke="#b45309" strokeDasharray="4 3" />}
        <polyline points={line} fill="none" stroke="#6d28d9" strokeWidth="1.8" strokeLinejoin="round" />
        {pts.map(p => (
          <circle key={p.day} cx={x(p.day)} cy={y(p.temp)} r={p.disturbed ? 3.5 : 2.8}
            fill={p.disturbed ? 'white' : sh && p.day >= sh.firstHighDay ? '#6d28d9' : '#a78bfa'} stroke="#6d28d9" strokeWidth="1.2" />
        ))}
        {sh && <text x={x(sh.likelyOvulationDay)} y={T + 9} textAnchor="middle" fontSize="9" fill="#b45309" fontWeight="600">likely ovulation</text>}
        {[1, ...Array.from({ length: Math.floor(n / 7) }, (_, i) => (i + 1) * 7)].map(d => (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.6">{d}</text>
        ))}
      </svg>
      <figcaption className="mt-1 text-xs text-muted-ink">
        Day of chart along the bottom. Dashed line: coverline. Shaded band: the days ovulation most likely fell. Hollow dots: readings marked as disturbed (left out).
      </figcaption>
    </figure>
  );
}

export default function BbtOvulationChecker() {
  const [unit, setUnit] = useState<TempUnit>('C');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [out, setOut] = useState<{ result: BbtResult; readings: BbtReading[] } | null>(null);

  function run() {
    const { readings, errors } = parseReadings(text, unit);
    if (errors.length) { setOut(null); return setError(errors.join(' ')); }
    setError('');
    setOut({ result: analyseBbt(readings, unit), readings });
  }
  const r = out?.result;
  const sh = r?.shift;
  const u = unit === 'C' ? '°C' : '°F';

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={r && out && (
        <div>
          {r.status === 'shift' && sh && (
            <>
              <Answer>Likely ovulation around day {sh.likelyOvulationDay}</Answer>
              <p className="mt-2 text-sm">
                Your temperature rose from day {sh.firstHighDay}, staying above your coverline of {sh.coverline}{u} (the rule was met on day {sh.confirmedOnDay}).
                Ovulation most likely happened between day {sh.earliestOvulationDay} and day {sh.latestOvulationDay}. The average rise was about {sh.rise}{u}.
                {sh.highRunEnded ? ` Temperatures stayed higher for ${sh.highDays} days before dropping.` : ` Temperatures have stayed higher for ${sh.highDays} days so far.`}
              </p>
            </>
          )}
          {r.status === 'no-shift' && <Answer>No clear shift found</Answer>}
          {r.status === 'insufficient' && <Answer>Not enough readings yet</Answer>}
          <Chart readings={out.readings} result={r} />
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          <Notice tone="info" title="BBT looks back, it does not predict">
            The rise happens after the egg is released, when your fertile window has mostly passed. It is not a reliable way to prevent pregnancy.
          </Notice>
          {(r.suggestPregnancyTest || r.status !== 'shift') && (
            <Notice tone="caution" title="When to see a doctor">
              {r.suggestPregnancyTest ? 'Do a pregnancy test now. ' : ''}See a doctor if you have no periods for 3 months or more, very irregular cycles, or no shift over several cycles while trying to conceive (after 12 months, or 6 months if you are 35 or over).
            </Notice>
          )}
        </div>
      )}
    >
      <SelectField label="Temperature unit" value={unit} onChange={v => { setUnit(v); setOut(null); }}
        options={[{ value: 'C', label: 'Celsius (°C)' }, { value: 'F', label: 'Fahrenheit (°F)' }]} />
      <Field label={`Morning temperatures, day 1 first (up to ${MAX_DAYS} days)`}
        hint={`One reading per day, in order, starting on the first day of your period. Separate with new lines, spaces or commas and use a full stop for decimals (for example ${unit === 'C' ? '36.45' : '97.7'}). Type - for a missed day. Add * after a reading affected by illness, alcohol or a poor night (for example ${unit === 'C' ? '36.9*' : '98.4*'}).`}>
        {id => (
          <textarea id={id} value={text} onChange={e => { setText(e.target.value); setOut(null); }} rows={8} spellCheck={false}
            placeholder={unit === 'C' ? '36.4\n36.5\n-\n36.45\n36.9*' : '97.5\n97.7\n-\n97.6\n98.4*'}
            className={`${inputCls} h-auto py-2 font-mono`} />
        )}
      </Field>
      <Submit>Check my chart</Submit>
    </ToolShell>
  );
}
