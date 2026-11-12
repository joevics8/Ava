'use client';
import { useState } from 'react';
import { parseDate } from '@/lib/tools/calculators';
import { buildSchedule, PRESETS, type PresetId, type ScheduleRow } from '@/lib/tools/logic/vaccination';
import { todayLocal } from '@/lib/tools/logic/pregnancy-dates';
import { fmtDate, DateField, Notice, SelectField, Submit, ToolShell } from './ui';

const TAG: Record<ScheduleRow['status'], string> = { 'due-now': 'Due now', upcoming: 'Upcoming', past: 'Past' };
const TAG_CLS: Record<ScheduleRow['status'], string> = { 'due-now': 'bg-marigold text-ink', upcoming: 'bg-white text-ink border border-line', past: 'bg-wash text-muted-ink border border-line' };

export default function VaccinationSchedule() {
  const [dob, setDob] = useState(''); const [preset, setPreset] = useState<PresetId>('who');
  const [rows, setRows] = useState<ScheduleRow[] | null>(null); const [err, setErr] = useState('');

  function run() {
    setErr(''); setRows(null);
    const d = parseDate(dob);
    if (!d) return setErr('Enter your child’s date of birth.');
    const r = buildSchedule(preset, d, todayLocal());
    if (!r) return setErr('The date cannot be in the future or more than 16 years ago.');
    setRows(r);
  }
  const p = PRESETS[preset];

  return (
    <ToolShell onSubmit={run} error={err}
      result={rows && (
        <div>
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li key={i} className="rounded-xl border border-line bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{r.vaccine} <span className="font-normal text-muted-ink">({r.dose})</span></p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TAG_CLS[r.status]}`}>{TAG[r.status]}</span>
                </div>
                <p className="text-sm text-muted-ink">{r.protects}</p>
                <p className="mt-1 text-sm">{fmtDate(r.from)} to {fmtDate(r.until)}{r.regional ? ` · ${r.regional}` : ''}</p>
                {r.note && <p className="text-xs text-muted-ink">{r.note}</p>}
              </li>
            ))}
          </ol>
          <Notice title={p.source}>
            {p.footnotes.join(' ')} National schedules differ. Your child’s vaccination card and local clinic decide what is due. If a dose was missed, ask the clinic: most can be given late, and there is usually no need to restart.
          </Notice>
        </div>
      )}
    >
      <DateField label="Child’s date of birth" value={dob} onChange={setDob} />
      <SelectField label="Schedule" value={preset} onChange={v => { setPreset(v); setRows(null); }} options={(Object.keys(PRESETS) as PresetId[]).map(id => ({ value: id, label: PRESETS[id].label }))} />
      <Submit>Show the schedule</Submit>
    </ToolShell>
  );
}
