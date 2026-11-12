'use client';
import { useState } from 'react';
import { TESTS, assessLab, type Category, type LabResult, type Pregnancy, type Sex, type TestId, type Unit } from '@/lib/tools/logic/lab-ranges';
import { Answer, NumberField, Notice, SelectField, Submit, ToolShell } from './ui';

const TONE: Record<Category, 'info' | 'caution' | 'urgent'> = { normal: 'info', info: 'info', attention: 'caution', concern: 'caution', urgent: 'urgent' };

export default function LabReferenceRanges() {
  const [test, setTest] = useState<TestId>('hb');
  const [unit, setUnit] = useState<Unit>('g/dL');
  const [value, setValue] = useState('');
  const [sex, setSex] = useState<Sex>('female');
  const [pregnancy, setPregnancy] = useState<Pregnancy>('no');
  const [error, setError] = useState('');
  const [r, setR] = useState<LabResult | null>(null);

  const current = TESTS.find(t => t.id === test)!;
  const usesSex = test === 'hb' || test === 'pcv';

  function pickTest(id: TestId) {
    setTest(id); setUnit(TESTS.find(t => t.id === id)!.units[0]); setR(null); setError('');
  }

  function run() {
    setError(''); setR(null);
    const n = Number(value.trim().replace(',', '.'));
    if (value.trim() === '' || !Number.isFinite(n)) return setError('Enter your result as a number.');
    const out = assessLab({ test, value: n, unit, sex, pregnancy: usesSex && sex === 'female' ? pregnancy : 'no' });
    if ('error' in out) return setError(out.error);
    setR(out);
  }

  return (
    <ToolShell
      onSubmit={run}
      error={error}
      result={r && (
        <div>
          <Answer>{r.headline}</Answer>
          <p className="mt-1 text-sm text-muted-ink">{r.alsoShown}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{r.details.map(d => <li key={d}>{d}</li>)}</ul>
          <Notice tone={TONE[r.category]} title="Range used">{r.rangeText}. Reference ranges differ between laboratories, ages and methods. Use the range printed on your own report first.</Notice>
          <Notice tone="caution" title="One result is not a diagnosis">Bring the result to a clinician, who will read it alongside your symptoms and other tests.</Notice>
        </div>
      )}
    >
      <SelectField label="Which test?" value={test} onChange={pickTest} options={TESTS.map(t => ({ value: t.id, label: t.label }))} />
      <div className="grid grid-cols-2 items-end gap-4">
        <NumberField label="Your result" value={value} onChange={v => { setValue(v); setR(null); }} step={0.01} min={0} />
        <SelectField label="Unit" value={unit} onChange={v => { setUnit(v); setR(null); }} options={current.units.map(u => ({ value: u, label: u }))} />
      </div>
      {usesSex && (
        <SelectField label="Sex at birth" value={sex} onChange={v => { setSex(v); setR(null); if (v === 'male') setPregnancy('no'); }} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
      )}
      {usesSex && sex === 'female' && (
        <SelectField label="Pregnant?" value={pregnancy} onChange={v => { setPregnancy(v); setR(null); }} options={[
          { value: 'no', label: 'Not pregnant' },
          { value: 'first-third', label: 'Pregnant: first or third trimester' },
          { value: 'second', label: 'Pregnant: second trimester' },
        ]} />
      )}
      <Submit>Explain my result</Submit>
    </ToolShell>
  );
}
