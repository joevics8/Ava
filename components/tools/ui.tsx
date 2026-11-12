'use client';
// Shared building blocks for every tool UI. Inputs live in component state only:
// never in the URL, never sent to a server, never logged (CLAUDE.md privacy rule).
import { useId } from 'react';

export const inputCls = 'h-12 w-full rounded-xl border border-input bg-white px-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-wash p-5 sm:p-6">{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="text-sm font-semibold">
      <label htmlFor={id}>{label}</label>
      <div className="mt-1">{children(id)}</div>
      {hint && <p className="mt-1 text-xs font-normal text-muted-ink">{hint}</p>}
    </div>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options, hint }: {
  label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {id => (
        <select id={id} value={value} onChange={e => onChange(e.target.value as T)} className={inputCls}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

export function DateField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return <Field label={label} hint={hint}>{id => <input id={id} type="date" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />}</Field>;
}

export function NumberField({ label, value, onChange, min, max, step, hint, unit }: {
  label: string; value: string; onChange: (v: string) => void; min?: number; max?: number; step?: number; hint?: string; unit?: string;
}) {
  return (
    <Field label={unit ? `${label} (${unit})` : label} hint={hint}>
      {id => <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={e => onChange(e.target.value)} className={inputCls} />}
    </Field>
  );
}

export function Submit({ children }: { children: React.ReactNode }) {
  return <button type="submit" className="h-12 w-full rounded-full bg-primary text-base font-semibold text-paper transition-colors hover:bg-deep">{children}</button>;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  return children ? <p role="alert" className="mt-3 text-sm font-medium text-destructive">{children}</p> : null;
}

export function Result({ children }: { children?: React.ReactNode }) {
  return children ? <div className="mt-5 border-t border-line pt-4" aria-live="polite">{children}</div> : null;
}

/** Big headline answer. */
export function Answer({ children }: { children: React.ReactNode }) {
  return <p className="font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">{children}</p>;
}

/** Tone: info (neutral), caution (see a clinician), urgent (act now). */
export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'caution' | 'urgent'; title?: string; children: React.ReactNode }) {
  const cls = tone === 'urgent' ? 'border-destructive/50 bg-destructive/5' : tone === 'caution' ? 'border-marigold bg-marigold/10' : 'border-line bg-white';
  return (
    <div className={`mt-3 rounded-xl border p-3 text-sm leading-relaxed ${cls}`} role={tone === 'urgent' ? 'alert' : undefined}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export const PRIVACY = 'Private: calculated in your browser, nothing is saved.';
export const NOT_MEDICAL = 'General information, not medical advice or a diagnosis. Talk to a clinician about your own situation.';

/** Wrapper: form + result + privacy line. */
export function ToolShell({ onSubmit, children, result, error }: { onSubmit: () => void; children: React.ReactNode; result?: React.ReactNode; error?: string }) {
  return (
    <Card>
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4" noValidate>{children}</form>
      <ErrorText>{error}</ErrorText>
      <Result>{result}</Result>
      <p className="mt-4 text-sm text-muted-ink">{PRIVACY} {NOT_MEDICAL}</p>
    </Card>
  );
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
