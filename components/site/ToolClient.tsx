'use client';

import { useState } from 'react';
import { Lang } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import type { ToolId } from '@/lib/tools/registry';
import { TOOL_UI } from '@/components/tools';
import {
  addDays, forecastDueDate, forecastOvulation, forecastPeriods, parseDate, validCycleLength, validPeriodLength,
} from '@/lib/tools/calculators';

// Inputs live in component state only: never in the URL, never sent to a
// server, never logged (health data — see CLAUDE.md privacy rules).

function fmt(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

const input = 'h-12 w-full rounded-xl border border-input bg-white px-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export function ToolClient({ toolId, lang }: { toolId: ToolId; lang: Lang }) {
  const Custom = TOOL_UI[toolId];
  if (Custom) return <Custom />;
  return <CycleTool toolId={toolId} lang={lang} />;
}

function CycleTool({ toolId, lang }: { toolId: ToolId; lang: Lang }) {
  const t = ui(lang);
  const [date, setDate] = useState('');
  const [cycle, setCycle] = useState('28');
  const [period, setPeriod] = useState('5');
  const [error, setError] = useState('');
  const [result, setResult] = useState<React.ReactNode>(null);

  function run(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setResult(null);
    const start = parseDate(date);
    if (!start) return setError(t.invalidDate);

    if (toolId === 'due-date-calculator') {
      const d = forecastDueDate(start);
      return setResult(
        <div className="space-y-2">
          <p className="font-display text-3xl font-bold tracking-tight text-primary">{t.dueDate}: {fmt(d.dueDate, lang)}</p>
          {d.trimester && <p>{t.pregnantNow} {d.weeks} {t.weeks} + {d.days}.</p>}
          <p className="text-sm text-muted-ink">{t.secondTri}: {fmt(d.secondTrimesterStart, lang)} · {t.thirdTri}: {fmt(d.thirdTrimesterStart, lang)}</p>
        </div>
      );
    }

    const len = Number(cycle);
    if (!validCycleLength(len)) return setError(t.invalidCycle);

    if (toolId === 'ovulation-calculator') {
      const o = forecastOvulation(start, len);
      return setResult(
        <ul className="space-y-2">
          <li><span className="text-muted-ink">{t.ovulationDay}:</span> <strong>{fmt(o.ovulation, lang)}</strong></li>
          <li><span className="text-muted-ink">{t.fertileWindow}:</span> <strong>{fmt(o.fertileStart, lang)} – {fmt(o.fertileEnd, lang)}</strong></li>
          <li><span className="text-muted-ink">{t.nextPeriods}:</span> <strong>{fmt(addDays(o.nextPeriod, -2), lang)} – {fmt(addDays(o.nextPeriod, 2), lang)}</strong></li>
          <li><span className="text-muted-ink">{t.testFrom}:</span> <strong>{fmt(o.testFrom, lang)}</strong></li>
        </ul>
      );
    }

    const plen = Number(period);
    if (!validPeriodLength(plen)) return setError(t.invalidCycle);
    const rows = forecastPeriods(start, len, plen);
    setResult(
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="rounded-xl border border-line bg-white p-3">
            <p className="font-semibold">{t.mostLikely}: {fmt(r.start, lang)}</p>
            <p className="text-sm text-muted-ink">{t.likelyWindow}: {fmt(r.windowStart, lang)} – {fmt(r.windowEnd, lang)}</p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-wash p-5 sm:p-6">
      <form onSubmit={run} className="space-y-4" noValidate>
        <label className="block text-sm font-semibold">
          {toolId === 'due-date-calculator' ? t.lmp : t.lastPeriod}
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${input} mt-1`} required />
        </label>
        {toolId !== 'due-date-calculator' && (
          <div className="grid grid-cols-2 items-end gap-4">
            <label className="block text-sm font-semibold">
              {t.cycleLength} ({t.days})
              <input type="number" inputMode="numeric" min={21} max={45} value={cycle} onChange={e => setCycle(e.target.value)} className={`${input} mt-1`} />
            </label>
            {toolId === 'period-calculator' && (
              <label className="block text-sm font-semibold">
                {t.periodLength} ({t.days})
                <input type="number" inputMode="numeric" min={2} max={10} value={period} onChange={e => setPeriod(e.target.value)} className={`${input} mt-1`} />
              </label>
            )}
          </div>
        )}
        <button type="submit" className="h-12 w-full rounded-full bg-primary text-base font-semibold text-paper transition-colors hover:bg-deep">{t.calculate}</button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
      {result && <div className="mt-5 border-t border-line pt-4" aria-live="polite">{result}</div>}
      <p className="mt-4 text-sm text-muted-ink">{t.privacyNote}</p>
    </div>
  );
}
